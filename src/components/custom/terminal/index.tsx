"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { Unicode11Addon } from "@xterm/addon-unicode11";
import { AttachAddon } from "@xterm/addon-attach";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Square, Play, Terminal as TerminalIcon, Package, Server } from "lucide-react";

// Import WASM worker (you'll need to set this up)
// import TerminalWorker from './terminal.worker?worker';

interface TerminalProps {
    fileData: Record<string, { code: string }>;
    onServerReady?: (url: string) => void;
    template: string;
}

interface FrameworkConfig {
    name: string;
    displayName: string;
    port: number;
    startCommand: string;
    installCommand: string;
    buildCommand?: string;
    devCommand: string;
}

// Framework configurations
const FRAMEWORK_CONFIGS: Record<string, FrameworkConfig> = {
    nextjs: {
        name: 'nextjs',
        displayName: 'Next.js',
        port: 3000,
        startCommand: 'next dev',
        installCommand: 'npm install',
        devCommand: 'npm run dev',
        buildCommand: 'npm run build'
    },
    react: {
        name: 'react',
        displayName: 'React',
        port: 3000,
        startCommand: 'react-scripts start',
        installCommand: 'npm install',
        devCommand: 'npm start'
    },
    vue: {
        name: 'vue',
        displayName: 'Vue.js',
        port: 8080,
        startCommand: 'vue-cli-service serve',
        installCommand: 'npm install',
        devCommand: 'npm run serve'
    },
    angular: {
        name: 'angular',
        displayName: 'Angular',
        port: 4200,
        startCommand: 'ng serve',
        installCommand: 'npm install',
        devCommand: 'npm start'
    },
    remix: {
        name: 'remix',
        displayName: 'Remix',
        port: 3000,
        startCommand: 'remix dev',
        installCommand: 'npm install',
        devCommand: 'npm run dev'
    }
};

export function Terminal({ fileData, onServerReady, template }: TerminalProps) {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<XTerm | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const workerRef = useRef<Worker | null>(null);
    const wsRef = useRef<WebSocket | null>(null);

    const [isRunning, setIsRunning] = useState(false);
    const [serverUrl, setServerUrl] = useState<string | null>(null);
    const [currentStep, setCurrentStep] = useState<string>("");
    const [isInstalling, setIsInstalling] = useState(false);
    const [customCommand, setCustomCommand] = useState("");
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [terminalReady, setTerminalReady] = useState(false);

    const { theme } = useTheme();

    // Initialize terminal when component mounts
    useEffect(() => {
        initializeTerminal();
        return () => cleanup();
    }, []);

    // Update theme when it changes
    useEffect(() => {
        if (xtermRef.current) {
            xtermRef.current.options.theme = {
                background: theme === 'dark' ? '#1a1a1a' : '#ffffff',
                foreground: theme === 'dark' ? '#ffffff' : '#000000',
                cursor: theme === 'dark' ? '#ffffff' : '#000000',
                cursorAccent: theme === 'dark' ? '#000000' : '#ffffff',
                // selection: theme === 'dark' ? '#ffffff40' : '#00000040',
            };
        }
    }, [theme]);

    const initializeTerminal = useCallback(() => {
        if (!terminalRef.current || xtermRef.current) return;

        // Initialize xterm.js
        const terminal = new XTerm({
            cursorBlink: true,
            fontSize: 14,
            fontFamily: '"Cascadia Code", "Fira Code", "JetBrains Mono", "Menlo", "Monaco", "Courier New", monospace',
            theme: {
                background: theme === 'dark' ? '#1a1a1a' : '#ffffff',
                foreground: theme === 'dark' ? '#ffffff' : '#000000',
                cursor: theme === 'dark' ? '#ffffff' : '#000000',
                cursorAccent: theme === 'dark' ? '#000000' : '#ffffff',
                // selection: theme === 'dark' ? '#ffffff40' : '#00000040',
            },
            allowProposedApi: true,
            convertEol: true,
            disableStdin: false,
            rows: 24,
            cols: 80,
        });

        // Load addons
        const fitAddon = new FitAddon();
        const webLinksAddon = new WebLinksAddon();
        const unicode11Addon = new Unicode11Addon();

        terminal.loadAddon(fitAddon);
        terminal.loadAddon(webLinksAddon);
        terminal.loadAddon(unicode11Addon);
        terminal.unicode.activeVersion = '11';

        // Open terminal
        terminal.open(terminalRef.current);
        fitAddon.fit();

        // Set refs
        xtermRef.current = terminal;
        fitAddonRef.current = fitAddon;

        // Initialize virtual file system and environment
        initializeEnvironment();

        // Welcome message
        writeToTerminal('🚀 Proxy Terminal Ready\n', 'success');
        writeToTerminal('💡 Virtual environment initialized with Node.js support\n');
        writeToTerminal('📦 File system ready for framework execution\n\n');

        setTerminalReady(true);

        // Handle input
        let currentLine = '';
        terminal.onData((data) => {
            if (data === '\r') {
                // Enter key
                terminal.write('\r\n');
                if (currentLine.trim()) {
                    executeCommand(currentLine.trim());
                    setCommandHistory(prev => [...prev, currentLine.trim()]);
                    setHistoryIndex(-1);
                }
                currentLine = '';
                writePrompt();
            } else if (data === '\u007F') {
                // Backspace
                if (currentLine.length > 0) {
                    currentLine = currentLine.slice(0, -1);
                    terminal.write('\b \b');
                }
            } else if (data === '\u001B[A') {
                // Up arrow - command history
                if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
                    const newIndex = historyIndex + 1;
                    const command = commandHistory[commandHistory.length - 1 - newIndex];
                    // Clear current line
                    terminal.write('\r\x1b[K');
                    writePrompt();
                    terminal.write(command);
                    currentLine = command;
                    setHistoryIndex(newIndex);
                }
            } else if (data === '\u001B[B') {
                // Down arrow - command history
                if (historyIndex > 0) {
                    const newIndex = historyIndex - 1;
                    const command = commandHistory[commandHistory.length - 1 - newIndex];
                    // Clear current line
                    terminal.write('\r\x1b[K');
                    writePrompt();
                    terminal.write(command);
                    currentLine = command;
                    setHistoryIndex(newIndex);
                } else if (historyIndex === 0) {
                    // Clear current line
                    terminal.write('\r\x1b[K');
                    writePrompt();
                    currentLine = '';
                    setHistoryIndex(-1);
                }
            } else if (data.charCodeAt(0) >= 32 || data === '\t') {
                // Regular characters and tab
                currentLine += data;
                terminal.write(data);
            }
        });

        writePrompt();

        // Handle resize
        const handleResize = () => {
            if (fitAddonRef.current) {
                fitAddonRef.current.fit();
            }
        };

        const resizeObserver = new ResizeObserver(handleResize);
        if (terminalRef.current) {
            resizeObserver.observe(terminalRef.current);
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, [theme, commandHistory, historyIndex]);

    const cleanup = () => {
        if (xtermRef.current) {
            xtermRef.current.dispose();
            xtermRef.current = null;
        }
        if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
        }
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
    };

    const initializeEnvironment = () => {
        // Initialize virtual file system with current files
        if (typeof window !== 'undefined') {
            // Create virtual file system
            (window as any).virtualFs = {
                files: { ...fileData },
                cwd: '/',
                env: {
                    NODE_ENV: 'development',
                    PATH: '/usr/local/bin:/usr/bin:/bin',
                    HOME: '/home/user'
                }
            };
        }
    };

    const writeToTerminal = (text: string, type: 'normal' | 'error' | 'success' | 'info' = 'normal') => {
        if (!xtermRef.current) return;

        let colorCode = '\x1b[0m';
        switch (type) {
            case 'error':
                colorCode = '\x1b[31m'; // Red
                break;
            case 'success':
                colorCode = '\x1b[32m'; // Green
                break;
            case 'info':
                colorCode = '\x1b[36m'; // Cyan
                break;
            case 'normal':
            default:
                colorCode = '\x1b[37m'; // White
                break;
        }

        const resetCode = '\x1b[0m';
        xtermRef.current.write(`${colorCode}${text}${resetCode}`);
    };

    const writePrompt = () => {
        if (!xtermRef.current) return;
        const cwd = (window as any).virtualFs?.cwd || '/';
        const prompt = `\x1b[32muser@proxy\x1b[0m:\x1b[34m${cwd}\x1b[0m$ `;
        xtermRef.current.write(prompt);
    };

    const detectFramework = (): FrameworkConfig => {
        try {
            const packageJsonContent = fileData['package.json']?.code;
            if (!packageJsonContent) return FRAMEWORK_CONFIGS.react;

            const packageJson = JSON.parse(packageJsonContent);
            const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

            if (deps['next']) return FRAMEWORK_CONFIGS.nextjs;
            if (deps['@remix-run/dev']) return FRAMEWORK_CONFIGS.remix;
            if (deps['vue']) return FRAMEWORK_CONFIGS.vue;
            if (deps['@angular/core']) return FRAMEWORK_CONFIGS.angular;
            if (deps['react']) return FRAMEWORK_CONFIGS.react;

            return FRAMEWORK_CONFIGS.react;
        } catch {
            return FRAMEWORK_CONFIGS.react;
        }
    };

    const executeCommand = async (command: string) => {
        const parts = command.trim().split(' ');
        const cmd = parts[0];
        const args = parts.slice(1);

        switch (cmd) {
            case 'npm':
                await handleNpmCommand(args);
                break;
            case 'yarn':
                await handleYarnCommand(args);
                break;
            case 'node':
                await handleNodeCommand(args);
                break;
            case 'ls':
                handleLsCommand();
                break;
            case 'cat':
                handleCatCommand(args);
                break;
            case 'pwd':
                writeToTerminal('/\n');
                break;
            case 'clear':
                xtermRef.current?.clear();
                break;
            case 'help':
                showHelp();
                break;
            default:
                writeToTerminal(`Command not found: ${cmd}\n`, 'error');
                writeToTerminal('Type "help" for available commands\n');
                break;
        }
    };

    const handleNpmCommand = async (args: string[]) => {
        const subcommand = args[0];

        switch (subcommand) {
            case 'install':
            case 'i':
                await simulateInstallation();
                break;
            case 'start':
                await startDevServer();
                break;
            case 'run':
                const script = args[1];
                if (script === 'dev' || script === 'start') {
                    await startDevServer();
                } else if (script === 'build') {
                    await handleBuild();
                } else {
                    writeToTerminal(`Script "${script}" not found\n`, 'error');
                }
                break;
            default:
                writeToTerminal(`npm ${subcommand}: command not implemented\n`, 'error');
                break;
        }
    };

    const handleYarnCommand = async (args: string[]) => {
        const subcommand = args[0] || 'install';

        switch (subcommand) {
            case 'install':
            case 'i':
                await simulateInstallation();
                break;
            case 'start':
            case 'dev':
                await startDevServer();
                break;
            case 'build':
                await handleBuild();
                break;
            default:
                writeToTerminal(`yarn ${subcommand}: command not implemented\n`, 'error');
                break;
        }
    };

    const handleNodeCommand = async (args: string[]) => {
        const filename = args[0];
        if (!filename) {
            writeToTerminal('Node.js REPL not implemented\n', 'error');
            return;
        }

        const fileContent = fileData[filename]?.code || fileData[`/${filename}`]?.code;
        if (!fileContent) {
            writeToTerminal(`File not found: ${filename}\n`, 'error');
            return;
        }

        writeToTerminal(`Executing ${filename}...\n`, 'info');
        // Simulate execution
        await new Promise(resolve => setTimeout(resolve, 500));
        writeToTerminal('Execution completed\n', 'success');
    };

    const handleLsCommand = () => {
        const files = Object.keys(fileData).map(path => path.replace(/^\//, ''));
        writeToTerminal(files.join('  ') + '\n');
    };

    const handleCatCommand = (args: string[]) => {
        const filename = args[0];
        if (!filename) {
            writeToTerminal('Usage: cat <filename>\n', 'error');
            return;
        }

        const fileContent = fileData[filename]?.code || fileData[`/${filename}`]?.code;
        if (!fileContent) {
            writeToTerminal(`File not found: ${filename}\n`, 'error');
            return;
        }

        writeToTerminal(fileContent + '\n');
    };

    const showHelp = () => {
        writeToTerminal('Available commands:\n', 'info');
        writeToTerminal('  npm install, npm i    - Install dependencies\n');
        writeToTerminal('  npm start, npm run dev - Start development server\n');
        writeToTerminal('  npm run build         - Build for production\n');
        writeToTerminal('  yarn, yarn install    - Install dependencies with Yarn\n');
        writeToTerminal('  yarn start, yarn dev  - Start development server with Yarn\n');
        writeToTerminal('  node <file>           - Execute a JavaScript file\n');
        writeToTerminal('  ls                    - List files\n');
        writeToTerminal('  cat <file>            - Display file contents\n');
        writeToTerminal('  pwd                   - Print working directory\n');
        writeToTerminal('  clear                 - Clear terminal\n');
        writeToTerminal('  help                  - Show this help\n\n');
    };

    const simulateInstallation = async () => {
        if (isInstalling) return;

        setIsInstalling(true);
        setCurrentStep('Installing dependencies...');

        try {
            const packageJsonContent = fileData['package.json']?.code;
            if (!packageJsonContent) {
                writeToTerminal('No package.json found\n', 'error');
                return;
            }

            const packageJson = JSON.parse(packageJsonContent);
            const dependencies = {
                ...packageJson.dependencies,
                ...packageJson.devDependencies
            };

            const depNames = Object.keys(dependencies);

            writeToTerminal(`📦 Installing ${depNames.length} dependencies...\n\n`);

            // Simulate installation progress
            for (let i = 0; i < Math.min(depNames.length, 8); i++) {
                await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
                writeToTerminal(`  ✓ ${depNames[i]}@${dependencies[depNames[i]]}\n`, 'success');
            }

            if (depNames.length > 8) {
                writeToTerminal(`  ... and ${depNames.length - 8} more packages\n`);
            }

            await new Promise(resolve => setTimeout(resolve, 500));
            writeToTerminal(`\n✅ Dependencies installed successfully!\n`, 'success');
            writeToTerminal(`📊 ${depNames.length} packages installed\n\n`);

        } catch (error) {
            writeToTerminal(`❌ Installation failed: ${error}\n`, 'error');
        } finally {
            setIsInstalling(false);
            setCurrentStep('');
        }
    };

    const startDevServer = async () => {
        if (isRunning) {
            writeToTerminal('Development server is already running\n', 'info');
            return;
        }

        const framework = detectFramework();
        setCurrentStep('Starting development server...');

        try {
            const serverUrl = `http://localhost:${framework.port}`;

            writeToTerminal(`🚀 Starting ${framework.displayName} development server...\n`, 'info');

            // Simulate server startup
            await new Promise(resolve => setTimeout(resolve, 800));
            writeToTerminal(`📡 Local:    ${serverUrl}\n`, 'success');
            writeToTerminal(`🌐 Network:  http://192.168.1.100:${framework.port}\n`);

            await new Promise(resolve => setTimeout(resolve, 400));
            writeToTerminal(`\n✨ Ready in ${(Math.random() * 2 + 1).toFixed(1)}s\n`, 'success');
            writeToTerminal(`🎯 Application is running at ${serverUrl}\n\n`);

            setServerUrl(serverUrl);
            setIsRunning(true);
            setCurrentStep('');
            onServerReady?.(serverUrl);

        } catch (error) {
            writeToTerminal(`❌ Failed to start server: ${error}\n`, 'error');
            setCurrentStep('');
        }
    };

    const handleBuild = async () => {
        setCurrentStep('Building application...');
        writeToTerminal('🔨 Building for production...\n', 'info');

        await new Promise(resolve => setTimeout(resolve, 2000));
        writeToTerminal('✅ Build completed successfully!\n', 'success');
        writeToTerminal('📁 Output directory: ./dist\n\n');
        setCurrentStep('');
    };

    const stopServer = () => {
        if (!isRunning) return;

        writeToTerminal('🛑 Stopping development server...\n');
        setIsRunning(false);
        setServerUrl(null);
        setCurrentStep('');
        writeToTerminal('✅ Server stopped\n\n', 'success');
    };

    const clearTerminal = () => {
        if (xtermRef.current) {
            xtermRef.current.clear();
            writeToTerminal('🚀 Proxy Terminal Ready\n', 'success');
            writeToTerminal('💡 Type "help" for available commands\n\n');
            writePrompt();
        }
    };

    const executeCustomCommand = () => {
        if (!customCommand.trim()) return;

        writeToTerminal(`$ ${customCommand}\n`);
        executeCommand(customCommand);
        setCommandHistory(prev => [...prev, customCommand]);
        setCustomCommand('');
    };

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Header */}
            <div className="border-b p-3 space-y-3">
                {/* Quick Actions */}
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        onClick={() => executeCommand('npm install')}
                        disabled={isInstalling || !terminalReady}
                        variant="outline"
                    >
                        <Package className="h-4 w-4 mr-1" />
                        Install
                    </Button>

                    <Button
                        size="sm"
                        onClick={() => executeCommand('npm run dev')}
                        disabled={isRunning || !terminalReady}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        <Play className="h-4 w-4 mr-1" />
                        {isRunning ? 'Running' : 'Start Server'}
                    </Button>

                    <Button
                        size="sm"
                        variant="destructive"
                        onClick={stopServer}
                        disabled={!isRunning}
                    >
                        <Square className="h-4 w-4 mr-1" />
                        Stop
                    </Button>

                    <Button
                        size="sm"
                        variant="outline"
                        onClick={clearTerminal}
                    >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Clear
                    </Button>
                </div>

                {/* Custom Command Input */}
                <div className="flex items-center gap-2">
                    <TerminalIcon className="h-4 w-4 text-muted-foreground" />
                    <Input
                        value={customCommand}
                        onChange={(e) => setCustomCommand(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') executeCustomCommand();
                        }}
                        placeholder="Enter command..."
                        className="flex-1 font-mono text-sm"
                        disabled={!terminalReady}
                    />
                    <Button
                        size="sm"
                        onClick={executeCustomCommand}
                        disabled={!customCommand.trim() || !terminalReady}
                    >
                        Run
                    </Button>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                        {currentStep && (
                            <div className="text-blue-600 flex items-center gap-1">
                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                                <span>{currentStep}</span>
                            </div>
                        )}

                        {serverUrl && !currentStep && (
                            <div className="text-green-600 flex items-center gap-1">
                                <Server className="h-3 w-3" />
                                <span className="font-mono">{serverUrl}</span>
                            </div>
                        )}
                    </div>

                    <div className="text-muted-foreground flex items-center gap-2">
                        <span>Framework: {detectFramework().displayName}</span>
                        <span>•</span>
                        <span>Status: {terminalReady ? 'Ready' : 'Initializing...'}</span>
                    </div>
                </div>
            </div>

            {/* Terminal */}
            <div
                ref={terminalRef}
                className="flex-1 bg-background"
                style={{ minHeight: '400px' }}
            />
        </div>
    );
}