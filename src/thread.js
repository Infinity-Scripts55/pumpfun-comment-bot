import fetch from "node-fetch";
import chalk from 'chalk';
import { getRandomProxy, createProxyAgent } from './proxyHandler.js';
import inquirer from 'inquirer';
import { generateSecChUa, genUA, HEADERS_BASE, COMMENT_URL, randomComment } from './constants.js';

function displayReplies(replies) {
    const maxIdLength = Math.max(...replies.map(reply => reply.ID.toString().length));
    const maxIndexLength = replies.length.toString().length;

    console.log(chalk.cyan('Parsed Replies:'));
    console.log(chalk.cyan('─'.repeat(process.stdout.columns)));

    replies.forEach((reply, index) => {
        const indexStr = index.toString().padStart(maxIndexLength);
        const idStr = reply.ID.toString().padStart(maxIdLength);
        const truncatedText = reply.text.length > 50 ? reply.text.substring(0, 47) + '...' : reply.text;

        console.log(chalk.yellow(`${indexStr}) `) + chalk.green(`[${idStr}] `) + chalk.white(truncatedText));
    });

    console.log(chalk.cyan('─'.repeat(process.stdout.columns)));
}

async function parseReplies(mint) {
    const url = `https://frontend-api-v3.pump.fun/replies/${mint}?limit=1000&offset=0&user=3xY264vE5PkyT4baV5o3epViUKfcSaijeEX8TV8EFrTz`;
    const headers = { "Content-Type": "application/json" };

    try {
        const response = await fetch(url, { method: "GET", headers });
        if (!response.ok) {
            console.error(chalk.redBright("Failed to parse replies:", await response.text()));
            return null;
        }
        const data = await response.json();
        const commentList = data.replies.map(comment => ({ ID: comment.id, text: comment.text }));
        console.log(chalk.greenBright(`Parsed ${data.replies.length} comments!`));
        displayReplies(commentList);
        return commentList;
    } catch (error) {
        console.error(chalk.redBright("parseReplies error:", error));
        return [];
    }
}

async function commentThread(target, cookies, awsToken) {
    const replies = await parseReplies(target);
    if (!replies || replies.length === 0) return false;

    const { index } = await inquirer.prompt([
        {
            type: 'input',
            name: 'index',
            message: chalk.yellow("Enter the index of the comment you want to reply to:"),
            validate: input => (input >= 0 && input < replies.length) ? true : 'Please enter a valid index'
        }
    ]);

    const commentID = replies[index].ID;
    const commentText = replies[index].text;
    const proxy = getRandomProxy();
    const userAgent = genUA();
    let comment = await randomComment();

    const payload = JSON.stringify({
        text: `#${commentID} ${comment}`,
        mint: target.toString()
    });


    //const cookieString = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
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
        console.log(chalk.greenBright(`Replied with "${comment}" on Comment "${commentText}"`));
        console.log(chalk.yellowBright(`Proxy used: ${proxy || 'None'}`));
        return true;
    } catch (error) {
        console.error(chalk.redBright("Comment error:", error));
        return false;
    }
}
export default commentThread;