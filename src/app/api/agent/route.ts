import { NodeBasePrompt, ReactBasePrompt } from '@/data/BasePrompts';
import { BASE_PROMPT, getSystemPrompt } from '@/data/Prompt';
import { gemini } from '@/lib/gemini';
import { currentUser, verifyToken } from '@clerk/nextjs/server';
import { FunctionCallingMode, SchemaType, Tool } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

interface Message {
    "role": "user" | "assistant",
    "parts": [{ "text": string }]
}

export async function POST(req: NextRequest) {
    const user = await currentUser();
    if (!user)
        return NextResponse.json({ error: "Unauthorized access denied." }, { status: 401 });

    const { messages, tool } = await req.json() as { messages: any, tool: any };

    try {

        const result = await gemini.generateContent({
            contents: messages,
            generationConfig: {
                temperature: 0.5,
                topP: 0.8,
            },
            systemInstruction: {
                role: "system",
                parts: [{ text: getSystemPrompt() }]
            },
            tools: [
                {
                    functionDeclarations: [
                        tool
                    ]
                }
            ],
            toolConfig: {
                functionCallingConfig: {
                    mode: FunctionCallingMode.ANY
                }
            }
        });

        const answer = result.response;
        console.log(answer);

        return NextResponse.json({ response: answer }, { status: 200 });

    } catch (error: any) {
        console.log(error);
        return NextResponse.json({ error: error }, { status: 500 });
    }
}

export const runtime = "edge";