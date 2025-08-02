import { newPrompt } from '@/data/NewPrompt';
import { generateContentStream } from '@/lib/vercel-ai-gemini';
import { CoreMessage } from 'ai';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
    if (process.env.NODE_ENV !== 'development') {
        return new Response('Not Found', { status: 404 });
    }

    const { messages }: { messages: CoreMessage[] } = await req.json();

    const result = await generateContentStream(messages, newPrompt);

    return result.toTextStreamResponse();
}

export const runtime = 'edge';
