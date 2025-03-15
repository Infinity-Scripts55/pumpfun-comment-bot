import axios from "axios";
import loadConfig from "./loadConfig.js";
import UserAgent from "user-agents";

const API_URL = "https://api.capsolver.com";
const HEADERS = {
    'Content-Type': 'application/json',
    'User-Agent': new UserAgent().toString(),
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://pump.fun'
};

function parseProxy(proxyString) {
    const parts = proxyString.split(':');
    if (parts.length === 5 || parts.length === 3) {
        return {
            proxyType: parts[0],
            proxyAddress: parts[1],
            proxyPort: parts[2],
            ...(parts[3] && { proxyLogin: parts[3] }),
            ...(parts[4] && { proxyPassword: parts[4] })
        };
    }
    return {
        proxyType: "http",
        proxyAddress: parts[0],
        proxyPort: parts[1],
        ...(parts[2] && { proxyLogin: parts[2] }),
        ...(parts[3] && { proxyPassword: parts[3] })
    };
}

async function solveCaptcha({ proxy = null } = {}) {
    const config = await loadConfig();
    const api_key = config.captchaKey;

    const taskType = proxy ? 'ReCaptchaV3EnterpriseTask' : 'ReCaptchaV3EnterpriseTaskProxyLess';
    let proxyPayload = {};

    if (proxy) {
        const parsedProxy = parseProxy(proxy);
        if (parsedProxy.proxyType) {
            proxyPayload = {
                proxyType: parsedProxy.proxyType,
                proxyAddress: parsedProxy.proxyAddress,
                proxyPort: parseInt(parsedProxy.proxyPort, 10),
                ...(parsedProxy.proxyLogin && { proxyLogin: parsedProxy.proxyLogin }),
                ...(parsedProxy.proxyPassword && { proxyPassword: parsedProxy.proxyPassword })
            };
        } else {
            proxyPayload.proxy = proxy;
        }
    }

    const payload = {
        clientKey: api_key,
        task: {
            type: taskType,
            websiteURL: 'https://pump.fun',
            websiteKey: '6LcmKsYpAAAAABAANpgK3LDxDlxfDCoPQUYm3NZI',
            pageAction: 'submit',
            minScore: 0.9,
            ...proxyPayload
        }
    };

    try {
        const { data } = await axios.post(`${API_URL}/createTask`, JSON.stringify(payload), {
            headers: HEADERS
        });
        const task_id = data.taskId;
        if (!task_id) {
            console.log("Failed to create task:", data);
            return null;
        }
        console.log("Got taskId:", task_id);

        return await pollForResult(api_key, task_id);
    } catch (error) {
        console.error("Error creating CAPTCHA task:", error.response?.data || error.message);
        return null;
    }
}

async function pollForResult(api_key, task_id) {
    while (true) {
        await new Promise(resolve => setTimeout(resolve, 350));

        const getResultPayload = { clientKey: api_key, taskId: task_id };
        try {
            const { data } = await axios.post(`${API_URL}/getTaskResult`, JSON.stringify(getResultPayload), {
                headers: HEADERS
            });
            if (data.status === "ready") return data.solution?.gRecaptchaResponse;
            if (data.status === "failed" || data.errorId) {
                console.log("Solve failed! response:", data);
                return null;
            }
        } catch (error) {
            console.error("Error polling CAPTCHA result:", error.response?.data || error.message);
            return null;
        }
    }
}

export const capsolverProxy = (proxy) => solveCaptcha({ proxy });
export const capsolver = () => solveCaptcha();