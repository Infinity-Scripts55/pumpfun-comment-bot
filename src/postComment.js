import fetch from "node-fetch";
import chalk from 'chalk';
import { getRandomProxy, createProxyAgent } from './proxyHandler.js';
import UserAgent from 'user-agents';
import loadMetadata from "./loadMetadata.js";

const COMMENT_URL = "https://client-proxy-server.pump.fun/comment";
const TIMEOUT_MS = 10000;

const HEADERS_BASE = {
    "Accept": "*/*",
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "Accept-Language": "en-US,en;q=0.9,en-GB-oxendict;q=0.8,en-GB;q=0.7",
    "Authority": "client-proxy-server.pump.fun",
    "Content-Type": "application/json",
    "Origin": "https://pump.fun",
    "Referer": "https://pump.fun/",
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": "\"Windows\"",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-site"
};

function generateSecChUa(userAgent) {
    const chromeVersionMatch = userAgent.match(/Chrome\/(\d+)/);
    if (!chromeVersionMatch) {
        return null;
    }

    const chromeVersion = chromeVersionMatch[1];
    const secChUaHeader = `"Chromium";v="${chromeVersion}", "Google Chrome";v="${chromeVersion}", "Not?A_Brand";v="99"`;

    return secChUaHeader;
}

async function fetchWithTimeout(url, options) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error(`Request timed out after ${TIMEOUT_MS}ms`);
        }
        throw error;
    }
}

async function postReply(target, cookies, awsToken, comment, useImg = false) {
    const proxy = getRandomProxy();
    const userAgent = new UserAgent({ deviceCategory: 'desktop' }).toString();
    const secChUa = generateSecChUa(userAgent);

    console.log(userAgent);

    let payload = JSON.stringify({
        text: comment,
        mint: target.toString()
    });

    if (useImg) {
        const img = await loadMetadata();
        payload = JSON.stringify({
            text: comment,
            mint: target.toString(),
            fileUri: img,
        });
    }

    const cookieString = Object.entries(cookies)
        .map(([name, value]) => `${name}=${value}`)
        .join('; ');

    const headers = {
        ...HEADERS_BASE,
        "User-Agent": userAgent,
        "Sec-Ch-Ua": secChUa,
        "X-Aws-Proxy-Token": awsToken,
        "Cookie": cookieString
    };

    const fetchConfig = {
        method: 'POST',
        headers,
        body: payload,
        redirect: 'manual',
        follow: 0,
        ...(proxy && { agent: createProxyAgent(proxy) })
    };

    try {
        const response = await fetchWithTimeout(COMMENT_URL, fetchConfig);

        if (response.status >= 300 && response.status < 400) {
            console.log(chalk.yellowBright(`Redirect attempted (${response.status}). Location:`, response.headers.get('location')));
            return false;
        }

        if (!response.ok) {
            console.error(chalk.redBright("Failed to comment. Response not ok:", await response.text()));
            return false;
        }

        console.log(response.status);
        console.log(chalk.greenBright("Commented:", commentToLeave));
        console.log(chalk.blueBright(`On: https://pump.fun/${target}`));
        console.log(chalk.yellowBright(`Proxy used: ${proxy || 'None'}`));
        return true;
    } catch (error) {
        if (error.message.includes('timed out')) {
            console.error(chalk.redBright(`Proxy timeout: ${proxy}`));
        } else {
            console.error(chalk.redBright("Comment error:", error.message));
        }
        return false;
    }
}

export { postReply };