import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

export const config = {
  api: {
    bodyParser: false,
  },
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
      const audioLink = `https://dubbed-audios.onrender.com/${fileName}`;
      return NextResponse.json({ message: 'Audio uploaded successfully', link: audioLink });
    } else {
      console.error('Error uploading file:', response.data);
      return NextResponse.error();
    }
  } catch (error) {
    console.error('Error uploading audio:', error);
    return NextResponse.error();
  }
}
