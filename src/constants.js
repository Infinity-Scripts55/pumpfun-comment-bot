import { Connection } from "@solana/web3.js";
import dotenv from 'dotenv';
import fs from 'fs';
import axios from 'axios';
import chalk from 'chalk';
import UserAgent from 'user-agents';

dotenv.config();

export const COMMENT_URL = "https://client-proxy-server.pump.fun/comment";
export const HEADERS_BASE = {
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

export async function loadMetadata() {
    const md = JSON.parse(fs.readFileSync('./metadata.json'));
    const img = md.image;
    return img;
}

export const CAPTCHA_KEY = process.env.CAPTCHA_KEY;
export const RPC = process.env.RPC;
export const WS = process.env.WS;

export const connection = new Connection(RPC, {
    commitment: 'confirmed',
    wsEndpoint: WS,
});

export function generateSecChUa(userAgent) {
    const chromeVersionMatch = userAgent.match(/Chrome\/(\d+)/);
    if (!chromeVersionMatch) {
        return null;
    }
    const chromeVersion = chromeVersionMatch[1];
    const secChUaHeader = `"Chromium";v="${chromeVersion}", "Google Chrome";v="${chromeVersion}", "Not?A_Brand";v="99"`;
    return secChUaHeader;
}

export function genUA() {
    return new UserAgent({ deviceCategory: 'desktop' }).toString();
}

export async function checkBalance() {
    const url = `https://api.capsolver.com/getBalance`;
    try {
        const response = await axios.post(url, {
            clientKey: CAPTCHA_KEY
        });
        if (response.status === 200) {
            console.log(chalk.blue(`CapSolver Balance: ${response.data.balance} USD`));
        } else {
            console.log(chalk.red("Error checking balance:", response.data));
        }
    } catch (error) {
        console.log(chalk.red("Error checking balance:", error));
    }
}

export function extractCookies(cookieString) {
    const COOKIE_NAMES = ['cf_clearance', '__cf_bm', 'auth_token', '_ga', '_ga_T65NVS2TQ6', 'fs_lua', 'fs_uid'];
    const cookies = {};
    if (cookieString) {
        cookieString.split(',').forEach(cookie => {
            const [name, ...rest] = cookie.split('=');
            const trimmedName = name.trim();
            if (COOKIE_NAMES.includes(trimmedName)) {
                cookies[trimmedName] = rest.join('=').split(';')[0].trim();
            }
        });
    }
    return cookies;
}

export async function shillComment() {
    const comments = fs.readFileSync('shill.txt').toString().split("\n");
    return comments[Math.floor(Math.random() * comments.length)];
}

export async function randomComment() {
    const comments = fs.readFileSync('comments.txt').toString().split("\n");
    return comments[Math.floor(Math.random() * comments.length)];
}