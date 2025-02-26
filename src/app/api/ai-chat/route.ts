import { groq } from '@/lib/groq';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const { prompt, systemPrompt } = await req.json();

    const messages = [
        {
            role: "system",
            content: systemPrompt
        },
        ...prompt
    ];

    try {
        const stream = await groq.chat.completions.create({
            model: 'qwen-2.5-coder-32b',
            messages: messages,
            stream: true
        })
        const encoder = new TextEncoder();
        const readableStream = new ReadableStream({
            async start(controller) {
                for await (const chunk of stream) {
                    controller.enqueue(encoder.encode(chunk.choices[0]?.delta?.content || ""));
                }
                controller.close();
            },
        });

        return new NextResponse(readableStream, {
            headers: { "Content-Type": "text/plain" },
        });
    }
    catch (error: any) {
        return NextResponse.json({ error: error }, { status: 500 });
    }
}