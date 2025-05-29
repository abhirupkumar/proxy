// public/workers/node-worker.js
// Web Worker for Node.js WASM environment

let nodeInstance = null;
let fileSystem = {};

// Simulate Node.js file system
function writeFile(path, content) {
    fileSystem[path] = content;
}

function readFile(path) {
    return fileSystem[path] || '';
}

// Package manager commands
function executeCommand(command, files) {
    const commands = command.trim().split(' ');
    const baseCommand = commands[0];

    switch (baseCommand) {
        case 'npm':
            return handleNpmCommand(commands.slice(1), files);
        case 'yarn':
            return handleYarnCommand(commands.slice(1), files);
        case 'pnpm':
            return handlePnpmCommand(commands.slice(1), files);
        case 'clear':
            return { success: true, clear: true };
        default:
            return { error: 'Command not found: ' + baseCommand };
    }
}

function handleNpmCommand(args, files) {
    if (args[0] === 'install' || args[0] === 'i') {
        return installDependencies(files);
    } else if (args[0] === 'run') {
        const script = args[1] || 'start';
        return runScript(script, files);
    } else if (args[0] === 'start') {
        return runScript('start', files);
    }
    return { error: 'npm command not supported: ' + args.join(' ') };
}

function handleYarnCommand(args, files) {
    if (args[0] === 'install' || args.length === 0) {
        return installDependencies(files);
    } else if (args[0] === 'start' || args[0] === 'dev') {
        return runScript(args[0], files);
    }
    return { error: 'yarn command not supported: ' + args.join(' ') };
}

function handlePnpmCommand(args, files) {
    if (args[0] === 'install' || args[0] === 'i') {
        return installDependencies(files);
    } else if (args[0] === 'run') {
        const script = args[1] || 'start';
        return runScript(script, files);
    } else if (args[0] === 'start') {
        return runScript('start', files);
    }
    return { error: 'pnpm command not supported: ' + args.join(' ') };
}

function installDependencies(files) {
    try {
        const packageJsonContent = files['package.json']?.code;
        if (!packageJsonContent) {
            return { error: 'package.json not found' };
        }

        const packageJson = JSON.parse(packageJsonContent);
        const dependencies = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies
        };

        // Simulate installation process
        const depCount = Object.keys(dependencies).length;
        return {
            success: true,
            message: `Installing ${depCount} dependencies...`,
            dependencies: Object.keys(dependencies),
            installComplete: true
        };
    } catch (error) {
        return { error: 'Failed to parse package.json: ' + error.message };
    }
}

function runScript(scriptName, files) {
    try {
        const packageJsonContent = files['package.json']?.code;
        if (!packageJsonContent) {
            return { error: 'package.json not found' };
        }

        const packageJson = JSON.parse(packageJsonContent);
        const scripts = packageJson.scripts || {};

        if (!scripts[scriptName]) {
            return { error: `Script "${scriptName}" not found in package.json` };
        }

        // Determine framework and start appropriate dev server
        const framework = detectFramework(packageJson, files);
        const port = getFrameworkPort(framework);

        return {
            success: true,
            framework,
            port,
            script: scripts[scriptName],
            serverUrl: `http://localhost:${port}`,
            serverStarting: true
        };
    } catch (error) {
        return { error: 'Failed to run script: ' + error.message };
    }
}

function detectFramework(packageJson, files) {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    if (deps['next']) return 'nextjs';
    if (deps['@remix-run/dev']) return 'remix';
    if (deps['vue']) return 'vue';
    if (deps['@angular/core']) return 'angular';
    if (deps['react']) return 'react';
    if (deps['vite']) return 'vite';

    return 'unknown';
}

function getFrameworkPort(framework) {
    const ports = {
        'nextjs': 3000,
        'react': 3000,
        'vue': 8080,
        'angular': 4200,
        'remix': 3000,
        'vite': 5173
    };
    return ports[framework] || 3000;
}

// Message handler
self.onmessage = function (e) {
    const { type, command, files } = e.data;

    if (type === 'execute') {
        const result = executeCommand(command, files);
        self.postMessage({ type: 'result', ...result });
    }
};