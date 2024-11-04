import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

export const config = {
  api: {
    bodyParser: false,
  },
};

const checkFileAvailability = async (fileName, maxRetries = 100, waitTime = 1000) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await axios.get(`https://dubbed-audios.onrender.com/${fileName}`);
      if (response.status === 200) {
        console.log(`Audio file is now available at: https://dubbed-audios.onrender.com/${fileName}`);
        return true; // File is available
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error(`Error checking file availability: ${error.message}`);
      }
    }

    // Wait before the next attempt
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  console.log(`Audio file is still not available after ${maxRetries} retries.`);
  return false; // File is not available after retries
};

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('audio');

    if (!file || !file.arrayBuffer) {
      return NextResponse.json({ error: 'Audio file not found' }, { status: 400 });
    }

    const uid = uuidv4();
    const fileName = `${uid}.mp3`;

    // Convert the audio file to base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Content = buffer.toString('base64');

    // Prepare the data for GitHub
    const data = {
      message: `Upload file: ${fileName}`,
      content: base64Content,
    };

    const headers = {
      Authorization: `token ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
    };

    // Upload to GitHub
    const response = await axios.put(`https://api.github.com/repos/sakshamwithweb/dubbed_audios/contents/${fileName}`, data, { headers });

    if (response.status === 201) {
      // Check if the audio file is available
      const isAvailable = await checkFileAvailability(fileName);

      if (isAvailable) {
        const audioLink = `https://dubbed-audios.onrender.com/${fileName}`;
        return NextResponse.json({ message: 'Audio uploaded successfully', link: audioLink });
      } else {
        return NextResponse.json({ error: 'Audio file not available after upload' }, { status: 500 });
      }
    } else {
      console.error('Error uploading file:', response.data);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error uploading audio:', error);
    return NextResponse.json({ error: 'Audio upload failed' }, { status: 500 });
  }
}
