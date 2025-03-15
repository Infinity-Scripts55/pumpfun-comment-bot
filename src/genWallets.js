import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import fs from 'fs';

async function createWallet() {
    const keypair = Keypair.generate();
    const privateKey = bs58.encode(keypair.secretKey);
    const publicKey = keypair.publicKey.toString();

    const wallet = {
        pubKey: publicKey,
        privKey: privateKey,
        keypair: keypair
    }
    return wallet;    
}

async function readWallets() {
    const rawData = fs.readFileSync("./wallets.txt", "utf8");
    const lines = rawData.trim().split("\n");
    let wallets = [];
    lines.forEach(line => {
        const parts = line.split(':');
        if (parts.length === 2) {
            line = line.replace(/\r$/, '');
            const publicKey = parts[0];
            const privateKey = parts[1];
            const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
            const wallet = {
                pubKey: publicKey,
                privKey: privateKey,
                keypair: keypair
            };
            wallets.push(wallet);
        }
    });
    return wallets;
}

async function readDev() {
    const rawData = fs.readFileSync("./dev.txt", "utf8");
    const parts = rawData.split(':');
    if (parts.length === 2) {
        const publicKey = parts[0];
        const privateKey = parts[1];
        const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
        const wallet = {
            pubKey: publicKey,
            privKey: privateKey,
            keypair: keypair
        };
        return wallet;
    }
}

export { createWallet, readWallets, readDev };