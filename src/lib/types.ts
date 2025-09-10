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

export interface ProxyRegexData {
    id: string;
    title: string;
}

export type ActionType = 'file' | 'shell' | 'supabase' | 'rename' | 'delete';

export interface BaseAction {
    content: string;
}

export interface FileAction extends BaseAction {
    type: 'file';
    filePath: string;
}

export interface StartAction extends BaseAction {
    type: 'start';
}

export interface ShellAction extends BaseAction {
    type: 'shell';
}

export interface RenameAction extends BaseAction {
    type: 'rename';
    filePath: string;
    newFilePath: string;
}

export interface DeleteAction extends BaseAction {
    type: 'delete';
    filePath: string;
}

export interface SupabaseAction extends BaseAction {
    type: 'supabase';
    operation: 'migration' | 'query';
    filePath?: string;
    projectId?: string;
}

export type ProxyAction = FileAction | ShellAction | StartAction | RenameAction | DeleteAction | SupabaseAction;

export type ProxyActionData = ProxyAction | BaseAction;

export interface VercelUser {
    id: string;
    username: string;
    email: string;
    name: string;
    avatar?: string;
}

export interface VercelDeployment {
    id: string;
    url: string;
    status: 'BUILDING' | 'ERROR' | 'SUCCEEDED' | 'CANCELED' | 'PROMOTED';
    createdAt: string;
    meta?: Record<string, any>;
}

export interface VercelProject {
    id: string;
    name: string;
    framework?: string;
    url?: string;
    latestDeployments?: VercelDeployment[];
}

export interface VercelStats {
    projects: VercelProject[];
    totalProjects: number;
}

export interface VercelConnection {
    user: VercelUser | null;
    token: string;
    stats?: VercelStats;
}

export interface VercelDeploymentConfig {
    name: string;
    framework?: string;
    buildCommand?: string;
    installCommand?: string;
    outputDirectory?: string;
    environmentVariables?: Record<string, string>;
}

export interface SupabaseProject {
    id: string;
    name: string;
    region: string;
    organization_id: string;
    status: string;
    database?: {
        host: string;
        version: string;
        postgres_engine: string;
        release_channel: string;
    };
    created_at: string;
}

export interface SupabaseApiKey {
    id: string;
    name: string;
    api_key: string;
    created_at: string;
}

export interface SupabaseStats {
    projects: SupabaseProject[];
    totalProjects: number;
}

export interface SupabaseCredentials {
    supabaseUrl: string;
    anonKey: string;
}

export interface SupabaseConnectionState {
    token: string | null;
    stats?: SupabaseStats;
    selectedProjectId?: string;
    isConnected: boolean;
    project?: SupabaseProject;
    credentials?: SupabaseCredentials;
}