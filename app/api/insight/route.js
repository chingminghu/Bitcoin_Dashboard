import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req) {
  try {
    const body = await req.json();
    const data = body.data || [];

    if (!data.length) {
      return Response.json(
        { success: false, error: "No data provided" },
        { status: 400 }
      );
    }

    const latest = data[data.length - 1];
    const first = data[0];

    const prompt = `
You are a financial dashboard assistant.

Given the following 30-day mNAV data for Strategy (MSTR), write a short summary in 120 words or less.

Focus on:
1. the overall mNAV trend
2. whether the company is trading above or below BTC NAV
3. how BTC price and market cap may explain the movement
4. do not provide financial advice

First day:
${JSON.stringify(first, null, 2)}

Latest day:
${JSON.stringify(latest, null, 2)}

Full data:
${JSON.stringify(data)}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: prompt,
    });

    return Response.json({
      success: true,
      summary: response.text,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}