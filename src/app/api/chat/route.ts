import { getSystemPrompt } from '@/data/Prompt';
import { getWorkspace } from '@/lib/queries';
import { NextRequest, NextResponse } from 'next/server';
import { ModelMessage, stepCountIs, streamText, UIMessage, wrapLanguageModel } from 'ai';
import { google } from '@ai-sdk/google';
import { convertToModelMessages } from 'ai';
import { convertToUIMessages } from '@/lib/actions/ai';

export async function POST(req: NextRequest) {
    try {
        const { workspaceId, newMessageId } = await req.json() as { workspaceId: string, newMessageId: string };
        const workspace = await getWorkspace(workspaceId);
        if (!workspace) return NextResponse.json({ error: "Workspace cannot be found." }, { status: 402 });
        const messages = await convertToUIMessages(workspace);

        const { textStream } = streamText({
            model: google('gemini-2.5-pro'),
            system: getSystemPrompt(),
            messages: convertToModelMessages(messages),
            temperature: 0.5,
            topP: 0.8,
            onFinish: async ({ usage }) => {
                // use newMessageId
                // Update the usage tokens/credits using newMessageId
            }
        });

        const stream = new ReadableStream({
            async start(controller) {
                for await (const textPart of textStream) {
                    try {
                        const text = textPart || "";
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
        return NextResponse.json({ error: error.message || 'An error occurred' }, { status: 500 });
    }
}

export const runtime = "edge";
