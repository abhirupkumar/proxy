import { ActionType, FileAction, ProxyAction, ProxyActionData, ProxyRegexData, ShellAction } from "./types";


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

        if (actionType === 'file') {
            const filePath = this.#extractAttribute(actionTag, 'filePath') as string;

            if (!filePath) {
                //   console.debug('File path not specified');
            }

            (actionAttributes as FileAction).filePath = filePath;
        } else if (actionType !== 'shell') {
            console.warn(`Unknown action type '${actionType}'`);
        }

        return actionAttributes as FileAction | ShellAction;
    }

    #extractAttribute(tag: string, attributeName: string): string | undefined {
        const match = tag.match(new RegExp(`${attributeName}="([^"]*)"`, 'i'));
        return match ? match[1] : undefined;
    }
}

// const createRegexElement: ElementFactory = (props) => {
//     const elementProps = [
//         'class="__proxyRegex__"',
//         ...Object.entries(props).map(([key, value]) => {
//             return `data-${camelToDashCase(key)}=${JSON.stringify(value)}`;
//         }),
//     ];

//     return `<div ${elementProps.join(' ')}></div>`;
// };

// function camelToDashCase(input: string) {
//     return input.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
// }