import fetch from "node-fetch";
import fs from 'fs';
import chalk from 'chalk';
import { getRandomProxy, createProxyAgent } from './proxyHandler.js';
import { COMMENT_URL, HEADERS_BASE, generateSecChUa, genUA } from './constants.js';


async function comment(target, cookies, awsToken) {
    const proxy = getRandomProxy();
    const userAgent = genUA();
    //const capToken = await getCaptchaToken(proxy);
    //if (!capToken) return false;

    const commentToLeave = await randomComment();

    const payload = JSON.stringify({
        text: commentToLeave,
        mint: target.toString()
    });

    /*
    const cookieString = Object.entries(cookies)
        .map(([name, value]) => `${name}=${value}`)
        .join('; ');
    */

    const headers = {
        ...HEADERS_BASE,
        "User-Agent": userAgent,
        "X-Aws-Proxy-Token": awsToken,
        "Sec-Ch-Ua": generateSecChUa(userAgent)
    };

    const fetchConfig = {
        method: 'POST',
        headers,
        body: payload,
        ...(proxy && { agent: createProxyAgent(proxy) })
    };

    try {
        const response = await fetch(COMMENT_URL, fetchConfig);
        if (!response.ok) {
            console.error(chalk.redBright("Failed to comment. Response not ok:", await response.text()));
            return false;
        }
        console.log(chalk.greenBright("Commented:", commentToLeave));
        console.log(chalk.blueBright(`On: https://pump.fun/${target}`));
        console.log(chalk.yellowBright(`Proxy used: ${proxy || 'None'}`));
        return true;
    } catch (error) {
        console.error(chalk.redBright("Comment error:", error));
        return false;
    }
}

async function randomComment() {
    const comments = fs.readFileSync('comments.txt').toString().split("\n");
    return comments[Math.floor(Math.random() * comments.length)];
}

export default comment;
