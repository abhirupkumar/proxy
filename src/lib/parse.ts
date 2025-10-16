import { v4 as uuidv4 } from 'uuid';
import { DeleteTool, FileTool, ProxyRegexData, ProxyTool, ProxyToolData, RenameTool, SupabaseTool, ToolType } from './new-types';

const REGEX_TAG_OPEN = '<prx-regex';
const REGEX_TAG_CLOSE = '</prx-regex>';

interface MessageState {
    position: number;
    insideRegex: boolean;
    insideTool: boolean;
    currentRegex?: ProxyRegexData;
    currentTool: ProxyToolData;
    toolId: number;
    currentToolName?: string;
}

export interface RegexCallbackData extends ProxyRegexData {
    messageId: string;
}

export interface ToolCallbackData {
    regexId: string;
    messageId: string;
    toolId: string;
    tool: ProxyTool;
}

export type RegexCallback = (data: RegexCallbackData) => void;
export type ToolCallback = (data: ToolCallbackData) => void;

export interface ParserCallbacks {
    onRegexOpen?: RegexCallback;
    onRegexClose?: RegexCallback;
    onToolOpen?: ToolCallback;
    onToolStream?: ToolCallback;
    onToolClose?: ToolCallback;
}

interface ElementFactoryProps {
    messageId: string;
}

type ElementFactory = (props: ElementFactoryProps) => string;

export interface StreamingMessageParserOptions {
    callbacks?: ParserCallbacks;
    regexElement?: ElementFactory;
}

function cleanoutMarkdownSyntax(content: string) {
    const codeBlockRegex = /^\s*```\w*\n([\s\S]*?)\n\s*```\s*$/;
    const match = content.match(codeBlockRegex);

    // console.log('matching', !!match, content);

    if (match) {
        return match[1]; // Remove common leading 4-space indent
    } else {
        return content;
    }
}

function cleanEscapedTags(content: string) {
    return content.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

export class NewStreamingMessageParser {
    #messages = new Map<string, MessageState>();

    constructor(private _options: StreamingMessageParserOptions = {}) { }

    parse(messageId: string, input: string) {
        let state = this.#messages.get(messageId);

        if (!state) {
            state = {
                position: 0,
                insideTool: false,
                insideRegex: false,
                currentTool: { content: '' },
                toolId: 0,
            };

            this.#messages.set(messageId, state);
        }

        let output = '';
        let i = state.position;
        let earlyBreak = false;

        while (i < input.length) {
            if (state.insideRegex) {
                const currentRegex = state.currentRegex;

                if (currentRegex === undefined) {
                    throw new Error('Regex not initialized');
                }

                if (state.insideTool) {
                    if (!state.currentToolName) {
                        throw new Error('Inside a tool but tool name is unknown.');
                    }
                    const closeTag = `</prx-${state.currentToolName}>`;
                    const closeIndex = input.indexOf(closeTag, i);

                    const currentTool = state.currentTool;

                    if (closeIndex !== -1) {
                        currentTool.content += input.slice(i, closeIndex);

                        let content = currentTool.content.trim();

                        if ('type' in currentTool && currentTool.type === 'file') {
                            if (!currentTool.filePath.endsWith('.md')) {
                                content = cleanoutMarkdownSyntax(content);
                                content = cleanEscapedTags(content);
                            }
                            content += '\n';
                        }

                        currentTool.content = content;

                        this._options.callbacks?.onToolClose?.({
                            regexId: currentRegex.id,
                            messageId,

                            /**
                             * We decrement the id because it's been incremented already
                             * when `onToolOpen` was emitted to make sure the ids are
                             * the same.
                             */
                            toolId: String(state.toolId - 1),

                            tool: currentTool as ProxyTool,
                        });

                        state.insideTool = false;
                        state.currentTool = { content: '' };
                        state.currentToolName = undefined;

                        i = closeIndex + closeTag.length;
                    } else {
                        if ('type' in currentTool && currentTool.type === 'file') {
                            let content = input.slice(i);

                            this._options.callbacks?.onToolStream?.({
                                regexId: currentRegex.id,
                                messageId,
                                toolId: String(state.toolId - 1),
                                tool: {
                                    ...(currentTool as FileTool),
                                    content,
                                    filePath: currentTool.filePath,
                                },
                            });
                        }
                        break;
                    }
                } else {
                    const regexCloseIndex = input.indexOf(REGEX_TAG_CLOSE, i);

                    let toolOpenIndex = -1;
                    let toolTagName: string | undefined;
                    let searchFrom = i;
                    while (true) {
                        const prxOpenIndex = input.indexOf('<prx-', searchFrom);
                        if (prxOpenIndex === -1) break;

                        const tagMatch = input.substring(prxOpenIndex).match(/^<prx-([a-zA-Z-]+)/);
                        if (tagMatch) {
                            const tagName = tagMatch[1];
                            if (tagName !== 'regex') {
                                toolOpenIndex = prxOpenIndex;
                                toolTagName = tagName;
                                break; // Found a tool tag
                            } else {
                                // It's a regex tag, continue searching from after this tag
                                searchFrom = prxOpenIndex + 1;
                            }
                        } else {
                            // Not a valid <prx-tag, continue searching
                            searchFrom = prxOpenIndex + 1;
                        }
                    }

                    if (toolOpenIndex !== -1 && (regexCloseIndex === -1 || toolOpenIndex < regexCloseIndex)) {
                        const toolEndIndex = input.indexOf('>', toolOpenIndex);

                        if (toolEndIndex !== -1) {
                            state.insideTool = true;
                            state.currentToolName = toolTagName;

                            state.currentTool = this.#parseToolTag(input, toolOpenIndex, toolEndIndex);

                            this._options.callbacks?.onToolOpen?.({
                                regexId: currentRegex.id,
                                messageId,
                                toolId: String(state.toolId++),
                                tool: state.currentTool as ProxyTool,
                            });

                            i = toolEndIndex + 1;
                        } else {
                            break;
                        }
                    } else if (regexCloseIndex !== -1) {
                        this._options.callbacks?.onRegexClose?.({ messageId, ...currentRegex });

                        state.insideRegex = false;
                        state.currentRegex = undefined;

                        i = regexCloseIndex + REGEX_TAG_CLOSE.length;
                    } else {
                        break;
                    }
                }
            } else if (input[i] === '<' && input[i + 1] !== '/') {
                let j = i;
                let potentialTag = '';

                while (j < input.length && potentialTag.length < REGEX_TAG_OPEN.length) {
                    potentialTag += input[j];

                    if (potentialTag === REGEX_TAG_OPEN) {
                        const nextChar = input[j + 1];

                        if (nextChar && nextChar !== '>' && nextChar !== ' ') {
                            output += input.slice(i, j + 1);
                            i = j + 1;
                            break;
                        }

                        const openTagEnd = input.indexOf('>', j);

                        if (openTagEnd !== -1) {
                            state.insideRegex = true;

                            const currentRegex = {
                                id: uuidv4(),
                            } satisfies ProxyRegexData;

                            state.currentRegex = currentRegex;

                            this._options.callbacks?.onRegexOpen?.({ messageId, ...currentRegex });

                            // const regexFactory = this._options.regexElement ?? createRegexElement;

                            // output += regexFactory({ messageId });

                            i = openTagEnd + 1;
                        } else {
                            earlyBreak = true;
                        }

                        break;
                    } else if (!REGEX_TAG_OPEN.startsWith(potentialTag)) {
                        output += input.slice(i, j + 1);
                        i = j + 1;
                        break;
                    }

                    j++;
                }

                if (j === input.length && REGEX_TAG_OPEN.startsWith(potentialTag)) {
                    break;
                }
            } else {
                output += input[i];
                i++;
            }

            if (earlyBreak) {
                break;
            }
        }

        state.position = i;

        return output;
    }

    reset() {
        this.#messages.clear();
    }

    #parseToolTag(input: string, toolOpenIndex: number, toolEndIndex: number): ProxyTool {
        const toolTag = input.slice(toolOpenIndex, toolEndIndex + 1);

        const tagMatch = toolTag.match(/<prx-([a-zA-Z-]+)/);
        if (!tagMatch) {
            throw new Error(`Invalid tool tag: ${toolTag}`);
        }
        const toolType = tagMatch[1] as ToolType;

        const toolAttributes: { type: ToolType; content: string;[key: string]: any } = {
            type: toolType,
            content: '',
        };

        if (toolType === 'supabase') {
            const operation = this.#extractAttribute(toolTag, 'operation');

            if (!operation || !['migration', 'query'].includes(operation)) {
                console.warn(`Invalid or missing operation for Supabase tool: ${operation}`);
                throw new Error(`Invalid Supabase operation: ${operation}`);
            }

            (toolAttributes as SupabaseTool).operation = operation as 'migration' | 'query';

            if (operation === 'migration') {
                const filePath = this.#extractAttribute(toolTag, 'filePath');

                if (!filePath) {
                    console.warn('Migration requires a filePath');
                    throw new Error('Migration requires a filePath');
                }

                (toolAttributes as SupabaseTool).filePath = filePath;
            }
        } else if (toolType === 'delete') {
            const filePath = this.#extractAttribute(toolTag, 'filePath');
            if (!filePath) {
                console.warn('Delete tool requires a filePath');
                throw new Error('Delete tool requires a filePath');
            }

            (toolAttributes as DeleteTool).filePath = filePath;
        } else if (toolType === 'rename') {
            const filePath = this.#extractAttribute(toolTag, 'filePath');
            const newFilePath = this.#extractAttribute(toolTag, 'newFilePath');
            if (!filePath) {
                console.warn('Rename tool requires a filePath');
                throw new Error('Rename tool requires a filePath');
            }
            if (!newFilePath) {
                console.warn('Rename tool requires a newFilePath');
                throw new Error('Rename tool requires a newFilePath');
            }

            (toolAttributes as RenameTool).filePath = filePath;
            (toolAttributes as RenameTool).newFilePath = newFilePath;
        } else if (toolType === 'file') {
            const filePath = this.#extractAttribute(toolTag, 'filePath') as string;
            if (!filePath) {
                console.warn('FilePath not found!');
                throw new Error('FilePath not found!');
            }

            (toolAttributes as FileTool).filePath = filePath;
        } else if (!['shell', 'start'].includes(toolType)) {
            console.warn(`Unknown tool type '${toolType}'`);
        }

        return toolAttributes as ProxyTool;
    }

    #extractAttribute(tag: string, attributeName: string): string | undefined {
        const match = tag.match(new RegExp(`${attributeName}="([^"]*)"`, 'i'));
        return match ? match[1] : undefined;
    }
}
