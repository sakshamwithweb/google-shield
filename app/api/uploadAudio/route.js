import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

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
    const audioPath = path.resolve(process.cwd(), 'public', 'uploads');
    const filePath = path.join(audioPath, `${uid}.mp3`);

    if (!fs.existsSync(audioPath)) {
      fs.mkdirSync(audioPath, { recursive: true });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    const req1=await fetch('http://localhost:3000/api/uploadAudioInGithub', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filePath, fileName: uid }),
    });
    const resa=await req1.json();
    
    return NextResponse.json({ message: 'Audio uploaded successfully',link:resa.link });
  } catch (error) {
    console.error('Error uploading audio:', error);
    return NextResponse.json({ error: 'Audio upload failed' }, { status: 500 });
  }
}
