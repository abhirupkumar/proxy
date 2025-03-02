import { Step, StepType } from './types';

/*
 * Parse input XML and convert it into steps.
 * Eg: Input - 
 * <proxyArtifact id=\"project-import\" title=\"Project Files\">
 *  <proxyAction type=\"file\" filePath=\"eslint.config.js\">
 *      import js from '@eslint/js';\nimport globals from 'globals';\n
 *  </proxyAction>
 * <proxyAction type="shell">
 *      node index.js
 * </proxyAction>
 * </proxyArtifact>
 * 
 * Output - 
 * [{
 *      title: "Project Files",
 *      status: "Pending"
 * }, {
 *      title: "Create eslint.config.js",
 *      type: StepType.CreateFile,
 *      code: "import js from '@eslint/js';\nimport globals from 'globals';\n"
 * }, {
 *      title: "Run command",
 *      code: "node index.js",
 *      type: StepType.RunScript
 * }]
 * 
 * The input can have strings in the middle they need to be ignored
 */
export function parseXml(response: string): Step[] {
    // Extract the XML content between <proxyArtifact> tags
    const xmlMatch = response.match(/<proxyArtifact[^>]*>([\s\S]*?)<\/proxyArtifact>/);

    if (!xmlMatch) {
        return [];
    }

    const xmlContent = xmlMatch[1];
    const steps: Step[] = [];
    let stepId = 1;

    // Extract artifact title
    const titleMatch = response.match(/title="([^"]*)"/);
    const artifactTitle = titleMatch ? titleMatch[1] : 'Project Files';

    // Add initial artifact step
    steps.push({
        id: stepId++,
        title: artifactTitle,
        description: '',
        type: StepType.CreateFolder,
        status: 'pending'
    });

    // Regular expression to find proxyAction elements
    const actionRegex = /<proxyAction\s+type="([^"]*)"(?:\s+filePath="([^"]*)")?(?:\s+title="([^"]*)")?>([\s\S]*?)<\/proxyAction>/g;

    let match;
    while ((match = actionRegex.exec(xmlContent)) !== null) {
        const [, title, type, filePath, content] = match;

        if (type === 'ai-response') {
            // File creation step
            steps.push({
                id: stepId++,
                title: `Ai Response`,
                description: content.trim(),
                type: StepType.AiResponse,
                status: 'pending',
            });
        } else if (type === 'file') {
            // File creation step
            steps.push({
                id: stepId++,
                title: title || `Create ${filePath || 'file'}`,
                description: '',
                type: StepType.CreateFile,
                status: 'pending',
                code: content.trim(),
                path: filePath
            });
        } else if (type === 'shell') {
            // Shell command step
            steps.push({
                id: stepId++,
                title: 'Run command',
                description: '',
                type: StepType.RunScript,
                status: 'pending',
                code: content.trim()
            });
        }
    }

    return steps;
}