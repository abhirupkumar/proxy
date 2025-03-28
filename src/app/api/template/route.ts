import { gemini } from '@/lib/gemini';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const { prompt } = await req.json();

    try {
        const result = await gemini.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                maxOutputTokens: 200,
            },
            systemInstruction: {
                role: "system",
                parts: [{ text: "Return either node or react or nextjs based on what you think this project should be. Only return a single word either 'node' or 'react' or 'nextjs'. Do not return anything extra." }],
            },
        })
        const answer = result.response.text();
        return NextResponse.json({ template: answer.trim() }, { status: 200 });
    }
    catch (error: any) {
        return NextResponse.json({ error: error }, { status: 500 });
    }
}