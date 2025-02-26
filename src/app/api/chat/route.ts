import { NodeBasePrompt, ReactBasePrompt } from '@/data/BasePrompts';
import { BASE_PROMPT, getSystemPrompt } from '@/data/Prompt';
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
        const result = await groq.chat.completions.create({
            model: 'qwen-2.5-coder-32b',
            messages: messages,
            max_tokens: 8000,
        })
        const response = result.choices[0].message.content

        return NextResponse.json({ response: response }, { status: 200 })
    }
    catch (error: any) {
        return NextResponse.json({ error: error }, { status: 500 });
    }
}