
# Pump.Fun Comment Bot

CLI based comment bot for Pump.Fun by Infinity Scripts 

# Run Locally

### Clone the project

```bash
  git clone https://github.com/Infinity-Scripts55/pumpfun-comment-bot/
```

### Go to the project directory

```bash
  cd pumpfun-comment-bot
```

### Install dependencies

```bash
  npm install
```

### Start the script

```bash
  npm run dev
```


## Environment Variables

To run this project, you will need to populate the following environment variables to your .env file

`CAPTCHA_KEY`: Your Capsolver API KEY **(optional)**

`RPC_URL`: Solana RPC URL for monitoring new token creation events

`WS`: Solana RPC Websocket URL for monitoring new token creation events

### Make sure to fill out the ENV before starting the bot 
## Features

### 1. Random Wallets
Generate fresh wallets to post comments.
- **Parameters**:
  - Amount of Comments
  - Delay Between Comments (milliseconds | 1000ms = 1s)
  - Mint: The Mint (CA/Token Address) you wish to target

### 2. User Wallets
Post comments from the wallets in wallets.txt file.
- **Parameters**:
  - Amount of Comments
  - Delay Between Comments (milliseconds | 1000ms = 1s)
  - Mint: The Mint (CA/Token Address) you wish to target

### 3. Like Comments
Like all comments from dev & randomly generated wallets.
- **Parameters**:
  - Mint: The Mint (CA/Token Address) you wish to target
  - Amount: the amount of wallets to use to like the comments

### 4. Shill
Shills whatever you want on the most recently traded tokens (supports dev wallet or random wallet per task || supports images)
- **Parameters**:
  - Amount of Comments
  - Delay Between Comments (milliseconds | 1000ms = 1s)
  - Wallet Type: D = Dev Wallet / R = Random Wallets
- **Note**: PF loves to ban links, if you get mass errors, try to remove any links

### 5. Thread Mode
Parses all replies of a mint, prompts for the index of the comment to reply to (supports dev or random wallets)
- **Parameters**:
  - Mint: The Mint (CA/Token Address) you wish to target
  - Wallet Type: D = Dev Wallet / R = Random Wallet
  - Reply Index: Select the index of the comment you wish to reply to

### 6. Shill New Tokens
Monitors for new Pump.Fun Token Launches & Shills based on your shill.txt file contents

### 7. Upload Image
Uploads the image from /img folder to pump.fun (**REQUIRED TO RUN BEFORE ANY SHILL MODE / NEW IMAGE**)
Line 7 of UploadImage.js requires a PUMPFUN auth token const AUTH_TOKEN = ''; please provide your own. 

### 8. Exit
Exits the application
## Authors

- [Infinity Scripts](https://discord.gg/infinityscripts)

