import { agentTools } from '@/data/functions-schema';
import { newPrompt } from '@/data/NewPrompt';
import { generateContentStream } from '@/lib/vercel-ai-gemini';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ status: 404 });
    }

    const { history } = await req.json();

    // Convert history to a single prompt string for the Vercel AI SDK
    const prompt = history.map((h: any) =>
        `${h.role}: ${h.parts?.map((p: any) => p.text || '').join('') || h.text || ''}`
    ).join('\n\n');

    try {
        const result = await generateContentStream(prompt, newPrompt);

        return result.toTextStreamResponse();
    } catch (error) {
        console.error("Error generating content:", error);
        return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
    }
}

export const runtime = "edge";
