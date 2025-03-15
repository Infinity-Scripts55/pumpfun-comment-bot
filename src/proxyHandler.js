import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import fs from 'fs';

function getRandomProxy() {
    const proxies = fs.readFileSync('proxies.txt', 'utf-8')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line !== '');

    if (proxies.length === 0) {
        return null;
    }

    const randomIndex = Math.floor(Math.random() * proxies.length);
    const selectedProxy = proxies[randomIndex];

    return selectedProxy;
}

function createProxyAgent(proxyString) {
    const parts = proxyString.split(':');
    const [type, host, port, username, password] = parts.length === 5 ? parts : ['http', ...parts];

    const proxyUrl = username && password
        ? `${type}://${username}:${password}@${host}:${port}`
        : `${type}://${host}:${port}`;

    if (type === 'socks5') {
        return new SocksProxyAgent(proxyUrl);
    } else {
        return new HttpsProxyAgent(proxyUrl);
    }
}

export { getRandomProxy, createProxyAgent };
