import axios from "axios";
import FormData from "form-data";
import fs from "fs/promises";
import path from "path";

const PUMP_FUN_API_URL = "https://pump.fun/api/ipfs";
const AUTH_TOKEN = '';

async function fetchImage() {
    const imageExtensions = [
        ".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".tiff",
        ".tif", ".svg", ".ico", ".heic", ".heif", ".avif", ".jfif",
    ];
    const files = await fs.readdir("./img");

    const imageFiles = files.filter((file) =>
        imageExtensions.includes(path.extname(file).toLowerCase())
    );

    if (imageFiles.length === 0) {
        console.log("No image found in the img folder");
        return;
    }
    if (imageFiles.length > 1) {
        console.log(
            "Multiple images found in the img folder, please only keep one image"
        );
        return;
    }

    return {
        data: await fs.readFile(`./img/${imageFiles[0]}`),
        filename: imageFiles[0],
    };
}

async function uploadToPumpFun(file, filename) {
    const formData = new FormData();
    formData.append("file", file, filename);

    const headers = {
        accept: "*/*",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "en-US,en;q=0.9",
        origin: "https://pump.fun",
        referer: "https://pump.fun/create",
        "sec-ch-ua": '"Chromium";v="128", "Not;A=Brand";v="24", "Brave";v="128"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "sec-gpc": "1",
        "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        Cookie: `auth_token=${AUTH_TOKEN}`,
    };

    try {
        const response = await axios.post(PUMP_FUN_API_URL, formData, {
            headers: {
                ...headers,
                ...formData.getHeaders(),
            },
        });

        return response.data;
    } catch (error) {
        console.error(
            "Error uploading to pump.fun:",
            error.response?.data || error.message
        );
        throw error;
    }
}

async function updateMetadataFile(metadata) {
    const metadataPath = "metadata.json";
    try {
        await fs.access(metadataPath);
        const existingMetadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
        const updatedMetadata = { ...existingMetadata, ...metadata };
        await fs.writeFile(metadataPath, JSON.stringify(updatedMetadata, null, 2));
        console.log("Metadata file updated successfully");
    } catch (error) {
        if ((error).code === 'ENOENT') {
            await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
            console.log("New metadata file created");
        } else {
            console.error("Error updating metadata file:", error);
            throw error;
        }
    }
}

async function uploadImg() {
    try {
        const img = await fetchImage();

        if (!img) {
            console.log("No image found in the img folder");
            return;
        }

        const response = await uploadToPumpFun(img.data, img.filename);
        const metadata = response.metadata;

        if (metadata) {
            await updateMetadataFile(metadata);
            console.log("Metadata URI: ", metadata.image);
            return metadata.image;
        } else {
            console.log("No metadata received from pump.fun");
            return null;
        }
    } catch (error) {
        console.error("Error in uploadMD function:", error);
        return null;
    }
}

export default uploadImg;