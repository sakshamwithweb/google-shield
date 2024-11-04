import { NextResponse } from "next/server";
import fs from "fs";
import axios from "axios";

const uploadAudioFile = (filePath, fileName) => {
    return new Promise(async (resolve, reject) => {
        try {
            const fileContent = fs.readFileSync(filePath);
            const base64Content = Buffer.from(fileContent).toString('base64');

            const data = {
                message: `Upload file: ${fileName}.mp3`,
                content: base64Content,
            };

            const headers = {
                Authorization: `token ${process.env.GITHUB_TOKEN}`,
                Accept: 'application/vnd.github.v3+json',
            };

            const response = await axios.put(`https://api.github.com/repos/sakshamwithweb/dubbed_audios/contents/${fileName}.mp3`, data, { headers });

            if (response.status === 201) {
                await waitForAudioToBeAvailable(filePath, fileName);
                resolve();
            } else {
                console.error('Error uploading file:', response.data);
                reject('Upload failed');
            }
        } catch (error) {
            console.error('Error:', error.message);
            reject(error);
        }
    });
};

const waitForAudioToBeAvailable = (filePath, fileName) => {
    return new Promise(async (resolve, reject) => {
        const maxRetries = 100;
        const waitTime = 1000;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const response = await axios.get("https://dubbed-audios.onrender.com/" + fileName + ".mp3");
                if (response.status === 200) {
                    console.log(`Audio file is now available at: https://dubbed-audios.onrender.com/${fileName}.mp3`);
                    fs.unlinkSync(filePath);
                    resolve();
                    return;
                }
            } catch (error) {
                if (error.response?.status !== 404) {
                    console.error(`Error checking file availability: ${error.message}`);
                    fs.unlinkSync(filePath);
                }
            }

            await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        console.log(`Audio file is still not available after ${maxRetries} retries. Please check the URL manually.`);
        reject('Audio file not available');
    });
};

export async function POST(params) {
    const { filePath, fileName } = await params.json();
    const a = await uploadAudioFile(filePath, fileName);
    return NextResponse.json({ link: `https://dubbed-audios.onrender.com/${fileName}.mp3` });
}