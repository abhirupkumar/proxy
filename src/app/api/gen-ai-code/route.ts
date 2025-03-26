import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType, Tool } from '@google/generative-ai';
import { gemini } from '@/lib/gemini';

// Tool definitions (function calls)
const tools: Tool[] = [{
    functionDeclarations: [
        {
            name: "web_scrape",
            description: "Scrapes content from a website given a URL(if any).",
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    url: { type: SchemaType.STRING, description: "The URL to scrape." },
                    include_screenshot: { type: SchemaType.BOOLEAN, description: "Whether to include a screenshot." }
                },
                required: ["url"]
            }
        },
        {
            name: "edit_file",
            description: "Edit the code of given file in the project",
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    target_file_path: { type: SchemaType.STRING, description: "The path of the file to edit" },
                    code_edit: { type: SchemaType.STRING, description: "The valid js code to edit the existing js code with" },
                    instructions: { type: SchemaType.STRING, description: "instructions on what to do with code" }

                },
                required: ["target_file_path", "code_edit", "instructions"]
            }
        },
        {
            name: "versioning",
            description: "Update and create a new version of project. This is ideally called at the end of project",
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    version_title: { type: SchemaType.STRING, description: "Add title to the new version" },
                    version_changelog: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "The changelog of the current version" }

                },
                required: ["version_title", "version_changelog"]
            }
        },
        {
            name: "deploy",
            description: "Deploy the project",
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    deploy_as_static_site: {
                        type: SchemaType.OBJECT,
                        properties: {
                            output_path: { type: SchemaType.STRING, description: "where to add output zip" },
                            build_and_zip_command: { type: SchemaType.STRING, description: "the command to first build then zip the project" }
                        },
                        required: ["output_path", "build_and_zip_command"]
                    },

                },
                required: ["deploy_as_static_site"]
            }
        },
        {
            name: "startup",
            description: "create next js project",
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    project_name: { type: SchemaType.STRING, description: "what should be the project name?" },
                    framework: { type: SchemaType.STRING, description: "what should be the framework? either nextjs-shadcn or basic next js" }

                },
                required: ["project_name", "framework"]
            }
        },
        {
            name: "run_terminal_cmd",
            description: "run any terminal command",
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    command: { type: SchemaType.STRING, description: "what should be the command?" },
                    starting_server: { type: SchemaType.BOOLEAN, description: "is it starting a server?" }

                },
                required: ["command"]
            }
        },
    ]
}]

// In-memory conversation store (replace with a database for production)
const conversationStore: { [key: string]: { role: string; parts: string; }[] } = {};

export async function POST(req: NextRequest) {
    try {
        const { messages } = await req.json() as { messages: { role: string, parts: [{ text: string }] }[] };

        // Create TransformStream to format the data as Server-Sent Events
        const transformStream = new TransformStream({
            async transform(chunk, controller) {
                const encoder = new TextEncoder();
                const processedChunk = await processGeminiResponse(chunk);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(processedChunk)}\n\n`));
            },
        });

        // Get the Gemini response stream
        const geminiStream = await gemini.generateContentStream({
            contents: messages,
            tools,
        });

        // Convert AsyncGenerator to ReadableStream for pipeThrough
        const readableStreamFromGenerator = (generator: AsyncGenerator<any>) => {
            return new ReadableStream({
                async start(controller) {
                    for await (const chunk of generator) {
                        controller.enqueue(chunk);
                    }
                    controller.close();
                },
            });
        };

        const readable = readableStreamFromGenerator(geminiStream.stream).pipeThrough(transformStream);

        // Function to process function calls and generate JSON structure
        async function processGeminiResponse(response: any): Promise<any> {
            const aiReply = response.candidates?.[0]?.content?.parts?.[0].text || 'No response from AI';
            const functionCall = response.candidates?.[0]?.content?.parts?.[0]?.functionCall;

            // Determine if AI signals completion (Modify this based on your prompt/AI behavior)
            let isComplete = false;
            if (aiReply.includes("TASK_COMPLETE")) {  // Example: Check if the AI says "TASK_COMPLETE"
                isComplete = true;
            }

            // Also allow the AI to return a flag directly
            try {
                const parsedAiReply = JSON.parse(aiReply);
                if (typeof parsedAiReply === 'object' && parsedAiReply !== null && parsedAiReply.isComplete === true) {
                    isComplete = true;
                }
            } catch (error) {
                // It's fine if parsing fails.  The AI might not always send JSON.
            }

            console.log(`Gemini Response:`, response);
            console.log(`AI Reply: ${aiReply}`);
            console.log(`Function Call:`, functionCall);
            console.log(`Is Complete:`, isComplete);
            return { aiReply, response, functionCall, isComplete };
        }

        // Return the streaming response
        return new NextResponse(readable, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// --- Tool Implementations (replace with actual logic) ---
async function webScrapeTool(args: any): Promise<string> {
    return "webscraped"
}

async function editFileTool(args: any): Promise<string> {
    try {
        const { target_file_path, code_edit, instructions } = args;

        return `Successfully edited ${target_file_path} with the following js code, based on the instructions`;
    } catch (error: any) {
        console.error("Error editing file:", error);
        return `Error editing file: ${error.message}`;
    }
}

async function versioningTool(args: any): Promise<string> {
    return "versioned"
}

async function deployTool(args: any): Promise<string> {
    return "deployed"
}
async function startupTool(args: any): Promise<string> {
    return "started"
}

async function runTerminalCmdTool(args: any): Promise<string> {
    return "ran the terminal cmd"
}