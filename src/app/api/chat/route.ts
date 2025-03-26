import { NodeBasePrompt, ReactBasePrompt } from '@/data/BasePrompts';
import { BASE_PROMPT, getSystemPrompt } from '@/data/Prompt';
import { gemini } from '@/lib/gemini';
import { groq } from '@/lib/groq';
import { openai } from '@/lib/openai';
import { ArtifactProcessor } from '@/lib/parse';
import { onFileUpdate, onShellCommand } from '@/lib/queries';
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

    const { messages } = await req.json();

    try {
        // const result = await openai.chat.completions.create({
        //     model: 'qwen/qwq-32b:free',
        //     messages: [{ role: "system", content: getSystemPrompt() }],
        //     stream: true,
        //     max_tokens: 8192,
        // })

        const tools: Tool[] = [
            {
                functionDeclarations: [
                    {
                        name: "codeGeneration",
                        description: "Generate code and response in the specified artifact format.",
                        parameters: {
                            type: SchemaType.OBJECT,
                            properties: {
                                response: {
                                    type: SchemaType.STRING,
                                    description: "Artifacts in the format mentioned in the system instruction"
                                }
                            },
                            required: ["response"]
                        }
                    }
                ]
            }
        ]

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

        let artifact = "";
        let artifactProcessor = new ArtifactProcessor("", (filePath, fileContent) => onFileUpdate(filePath, fileContent), (shellCommand) => onShellCommand(shellCommand), "", "", "", "");

        const stream = new ReadableStream({
            async start(controller) {
                // for await (const chunk of result) {
                for await (const chunk of result.stream) {
                    try {
                        // const text = chunk.choices[0]?.delta?.content || "";
                        const text = chunk?.candidates?.[0]?.content?.parts?.[0]?.text || "";
                        controller.enqueue(new TextEncoder().encode(text));
                        // artifactProcessor.append(text);
                        // artifactProcessor.parse();
                        // artifact += text;
                        // if (artifactProcessor.response != "" || artifactProcessor.filePath != "" || artifactProcessor.fileContent != "")
                        //     controller.enqueue(new TextEncoder().encode(`${artifactProcessor.response}<proxy-stream-separator-bar/>${artifactProcessor.filePath}<proxy-stream-separator-bar/>${artifactProcessor.fileContent}`));
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