import { BASE_PROMPT, getSystemPrompt } from '@/data/Prompt';
import { gemini } from '@/lib/gemini';
import { getWorkspace } from '@/lib/queries';
import { currentUser, verifyToken } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

// Helper function to determine MIME type from URL
function getMimeTypeFromUrl(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    switch (extension) {
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'png':
            return 'image/png';
        case 'gif':
            return 'image/gif';
        case 'webp':
            return 'image/webp';
        case 'svg':
            return 'image/svg+xml';
        default:
            return 'image/jpeg'; // Default fallback
    }
}

const imageToBase64 = async (url: string): Promise<string> => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    const base64String = Buffer.from(buffer).toString('base64');
    return `${base64String}`;
}

export async function POST(req: NextRequest) {
    const abortController = new AbortController();
    const { signal } = abortController;

    req.signal?.addEventListener("abort", () => {
        console.log('Request aborted by client.');
        abortController.abort();
    });
    try {
        const { workspaceId } = await req.json() as { workspaceId: string };
        const workspace = await getWorkspace(workspaceId);
        if (!workspace) return NextResponse.json({ error: "Workspace cannot be found." }, { status: 402 });

        // Format messages and handle photoUrls
        const messages = await Promise.all(workspace.Messages.sort((a: any, b: any) => a.createdAt - b.createdAt).map(async msg => {
            // Start with the text content
            const parts: any[] = [{
                text: msg.content + (msg.urlScrapedData ? `\nUrl Scraped Data: ${JSON.stringify(msg.urlScrapedData)}` : "")
            }];

            // Add images if photoUrls exist
            if (msg.photoUrls && Array.isArray(msg.photoUrls) && msg.photoUrls.length > 0) {
                for (const imageUrl of msg.photoUrls) {
                    const base64Image = await imageToBase64(imageUrl);
                    parts.push({
                        inlineData: {
                            mimeType: getMimeTypeFromUrl(imageUrl),
                            data: base64Image
                        }
                    });
                }
            }

            return {
                role: msg.role,
                parts: parts
            };
        })) ?? [];

        const files = workspace.fileData;
        const extraFiles = Object.entries(files!).map(([filepath, { code }]) => `  -  ${filepath}`);
        const prompts = [BASE_PROMPT, `You are required to write the code in react. Consider the contents of ALL files in the project.\n\n${JSON.stringify(files)}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  ${extraFiles}`]
        const llmPrompt = prompts.map(content => ({
            role: "user",
            parts: [{ text: content }]
        }))
        const newMessages = [...llmPrompt, ...messages]

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