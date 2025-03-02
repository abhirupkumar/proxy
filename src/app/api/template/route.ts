import { NodeBasePrompt, ReactBasePrompt } from '@/data/BasePrompts';
import { BASE_PROMPT } from '@/data/Prompt';
import { gemini } from '@/lib/gemini';
import { groq } from '@/lib/groq';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const { prompt } = await req.json();

    try {
        const result = await gemini.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                maxOutputTokens: 200,
            },
            systemInstruction: {
                role: "system",
                parts: [{ text: "Return either node or react based on what you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra." }],
            },
        })
        const answer = result.response.text();
        if (answer.trim() == "react") {
            return NextResponse.json({
                prompts: [BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${ReactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
                uiPrompts: [ReactBasePrompt]
            }, { status: 200 })
        }
        if (answer.trim() == "node") {
            return NextResponse.json({
                prompts: [BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${ReactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
                uiPrompts: [NodeBasePrompt]
            }, { status: 200 })
        }

        return NextResponse.json({ message: "You can't access this." }, { status: 400 })
    }
    catch (error: any) {
        return NextResponse.json({ error: error }, { status: 500 });
    }
}