import { NodeBasePrompt, ReactBasePrompt } from '@/data/BasePrompts';
import { BASE_PROMPT, getSystemPrompt } from '@/data/Prompt';
import { gemini } from '@/lib/gemini';
import { groq } from '@/lib/groq';
import { openai } from '@/lib/openai';
import { RegexProcessor } from '@/lib/parse';
import { currentUser, verifyToken } from '@clerk/nextjs/server';
import { SchemaType, Tool } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

interface Message {
    "role": "user" | "assistant",
    "parts": [{ "text": string }]
}

export async function POST(req: NextRequest) {
    const user = await currentUser();
    if (!user)
        return NextResponse.json({ error: "Unauthorized access denied." }, { status: 401 });

    const { messages } = await req.json() as { messages: Message[] };

    try {
        // const result = await openai.chat.completions.create({
        //     model: 'qwen/qwq-32b:free',
        //     messages: [{ role: "system", content: getSystemPrompt() }],
        //     stream: true,
        //     max_tokens: 8192,
        // })

        const result = await gemini.generateContentStream({
            contents: messages,
            generationConfig: {
                temperature: 0.5,
                topP: 0.8,
            },
            systemInstruction: {
                role: "system",
                parts: [{ text: getSystemPrompt() }]
            },
        });

        const stream = new ReadableStream({
            async start(controller) {
                for await (const chunk of result.stream) {
                    try {
                        const text = chunk?.candidates?.[0]?.content?.parts?.[0]?.text || "";
                        controller.enqueue(new TextEncoder().encode(text));
                    } catch (error) {
                        console.error("Error parsing chunk:", error);
                    }
                    finally {
                        // console.log("completed");
                    }
                }
                controller.close();
            }
        });

        return new NextResponse(stream, {
            headers: {
                "Content-Type": "text/plain",
                "Transfer-Encoding": "chunked"
            }
        });

    } catch (error: any) {
        console.log(error);
        return NextResponse.json({ error: error }, { status: 500 });
    }
}

export const runtime = "edge";