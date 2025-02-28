import { NodeBasePrompt, ReactBasePrompt } from '@/data/BasePrompts';
import { BASE_PROMPT, getSystemPrompt } from '@/data/Prompt';
import { gemini } from '@/lib/gemini';
import { groq } from '@/lib/groq';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const { prompt } = await req.json();

    const messages = [
        ...prompt,
        {
            role: 'system', content: getSystemPrompt()
        }
    ]

    try {
        const result = await gemini.generateContent({
            contents: messages,  // Directly passing the user messages
            safetySettings: [],
            generationConfig: {
                maxOutputTokens: 8000,
            },
            systemInstruction: {
                role: "system",
                parts: [{ text: getSystemPrompt() }],
            },
        });

        const response = result.response;
        const text = response.text();

        return NextResponse.json({ response: text }, { status: 200 })
    }
    catch (error: any) {
        return NextResponse.json({ error: error }, { status: 500 });
    }
}