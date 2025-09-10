import testFiles from './test-files.json';

export const listDir = (args: { target_dir_path: string }) => {
    console.log('listDir called with:', args);
    let filePath = args.target_dir_path;
    if (!filePath.startsWith('.')) {
        filePath = filePath.replace('.', '');
    }
    if (filePath === '/') {
        filePath = filePath.replace('/', '');
    }
    const allFiles = Object.keys(testFiles);
    if (filePath == '') return { status: 'completed', files: allFiles };
    const filteredFiles = allFiles.filter(file => file.startsWith(filePath));
    return { status: 'completed', files: filteredFiles };
};

export const readFiles = (args: { target_file_paths: string[] }) => {
    console.log('readFiles called with:', args);
    const contents = args.target_file_paths.map(filePath => {
        // @ts-ignore
        return { path: filePath, content: testFiles[filePath]?.code || 'File not found' };
    });
    return { status: 'completed', content: contents };
};

export const editFile = (args: { file_path: string; content: string }) => {
    console.log('writeFile called with:', args);
    // @ts-ignore
    testFiles[args.file_path] = { code: args.content };
    return { status: 'completed' };
};

export const askUser = (args: { question: string }) => {
    console.log('askUser called with:', args);
    return { status: 'completed', answer: 'User confirmed.' };
};
