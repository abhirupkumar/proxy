import { NodeBasePrompt, ReactBasePrompt } from '@/data/BasePrompts';
import { BASE_PROMPT, getSystemPrompt } from '@/data/Prompt';
import { gemini } from '@/lib/gemini';
import { groq } from '@/lib/groq';
import { parseXml } from '@/lib/parse';
import { SchemaType } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const { messages } = await req.json();

    try {
        const result = await gemini.generateContent({
            contents: messages,
            generationConfig: {
                maxOutputTokens: 8000,
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        projectTitle: {
                            type: SchemaType.STRING,
                            description: "Title of the project",
                        },
                        explanation: {
                            type: SchemaType.STRING,
                            description: "An explanation of what the project does while answering the user's queries",
                        },
                        installCommand: {
                            type: SchemaType.STRING,
                            description: "Command to install dependencies for the project",
                        },
                        runCommand: {
                            type: SchemaType.STRING,
                            description: "Command to run the project",
                        },
                        files: {
                            type: SchemaType.ARRAY,
                            description: "Object containing file paths as keys and their respective code as values.",
                            items: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    filepath: {
                                        type: SchemaType.STRING,
                                        description: "File path and it must not start with /",
                                    },
                                    code: {
                                        type: SchemaType.STRING,
                                        description: "Source code for the file"
                                    }
                                },
                                required: ["filepath", "code"]
                            },
                        },
                        generatedFiles: {
                            type: SchemaType.ARRAY,
                            description: "List of additional files that are generated dynamically",
                            items: {
                                type: SchemaType.STRING,
                                description: "File path of the generated file. File path should not start with /"
                            },
                        },
                        editedFiles: {
                            type: SchemaType.ARRAY,
                            description: "List of files that have been edited/modified",
                            items: {
                                type: SchemaType.STRING,
                                description: "File path of the edited file. File path should not start with /"
                            },
                        },
                        deletedFiles: {
                            type: SchemaType.ARRAY,
                            description: "List of files that have been deleted",
                            items: {
                                type: SchemaType.STRING,
                                description: "File path of the deleted file. File path should not start with /"
                            },
                        }
                    },
                    required: ["projectTitle", "explanation", "runCommand", "files", "editedFiles", "deletedFiles"]
                },
                responseMimeType: "application/json"
            },
            systemInstruction: {
                role: "system",
                parts: [{ text: getSystemPrompt() }]
            }
        });

        const response = result.response;
        const text = response.text();

        return NextResponse.json({ response: text }, { status: 200 });
    } catch (error: any) {
        console.log(error);
        return NextResponse.json({ error: error }, { status: 500 });
    }
}
