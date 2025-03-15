import fetch from "node-fetch";
import fs from 'fs';
import chalk from 'chalk';
import { PublicKey } from "@solana/web3.js";
import { signInRandom } from "./login.js";
import { getRandomProxy, createProxyAgent } from './proxyHandler.js';
import { generateSecChUa, genUA, HEADERS_BASE, COMMENT_URL, loadMetadata, connection, shillComment} from './constants.js';


function mintListener() {
    console.log('Monitoring for new pumps...');
    const listener = connection.onLogs(
        new PublicKey('6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P'),
        async ({ logs, err, signature }) => {
            if (err) return;
            if (logs && logs.some((log) => log.includes('InitializeMint2'))) {
                console.log(chalk.blue('New coin launched at:'));
                console.log(chalk.blue(`https://solscan.io/tx/${signature}`));
                console.log(chalk.yellow('Delaying to avoid comment removal...'));
                try {
                    await shillNewLaunches(signature);
                } catch (e) {
                    console.log('Error Found:', e);
                }
            }
        },
        'confirmed'
    );
    return listener;
}

async function shillNewLaunches(signature, retry = true) {
    await new Promise(resolve => setTimeout(resolve, 20000));
    const tx = await connection.getParsedTransaction(signature, { commitment: 'confirmed', maxSupportedTransactionVersion: 0 });
    const accounts = tx?.transaction.message.instructions
        .find(ix => ix.programId.toBase58() === '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P')?.accounts;

    if (!accounts || accounts.length === 0) {
        console.log('No accounts found in the transaction.');
        if (retry) setTimeout(() => shillNewLaunches(signature, false), 4000);
        return;
    }

    const target = accounts[0].toBase58();
    const {cookies, awsToken} = await signInRandom();
    const proxy = getRandomProxy();
    const userAgent = genUA();

    const fileUri = await loadMetadata();
    const payload = JSON.stringify({
        fileUri,
        text: await shillComment(),
        mint: target
    });

    //const cookieString = Object.entries(cookies).map(([name, value]) => `${name}=${value}`).join('; ');
    const headers = {
        ...HEADERS_BASE,
        "User-Agent": userAgent,
        "sec-ch-ua": generateSecChUa(userAgent),
        "X-Aws-Proxy-Token": awsToken
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
            return;
        }
        console.log(chalk.greenBright("Commented successfully on:", target));
    } catch (error) {
        console.error(chalk.redBright("Shill error:", error));
    }
}
export default mintListener;