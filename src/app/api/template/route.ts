import { gemini } from '@/lib/gemini';
import { currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const user = await currentUser();
    if (!user)
        return NextResponse.json({ error: "Unauthorized access denied." }, { status: 401 });
    const { prompt } = await req.json() as any;

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

export const runtime = "edge";