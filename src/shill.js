import fetch from "node-fetch";
import chalk from 'chalk';
import { getRandomProxy, createProxyAgent } from './proxyHandler.js';
import { generateSecChUa, loadMetadata, COMMENT_URL, HEADERS_BASE, genUA, shillComment } from './constants.js';


function parseCloudflareError(responseText) {
    try {
        if (responseText.includes('cloudflare')) {
            if (responseText.includes('rate limited')) return 'Rate limited by Cloudflare';
            if (responseText.includes('banned')) return 'IP banned temporarily';
            return 'Cloudflare protection triggered';
        }
        return 'Request failed';
    } catch {
        return 'Unknown error';
    }
}

async function shill(target, cookies, awsToken) {
    try {
        const proxy = getRandomProxy();
        const userAgent = genUA();

        const commentToLeave = await shillComment();
        const img = await loadMetadata();

        const payload = JSON.stringify({
            fileUri: img,
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

        const response = await fetch(COMMENT_URL, fetchConfig);

        if (!response.ok) {
            const errorText = await response.text();
            const errorMessage = parseCloudflareError(errorText);
            console.error(chalk.red(`Error ${response.status}: ${errorMessage}`));

            if (response.status === 429) {
                console.log(chalk.yellow('Retrying in 5 seconds...'));
                await new Promise(resolve => setTimeout(resolve, 5000));
                return false;
            }
            return false;
        }

        console.log(chalk.green(`✓ Comment posted`));
        console.log(chalk.yellow(`Comment: ${commentToLeave}`));
        console.log(chalk.blue(`URL: https://pump.fun/${target}`));

        return true;

    } catch (error) {
        console.error(chalk.red(`Failed to post comment: ${error.message}`));
        return false;
    }
}
export default shill;