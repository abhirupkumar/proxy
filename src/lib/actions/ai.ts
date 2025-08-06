import { UIMessage } from "ai";
import { v4 as uuid4 } from "uuid";

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
            return 'image/jpeg';
    }
}

export async function convertToUIMessages(workspace: any): Promise<UIMessage[]> {

    const messages: UIMessage[] = await Promise.all(workspace.Messages.sort((a: any, b: any) => a.createdAt - b.createdAt).map(async (msg: any) => {
        const parts: any[] = [{
            type: "text",
            text: msg.content + (msg.urlScrapedData ? `\nUrl Scraped Data: ${JSON.stringify(msg.urlScrapedData)}` : "")
        }];

        // Add images if photoUrls exist
        if (msg.photoUrls && Array.isArray(msg.photoUrls) && msg.photoUrls.length > 0) {
            for (const imageUrl of msg.photoUrls) {
                parts.push({
                    type: "file",
                    mediaType: getMimeTypeFromUrl(imageUrl),
                    url: imageUrl
                });
            }
        }

        return {
            id: msg.id,
            role: msg.role.replace("model", "assistant"),
            parts: parts
        };
    })) ?? [];

    const files: { [key: string]: { code: string } } = workspace.fileData;
    const extraFiles = Object.entries(files!).map(([filepath, { code }]) => `  -  ${filepath}`);
    const prompts = [`Consider the contents of ALL files in the project.\n\n${JSON.stringify(files)}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  ${extraFiles}`];
    const llmPrompt: UIMessage = {
        id: uuid4(),
        role: "user",
        parts: [{ type: "text", text: prompts.join('\n') }]
    };

    const finalMessagesArray: UIMessage[] = [llmPrompt, ...messages]

    return finalMessagesArray;
}