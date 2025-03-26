export enum StepType {
    AiResponse,
    CreateFile,
    CreateFolder,
    EditFile,
    DeleteFile,
    RunScript
}

export interface Step {
    id: number;
    title: string;
    description: string;
    type: StepType;
    status: 'pending' | 'in-progress' | 'completed';
    code?: string;
    path?: string;
}

export interface Project {
    prompt: string;
    steps: Step[];
}

export interface FileItem {
    name: string;
    type: 'file' | 'folder';
    children?: FileItem[];
    content?: string;
    path: string;
}

export interface FileViewerProps {
    file: FileItem | null;
    onClose: () => void;
}

export interface ProxyArtifactData {
    id: string;
    title: string;
}

export type ActionType = 'file' | 'shell';

export interface BaseAction {
    content: string;
}

export interface FileAction extends BaseAction {
    type: 'file';
    filePath: string;
}

export interface ShellAction extends BaseAction {
    type: 'shell';
}

export type ProxyAction = FileAction | ShellAction;

export type ProxyActionData = ProxyAction | BaseAction;