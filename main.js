import chalk from 'chalk';
import fs from 'fs';
import readline from 'readline';
import axios from 'axios';

import comment from './src/comment.js';
import like from './src/like.js';
import { signInDev, signInRandom, signInUser } from './src/login.js';
import parseMints from './src/parseMints.js';
import shill from './src/shill.js';
import commentThread from './src/thread.js';
import uploadImg from './src/uploadImg.js';
import mintListener from './src/newTokenShill.js';
import { CAPTCHA_KEY } from './src/constants.js';

process.removeAllListeners("warning");
process.removeAllListeners("ExperimentalWarning");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on("SIGINT", () => {
    process.exit();
});

async function checkBalance() {
    const url = `https://api.capsolver.com/getBalance`;
    const capkey = CAPTCHA_KEY;
    if (!capkey) {
        return;
    }
    try {
        const response = await axios.post(url, {
            clientKey: CAPTCHA_KEY
        });

        if (response.status === 200) {
            console.log(chalk.blue(`CapSolver Balance: ${response.data.balance} USD`));
        }
        
    } catch (error) {
        console.error(chalk.red("Error checking balance:", error));
    }
}

const ascii = fs.readFileSync("ascii.txt", "utf8");
console.log(chalk.green(ascii));

async function promptUser(question) {
    return new Promise((resolve) => {
        rl.question(question, resolve);
    });
}

async function randomWallets() {
    const amount = await promptUser(chalk.cyan("How Many Comments Do You Wish To Leave (number): "));
    const delay = await promptUser(chalk.yellow("Enter Delay MS (1000 = 1s): "));
    const mint = await promptUser(chalk.magenta("Enter Target Mint: "));

    console.log(chalk.greenBright("Starting Comment Bot..."));

    for (let i = 0; i < amount; i++) {
        const { cookies, awsToken } = await signInRandom();
        const success = await comment(mint, cookies, awsToken);

        if (!success) {
            console.log(chalk.yellowBright("Skipping to next comment due to error."));
        }

        await new Promise((resolve) => setTimeout(resolve, parseInt(delay)));

        if (i + 1 === parseInt(amount)) {
            console.log(chalk.blueBright("Finished Commenting"));
        }
    }
}

async function userWallets() {
    const amount = await promptUser(chalk.cyan("How Many Comments Do You Wish To Leave (number): "));
    const delay = await promptUser(chalk.yellow("Enter Delay MS (1000 = 1s): "));
    const mint = await promptUser(chalk.magenta("Enter Target Mint: "));

    console.log(chalk.greenBright("Starting Comment Bot..."));

    for (let i = 0; i < amount; i++) {
        const { cookies, awsToken } = await signInUser(i);
        const success = await comment(mint, cookies, awsToken);

        if (!success) {
            console.log(chalk.yellowBright("Skipping to next comment due to error."));
        }

        await new Promise((resolve) => setTimeout(resolve, parseInt(delay)));

        if (i + 1 === parseInt(amount)) {
            console.log(chalk.blueBright("Finished Commenting"));
        }
    }
}

async function likeReplies() {
    const mint = await promptUser(chalk.magenta("Enter Target Mint: "));
    const numWallets = await promptUser(chalk.cyan("How Many Wallets Do You Wish To Use (number): "));
    console.log(chalk.greenBright("Starting Like Bot..."));

    const { cookies, awsToken } = await signInDev();
    await like(mint, cookies);

    for (let i = 0; i < numWallets; i++) {
        const { cookies, awsToken } = await signInRandom();
        await like(mint, cookies);
    }

    console.log(chalk.blueBright("Finished Liking Comments"));
}

async function shillWallets() {
    const amount = await promptUser(chalk.cyan("How Many Comments Do You Wish To Leave (number): "));
    const delay = await promptUser(chalk.yellow("Enter Delay MS (1000 = 1s): "));
    const choice = await promptUser(chalk.magenta("Do You Wish To Use Dev Wallet Or Random Wallet? (d/r): "));

    if (choice.toLowerCase() !== "d" && choice.toLowerCase() !== "r") {
        console.log(chalk.red("Invalid choice. Please try again."));
        return;
    }

    console.log(chalk.greenBright("Starting Shill Mode..."));
    const mints = await parseMints(amount);
    console.log(chalk.greenBright(mints.length, "Mints fetched successfully"));

    let cookies;
    let awsToken;
    if (choice.toLowerCase() === "d") {
        ({ cookies, awsToken } = await signInDev());
    }

    let successfulComments = 0;

    for (let i = 0; i < parseInt(amount); i++) {
        if (choice.toLowerCase() === "r") {
            ({ cookies, awsToken } = await signInRandom());
        }

        if (mints[i] === undefined || typeof mints[i] !== "string") {
            console.log(chalk.red("Invalid mint. Skipping to next comment."));
            continue;
        }

        const success = await shill(mints[i], cookies, awsToken);

        if (success) {
            successfulComments++;
        } else {
            console.log(chalk.yellowBright("Skipping to next comment due to error.\n"));
        }

        await new Promise((resolve) => setTimeout(resolve, parseInt(delay)));

        if (i + 1 === parseInt(amount)) {
            console.log(chalk.blueBright("Finished Commenting"));
        }
    }

    console.log(chalk.greenBright(`Total successful comments: ${successfulComments}`));
}

async function threadMode() {
    try {
        const mint = await promptUser(chalk.magenta("Enter Target Mint: "));
        const walletType = await promptUser(chalk.cyan("Do You Wish To Use Dev Wallet Or Random Wallet? (d/r): "));

        if (walletType.toLowerCase() !== "d" && walletType.toLowerCase() !== "r") {
            console.log(chalk.red("Invalid choice. Please try again."));
            return;
        }

        let cookies;
        let awsToken;
        if (walletType.toLowerCase() === "d") {
            ({ cookies, awsToken } = await signInDev());
        } else {
            ({ cookies, awsToken } = await signInRandom());
        }

        await commentThread(mint, cookies, awsToken);
        console.log(chalk.blueBright("Thread Mode Completed"));
    } catch (error) {
        console.error(chalk.red("An error occurred in Thread Mode:", error));
    }
}

async function main() {
    await checkBalance();

    while (true) {
        try {
            console.log(chalk.yellow("\nOptions:"));
            console.log(chalk.green("1. Random Wallet Comments"));
            console.log(chalk.blue("2. User Wallet Comments"));
            console.log(chalk.magenta("3. Like Comments"));
            console.log(chalk.cyan("4. Shill KOTH / New Trades"));
            console.log(chalk.yellow("5. Thread Mode"));
            console.log(chalk.green("6. Shill New Tokens"));
            console.log(chalk.dim("7. Upload Image"));
            console.log(chalk.red("8. Exit"));

            const option = await promptUser(chalk.cyan("\nEnter your choice (1-8): "));
            let currentListener = null;

            switch (option) {
                case "1": await randomWallets(); break;
                case "2": await userWallets(); break;
                case "3": await likeReplies(); break;
                case "4": await shillWallets(); break;
                case "5": await threadMode(); break;
                case "6":
                    if (currentListener) {
                        console.log(chalk.yellow("Stopping previous listener..."));
                        connection.removeOnLogsListener(currentListener);
                    }
                    currentListener = mintListener();
                    console.log(chalk.green("Mint listener started. Press any key to return to the menu."));
                    await new Promise(resolve => process.stdin.once('data', resolve));
                    break;
                case "7": await uploadImg(); break;
                case "8":
                    console.log(chalk.yellow("Exiting application..."));
                    rl.close();
                    process.exit(0);
                default:
                    console.log(chalk.red("Invalid option. Please try again."));
            }

            await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
            console.error(chalk.red("An error occurred:", error));
        }
    }
}

main().catch(error => {
    console.error(chalk.red("Fatal error:", error));
    process.exit(1);
});