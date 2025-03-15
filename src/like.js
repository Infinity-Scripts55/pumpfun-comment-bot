import fetch from "node-fetch";
import chalk from "chalk";

async function parseReplies(mint) {
    const url = `https://frontend-api-v3.pump.fun/replies/${mint}?limit=1000&offset=0&user=3xY264vE5PkyT4baV5o3epViUKfcSaijeEX8TV8EFrTz`;
    const headers = {
        "Content-Type": "application/json"
    };
    try {
        const response = await fetch(url, {
            method: "GET",
            headers: headers
        });

        if (!response.ok) {
            console.error(chalk.redBright("Failed to parse replies:", JSON.stringify(response, null, 2)));
            process.exit(1);
        }

        const data = await response.json();

        if (!data.replies || !Array.isArray(data.replies)) {
            console.error(chalk.redBright("Invalid response format: 'replies' array not found"));
            process.exit(1);
        }

        const commentIDs = data.replies.map(reply => reply.id);
        console.log(chalk.greenBright(`Parsed ${commentIDs.length} comments!`));
        return commentIDs;
    } catch (error) {
        console.log(chalk.redBright("Error parsing replies:", error));
        return [];
    }
}

async function likeComments(mint, cookies) {
    const commentIDs = await parseReplies(mint);

    if (commentIDs.length === 0) {
        return;
    }

    for (let i = 0; i < commentIDs.length; i++) {
        const commentID = commentIDs[i];
        const url = `https://frontend-api-v3.pump.fun/likes/${commentID}`;
        const cookieString = Object.entries(cookies)
            .map(([name, value]) => `${name}=${value}`)
            .join('; ');

        const headers = {
            "Accept": "*/*",
            "Accept-Encoding": "gzip, deflate, br, zstd",
            "Accept-Language": "en-US,en;q=0.9,en-GB-oxendict;q=0.8,en-GB;q=0.7",
            "Content-Type": "application/json",
            "Cookie": cookieString,
            "Origin": "https://pump.fun",
            "Referer": "https://pump.fun/",
            "Sec-Ch-Ua": "\"Microsoft Edge\";v=\"125\", \"Chromium\";v=\"125\", \"Not.A/Brand\";v=\"24\"",
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": "\"Windows\"",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-site",
        };

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: headers
            });

            if (!response.ok) {
                console.log(chalk.redBright(`Failed to like comment ${commentID}:`, JSON.stringify(response, null, 2)));
                continue;
            }

            console.log(chalk.greenBright(`Liked comment ${i + 1} of ${commentIDs.length}! (ID: ${commentID})`));

        } catch (error) {
            console.log(chalk.redBright(`Error liking comment ${commentID}:`, error));
            continue;
        }
    }
}

export default likeComments;