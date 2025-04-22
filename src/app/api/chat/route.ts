import { BASE_PROMPT, getSystemPrompt } from '@/data/Prompt';
import { gemini } from '@/lib/gemini';
import { getWorkspace } from '@/lib/queries';
import { currentUser, verifyToken } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const user = await currentUser();
        if (!user)
            return NextResponse.json({ error: "Unauthorized access denied." }, { status: 401 });

        const { workspaceId } = await req.json() as { workspaceId: string };
        const workspace = await getWorkspace(workspaceId);
        if (!workspace) return NextResponse.json({ error: "Workspace cannot be found." }, { status: 402 });
        const messages = workspace.Messages.sort((a: any, b: any) => a.createdAt - b.createdAt).map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content + (msg.urlScrapedData ? `\nUrl Scraped Data: ${JSON.stringify(msg.urlScrapedData)}` : "") }]
        })) ?? [];
        const files = workspace.fileData;
        const extraFiles = Object.entries(files!).map(([filepath, { code }]) => `  -  ${filepath}`);
        const prompts = [BASE_PROMPT, `You are required to write the code in react. Consider the contents of ALL files in the project.\n\n${JSON.stringify(files)}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  ${extraFiles}`]
        const llmPrompt = prompts.map(content => ({
            role: "user",
            parts: [{ text: content }]
        }))
        const newMessages = [...llmPrompt, ...messages]

        // const result = await openai.chat.completions.create({
        //     model: 'qwen/qwq-32b:free',
        //     messages: [{ role: "system", content: getSystemPrompt() }],
        //     stream: true,
        //     max_tokens: 8192,
        // })

        const result = await gemini.generateContentStream({
            contents: newMessages,
            generationConfig: {
                temperature: 0.5,
                topP: 0.8,
            },
            systemInstruction: {
                role: "system",
                parts: [{ text: getSystemPrompt() }]
            },
        });

        const stream = new ReadableStream({
            async start(controller) {
                for await (const chunk of result.stream) {
                    try {
                        const text = chunk?.candidates?.[0]?.content?.parts?.[0]?.text || "";
                        controller.enqueue(new TextEncoder().encode(text));
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