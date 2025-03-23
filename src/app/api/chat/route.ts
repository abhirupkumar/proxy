import { NodeBasePrompt, ReactBasePrompt } from '@/data/BasePrompts';
import { BASE_PROMPT, getSystemPrompt } from '@/data/Prompt';
import { gemini } from '@/lib/gemini';
import { groq } from '@/lib/groq';
import { openai } from '@/lib/openai';
import { ArtifactProcessor } from '@/lib/parse';
import { onFileUpdate, onShellCommand } from '@/lib/queries';
import { SchemaType } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const { messages } = await req.json();

    try {
        const result = await openai.chat.completions.create({
            model: 'qwen/qwq-32b:free',
            messages: [...messages, { role: "system", content: getSystemPrompt() }],
            stream: true,
            max_tokens: 8000
        })

        let artifact = "";
        let artifactProcessor = new ArtifactProcessor("", (filePath, fileContent) => onFileUpdate(filePath, fileContent), (shellCommand) => onShellCommand(shellCommand), "", "", "", "");

        const stream = new ReadableStream({
            async start(controller) {
                for await (const chunk of result) {
                    try {
                        const text = chunk.choices[0]?.delta?.content || "";
                        await artifactProcessor.append(text);
                        await artifactProcessor.parse();
                        artifact += text;
                        if (artifactProcessor.response != "" || artifactProcessor.filePath != "" || artifactProcessor.fileContent != "")
                            controller.enqueue(new TextEncoder().encode(`${artifactProcessor.response}<proxy-stream-separator-bar/>${artifactProcessor.filePath}<proxy-stream-separator-bar/>${artifactProcessor.fileContent}`));
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
