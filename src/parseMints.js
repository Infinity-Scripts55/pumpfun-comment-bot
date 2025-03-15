import fetch from "node-fetch";
import chalk from "chalk";

const URLS = {
    recentTrades: (limit) => `https://frontend-api-v3.pump.fun/coins?offset=0&limit=${limit}&sort=last_trade_timestamp&order=DESC&includeNsfw=true`,
    kingOfTheHill: "https://frontend-api-v3.pump.fun/coins/king-of-the-hill?includeNsfw=true",
    liveCoins: "https://frontend-api-v3.pump.fun/coins/currently-live?limit=50&offset=0&includeNsfw=true"
};

async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Status: ${response.status}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(chalk.redBright(`Failed to fetch data from ${url}:`, error.message));
        return null;
    }
}

function extractMints(data) {
    return Array.isArray(data)
        ? data.map(coin => coin.mint)
        : data?.mint ? [data.mint] : [];
}

async function getLatest(limit) {
    const urls = [URLS.recentTrades(limit), URLS.kingOfTheHill, URLS.liveCoins];
    try {
        const results = await Promise.all(urls.map(fetchData));
        const coins = results
            .filter(data => data)
            .flatMap(extractMints);

        return [...new Set(coins)];
    } catch (error) {
        console.error(chalk.redBright("An error occurred while fetching data:", error));
        return [];
    }
}

export default getLatest;
