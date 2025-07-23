import { agentTools } from '@/data/functions-schema';
import { newPrompt } from '@/data/NewPrompt';
import { genAI } from '@/lib/gemini';
import { FunctionCallingMode, GenerativeModel } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
export async function POST(req: NextRequest) {

    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ status: 404 });
    }

    const { history } = await req.json();

    const tools = [{
        functionDeclarations: agentTools
    }];

    const model: GenerativeModel = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: newPrompt,
        tools: tools,
        // toolConfig: {
        //     functionCallingConfig: {
        //         mode: FunctionCallingMode.ANY
        //     }
        // }
    });

    const result = await model.generateContentStream({
        contents: [...history],
    });

    const stream = new ReadableStream({
        async start(controller) {
            for await (const chunk of result.stream) {
                try {
                    if (chunk.candidates && chunk.candidates.length > 0) {
                        const candidate = chunk.candidates[0];
                        if (candidate.content && candidate.content.parts) {
                            for (const part of candidate.content.parts) {
                                console.log("Chunk received:", part);
                                controller.enqueue(new TextEncoder().encode(JSON.stringify(part)));
                            }
                        }
                    }
                } catch (error) {
                    console.error("Error parsing chunk:", error);
                }
            }
            controller.close();
        }
    });

    return new NextResponse(stream, {
        headers: {
            "Content-Type": "application/json",
            "Transfer-Encoding": "chunked"
        }
    });
}

export const runtime = "edge";
