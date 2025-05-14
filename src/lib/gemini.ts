import { GoogleGenerativeAI, SchemaType, Tool } from "@google/generative-ai";
import { GoogleGenAI } from '@google/genai';
import { env } from "env";

export const ai = new GoogleGenAI({ apiKey: env.GOOGLE_API_KEY! });

const genAI = new GoogleGenerativeAI(env.GOOGLE_API_KEY!);

export const gemini = genAI.getGenerativeModel({ model: "gemini-2.5-pro-exp-03-25" });

export const toolInvocation = [
    {
        name: "startup",
        description: "Always called at first only and it responds to the user's prompt",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                response: {
                    type: SchemaType.STRING,
                    description: "Response to user's prompt"
                },
                steps: {
                    type: SchemaType.ARRAY,
                    items: {
                        type: SchemaType.STRING
                    },
                    description: "Step for creating the web app"
                },
            },
            required: ["response", "steps"]
        }
    },
    // {
    //     name: "web_scrape",
    //     description: "If any url or website name is specified whose UI has to be cloned or built, then scrape the URL",
    //     parameters: {
    //         type: SchemaType.OBJECT,
    //         properties: {
    //             html: {
    //                 type: SchemaType.STRING,
    //                 description: "HTML of the URL or website"
    //             },
    //             css: {
    //                 type: SchemaType.STRING,
    //                 description: "CSS of the URL or website"
    //             },
    //             markdown: {
    //                 type: SchemaType.STRING,
    //                 description: "Any Markdown present in the URL or website"
    //             },
    //             colors: {
    //                 type: SchemaType.ARRAY,
    //                 items: {
    //                     type: SchemaType.STRING
    //                 },
    //                 description: "All the color hexcode present in the website or URL."
    //             },
    //             images: {
    //                 type: SchemaType.ARRAY,
    //                 items: {
    //                     type: SchemaType.STRING
    //                 },
    //                 description: "All the image urls used in the website or url."
    //             },
    //             urls: {
    //                 type: SchemaType.ARRAY,
    //                 items: {
    //                     type: SchemaType.STRING
    //                 },
    //                 description: "All the urls used in the website."
    //             },
    //             isScrapable: {
    //                 type: SchemaType.BOOLEAN,
    //                 description: "True if the URL or website is scrapable, else false"
    //             }
    //         },
    //         required: ["html", "css", "markdown", "colors", "images", "urls", "isScrapable"]
    //     }
    // },
    {
        name: "files",
        description: "All the files or folders or apis that needs to be changed or added or deleted.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                components: {
                    type: SchemaType.ARRAY,
                    items: {
                        type: SchemaType.STRING
                    },
                    description: "components or api paths to be changed or added"
                },
                deleteFile: {
                    type: SchemaType.ARRAY,
                    items: {
                        type: SchemaType.STRING
                    },
                    description: "file path of files to be deleted"
                }
            },
            required: ["components", "deleteFile"]
        }
    },
    {
        name: "edit_file",
        description: "If we got all the components, then choose a component and Edit the code of that file.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                response: {
                    type: SchemaType.STRING,
                    description: "React to the edit of the file"
                },
                code: {
                    type: SchemaType.STRING,
                    description: "Edited code of the file whose file path was provided."
                },
            },
            required: ["code", "response"]
        }
    },
    {
        name: "changes_complete",
        description: "If all the neccessary changes have been made and there is no error then return true, otherwise return false",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                response: {
                    type: SchemaType.STRING,
                    description: "If there are no changes then talk about about the changes and features implemented. Otherwise mention what changes need to be done."
                },
                isComplete: {
                    type: SchemaType.BOOLEAN,
                    description: "If all the neccessary changes have been made and there is no error then return true, otherwise return false"
                },
            },
            required: ["response", "isComplete"]
        }
    },
]