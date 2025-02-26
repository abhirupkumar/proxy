import { NodeBasePrompt, ReactBasePrompt } from '@/data/BasePrompts';
import { BASE_PROMPT } from '@/data/Prompt';
import { groq } from '@/lib/groq';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const { prompt } = await req.json();

    const messages = [
        {
            role: 'system', content: "Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra"
        },
        ...prompt
    ]

    try {
        const response = await groq.chat.completions.create({
            model: 'qwen-2.5-coder-32b',
            messages: messages,
            max_tokens: 200,
        })
        const answer = response.choices[0].message.content;
        if (answer == "react") {
            return NextResponse.json({
                prompts: [BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${ReactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
                uiPrompts: [ReactBasePrompt]
            }, { status: 200 })
        }
        if (answer == "node") {
            return NextResponse.json({
                prompts: [BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${NodeBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
                uiPrompts: [NodeBasePrompt]
            }, { status: 200 })
        }

        return NextResponse.json({ message: "You can't access this." }, { status: 400 })
    }
    catch (error: any) {
        return NextResponse.json({ error: error }, { status: 500 });
    }
}