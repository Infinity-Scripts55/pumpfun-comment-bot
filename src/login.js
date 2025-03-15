import fetch from "node-fetch";
import chalk from "chalk";
import signAndEncodeSignature from "./signAndEncodeSignature.js";
import { createWallet, readWallets, readDev } from "./genWallets.js";
import { extractCookies, genUA, generateSecChUa } from "./constants.js";
import { getRandomProxy, createProxyAgent } from './proxyHandler.js';

const BASE_URL = "https://frontend-api-v3.pump.fun";
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;
const USER_AGENT = genUA();
const COMMON_HEADERS = {
    "Content-Type": "application/json",
    "Accept": "*/*",
    "Origin": "https://pump.fun",
    "Referer": "https://pump.fun/",
    "User-Agent": USER_AGENT,
    "Sec-Ch-Ua": generateSecChUa(USER_AGENT),
    "Sec-Fetch-Dest": "empty",
};

class SignInError extends Error {
    constructor(message, type, originalError = null) {
        super(message);
        this.name = 'SignInError';
        this.type = type;
        this.originalError = originalError;
    }
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url, options = {}, retryCount = 0) {
    try {
        const proxy = getRandomProxy();
        const response = await fetch(url, {
            headers: COMMON_HEADERS,
            ...options,
            ...(proxy && { agent: createProxyAgent(proxy) })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new SignInError(
                `HTTP error! status: ${response.status}, body: ${errorBody}`,
                'HTTP_ERROR',
                { status: response.status, body: errorBody }
            );
        }

        return response;
    } catch (error) {
        if (retryCount < MAX_RETRIES) {
            console.log(chalk.yellow(`Attempt ${retryCount + 1} failed, retrying in ${RETRY_DELAY / 1000}s...`));
            await sleep(RETRY_DELAY);
            return fetchWithRetry(url, options, retryCount + 1);
        }
        throw error;
    }
}

async function signIntoPump(pubKey, privKey, retryCount = 0) {
    try {
        const { signature, timestamp } = await signAndEncodeSignature(privKey);
        const payload = { address: pubKey, signature, timestamp };

        const response = await fetchWithRetry(`${BASE_URL}/auth/login`, {
            method: "POST",
            body: JSON.stringify(payload),
        });

        const cookieString = response.headers.get('set-cookie');
        const cookies = extractCookies(cookieString);

        if (!cookies.auth_token) {
            throw new SignInError(
                "Auth token not found in response cookies",
                'AUTH_TOKEN_MISSING',
                { headers: response.headers.raw() }
            );
        }

        console.log(chalk.magenta("Signed in successfully with wallet:", pubKey));
        return cookies;
    } catch (error) {
        if (error instanceof SignInError) throw error;

        throw new SignInError(
            `Failed to sign in: ${error.message}`,
            'SIGN_IN_FAILED',
            error
        );
    }
}

async function getAwsToken(pubKey, cookies, retryCount = 0) {
    try {
        const awsTokenURL = `${BASE_URL}/token/generateTokenForThread?user=${pubKey}`;
        const cookieString = Object.entries(cookies)
            .map(([name, value]) => `${name}=${value}`)
            .join('; ');

        const response = await fetchWithRetry(awsTokenURL, {
            method: "GET",
            headers: {
                ...COMMON_HEADERS,
                "Cookie": cookieString
            },
        });

        const awsResp = await response.json();
        if (!awsResp.token) {
            throw new SignInError(
                "AWS token not found in response",
                'AWS_TOKEN_MISSING',
                awsResp
            );
        }

        return awsResp.token;
    } catch (error) {
        if (error instanceof SignInError) throw error;

        throw new SignInError(
            `Failed to get AWS token: ${error.message}`,
            'AWS_TOKEN_FAILED',
            error
        );
    }
}

async function signIn(walletMethod, retryCount = 0) {
    try {
        const wallet = await walletMethod();
        if (!wallet || !wallet.pubKey || !wallet.privKey) {
            throw new SignInError(
                "Invalid wallet data",
                'INVALID_WALLET'
            );
        }

        let lastError;
        for (let i = 0; i <= MAX_RETRIES; i++) {
            try {
                const cookies = await signIntoPump(wallet.pubKey, wallet.privKey);
                const awsToken = await getAwsToken(wallet.pubKey, cookies);
                return { cookies, awsToken };
            } catch (error) {
                lastError = error;
                if (i < MAX_RETRIES) {
                    console.log(chalk.yellow(
                        `Sign-in attempt ${i + 1} failed, retrying in ${RETRY_DELAY / 1000}s...`
                    ));
                    await sleep(RETRY_DELAY);
                }
            }
        }

        throw lastError;
    } catch (error) {
        console.error(chalk.red(`Sign-in failed after ${MAX_RETRIES + 1} attempts:`));
        console.error(chalk.red(`- Type: ${error.type || 'UNKNOWN'}`));
        console.error(chalk.red(`- Message: ${error.message}`));
        if (error.originalError) {
            console.error(chalk.red('- Original error:', error.originalError));
        }
        throw error;
    }
}

export const signInRandom = () => signIn(createWallet);
export const signInUser = (index) => {
    const walletMethod = async () => {
        try {
            const wallets = await readWallets();
            if (!wallets || !Array.isArray(wallets) || index >= wallets.length) {
                throw new SignInError(
                    "No valid wallet found at specified index",
                    'WALLET_NOT_FOUND'
                );
            }
            return wallets[index];
        } catch (error) {
            if (error instanceof SignInError) throw error;
            throw new SignInError(
                `Failed to read wallet: ${error.message}`,
                'WALLET_READ_ERROR',
                error
            );
        }
    };
    return signIn(walletMethod);
};
export const signInDev = () => signIn(readDev);