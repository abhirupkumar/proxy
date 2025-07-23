import { ActionType, DeleteAction, FileAction, ProxyAction, ProxyActionData, ProxyRegexData, RenameAction, ShellAction, SupabaseAction } from "./types";


const REGEX_TAG_OPEN = '<proxyRegex';
const REGEX_TAG_CLOSE = '</proxyRegex>';
const REGEX_ACTION_TAG_OPEN = '<proxyAction';
const REGEX_ACTION_TAG_CLOSE = '</proxyAction>';

interface MessageState {
    position: number;
    insideRegex: boolean;
    insideAction: boolean;
    currentRegex?: ProxyRegexData;
    currentAction: ProxyActionData;
    actionId: number;
}

export interface RegexCallbackData extends ProxyRegexData {
    messageId: string;
}

export interface ActionCallbackData {
    regexId: string;
    messageId: string;
    actionId: string;
    action: ProxyAction;
}

export type RegexCallback = (data: RegexCallbackData) => void;
export type ActionCallback = (data: ActionCallbackData) => void;

export interface ParserCallbacks {
    onRegexOpen?: RegexCallback;
    onRegexClose?: RegexCallback;
    onActionOpen?: ActionCallback;
    onActionStream?: ActionCallback;
    onActionClose?: ActionCallback;
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

export class StreamingMessageParser {
    #messages = new Map<string, MessageState>();

    constructor(private _options: StreamingMessageParserOptions = {}) { }

    parse(messageId: string, input: string) {
        let state = this.#messages.get(messageId);

        if (!state) {
            state = {
                position: 0,
                insideAction: false,
                insideRegex: false,
                currentAction: { content: '' },
                actionId: 0,
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

                if (state.insideAction) {
                    const closeIndex = input.indexOf(REGEX_ACTION_TAG_CLOSE, i);

                    const currentAction = state.currentAction;

                    if (closeIndex !== -1) {
                        currentAction.content += input.slice(i, closeIndex);

                        let content = currentAction.content.trim();

                        if ('type' in currentAction && currentAction.type === 'file') {
                            if (!currentAction.filePath.endsWith('.md')) {
                                content = cleanoutMarkdownSyntax(content);
                                content = cleanEscapedTags(content);
                            }
                            content += '\n';
                        }

                        currentAction.content = content;

                        this._options.callbacks?.onActionClose?.({
                            regexId: currentRegex.id,
                            messageId,

                            /**
                             * We decrement the id because it's been incremented already
                             * when `onActionOpen` was emitted to make sure the ids are
                             * the same.
                             */
                            actionId: String(state.actionId - 1),

                            action: currentAction as ProxyAction,
                        });

                        state.insideAction = false;
                        state.currentAction = { content: '' };

                        i = closeIndex + REGEX_ACTION_TAG_CLOSE.length;
                    } else {
                        break;
                    }
                } else {
                    const actionOpenIndex = input.indexOf(REGEX_ACTION_TAG_OPEN, i);
                    const regexCloseIndex = input.indexOf(REGEX_TAG_CLOSE, i);

                    if (actionOpenIndex !== -1 && (regexCloseIndex === -1 || actionOpenIndex < regexCloseIndex)) {
                        const actionEndIndex = input.indexOf('>', actionOpenIndex);

                        if (actionEndIndex !== -1) {
                            state.insideAction = true;

                            state.currentAction = this.#parseActionTag(input, actionOpenIndex, actionEndIndex);

                            this._options.callbacks?.onActionOpen?.({
                                regexId: currentRegex.id,
                                messageId,
                                actionId: String(state.actionId++),
                                action: state.currentAction as ProxyAction,
                            });

                            i = actionEndIndex + 1;
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
                            const regexTag = input.slice(i, openTagEnd + 1);

                            const regexTitle = this.#extractAttribute(regexTag, 'title') as string;
                            const regexId = this.#extractAttribute(regexTag, 'id') as string;

                            if (!regexTitle) {
                                console.warn('Regex title missing');
                            }

                            if (!regexId) {
                                console.warn('Regex id missing');
                            }

                            state.insideRegex = true;

                            const currentRegex = {
                                id: regexId,
                                title: regexTitle,
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

    #parseActionTag(input: string, actionOpenIndex: number, actionEndIndex: number) {
        const actionTag = input.slice(actionOpenIndex, actionEndIndex + 1);

        const actionType = this.#extractAttribute(actionTag, 'type') as ActionType;

        const actionAttributes = {
            type: actionType,
            content: '',
        };

        if (actionType === 'supabase') {
            const operation = this.#extractAttribute(actionTag, 'operation');

            if (!operation || !['migration', 'query'].includes(operation)) {
                console.warn(`Invalid or missing operation for Supabase action: ${operation}`);
                throw new Error(`Invalid Supabase operation: ${operation}`);
            }

            (actionAttributes as SupabaseAction).operation = operation as 'migration' | 'query';

            if (operation === 'migration') {
                const filePath = this.#extractAttribute(actionTag, 'filePath');

                if (!filePath) {
                    console.warn('Migration requires a filePath');
                    throw new Error('Migration requires a filePath');
                }

                (actionAttributes as SupabaseAction).filePath = filePath;
            }
        } else if (actionType === 'delete') {
            const filePath = this.#extractAttribute(actionTag, 'filePath');
            if (!filePath) {
                console.warn('Delete action requires a filePath');
                throw new Error('Delete action requires a filePath');
            }

            (actionAttributes as DeleteAction).filePath = filePath;
        } else if (actionType === 'rename') {
            const filePath = this.#extractAttribute(actionTag, 'filePath');
            const newFilePath = this.#extractAttribute(actionTag, 'newFilePath');
            if (!filePath) {
                console.warn('Rename action requires a filePath');
                throw new Error('Rename action requires a filePath');
            }
            if (!newFilePath) {
                console.warn('Rename action requires a newFilePath');
                throw new Error('Rename action requires a newFilePath');
            }

            (actionAttributes as RenameAction).filePath = filePath;
            (actionAttributes as RenameAction).newFilePath = newFilePath;
        } else if (actionType === 'file') {
            const filePath = this.#extractAttribute(actionTag, 'filePath') as string;
            const diffMode = this.#extractAttribute(actionTag, 'diffMode') as string;
            if (!filePath) {
                console.warn('FilePath not found!');
                throw new Error('FilePath not found!');
            }

            (actionAttributes as FileAction).filePath = filePath;
        } else if (!['shell', 'start'].includes(actionType)) {
            console.warn(`Unknown action type '${actionType}'`);
        }

        return actionAttributes as FileAction | ShellAction;
    }

    #extractAttribute(tag: string, attributeName: string): string | undefined {
        const match = tag.match(new RegExp(`${attributeName}="([^"]*)"`, 'i'));
        return match ? match[1] : undefined;
    }
}