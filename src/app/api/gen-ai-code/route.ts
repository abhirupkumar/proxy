import { groq } from "@/lib/groq";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const { prompt, systemPrompt } = await req.json();

    const messages = [
        {
            role: "system",
            content: systemPrompt
        },
        ...prompt
    ];
    console.log(messages)

    try {
        const result = await groq.chat.completions.create({
            model: 'qwen-2.5-coder-32b',
            messages: messages
        }).asResponse();
        const data = await result.json();
        return NextResponse.json({ data: data }, { status: result.status })
    }
    catch (error: any) {
        console.log(error)
        return NextResponse.json({ error: error }, { status: 500 })
    }
}