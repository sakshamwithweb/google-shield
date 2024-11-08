import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
    const {speechToText, time, weather, motion, safePlaces} = await request.json();
    const response = await openai.chat.completions.create({
        model: "chatgpt-4o-latest",
        messages: [{ role: "user", content: `Hey Chatgpt, I am a women and right now it is ${time} and the weather is ${weather}. I am ${motion} and safe places near me is ${safePlaces}. I have a query - ${speechToText}. I want you to give me possible and best actions as an array Please\nDon't use md anywhere.`}],
      });
      console.log( response.choices[0].message.content)
      return NextResponse.json({response: response.choices[0].message.content})
}