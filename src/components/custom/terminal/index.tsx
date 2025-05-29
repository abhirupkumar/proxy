"use client";

import { useEffect, useRef, useState } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { Unicode11Addon } from "@xterm/addon-unicode11";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Trash2, Square, Play } from "lucide-react";

interface TerminalProps {
    fileData: Record<string, { code: string }>;
    onServerReady?: (url: string) => void;
    template: string;
}

export function Terminal({ fileData, onServerReady, template }: TerminalProps) {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<XTerm | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [serverUrl, setServerUrl] = useState<string | null>(null);
    const [currentStep, setCurrentStep] = useState<string>("");
    const { theme } = useTheme();

    useEffect(() => {
        if (!terminalRef.current) return;

        // Initialize xterm.js
        const terminal = new XTerm({
            cursorBlink: true,
            fontSize: 14,
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            theme: {
                background: theme === 'dark' ? '#1a1a1a' : '#ffffff',
                foreground: theme === 'dark' ? '#ffffff' : '#000000',
                cursor: theme === 'dark' ? '#ffffff' : '#000000',
                // selection: theme === 'dark' ? '#ffffff40' : '#00000040',
            },
            allowProposedApi: true,
        });

        const fitAddon = new FitAddon();
        const webLinksAddon = new WebLinksAddon();
        const unicode11Addon = new Unicode11Addon();

        terminal.loadAddon(fitAddon);
        terminal.loadAddon(webLinksAddon);
        terminal.loadAddon(unicode11Addon);
        terminal.unicode.activeVersion = '11';

        terminal.open(terminalRef.current);
        fitAddon.fit();

        xtermRef.current = terminal;
        fitAddonRef.current = fitAddon;

        // Welcome message
        writeToTerminal('🚀 Proxy Terminal Ready\n');
        writeToTerminal('💡 Click "Start Server" to begin development\n\n');

        // Handle resize
        const handleResize = () => {
            if (fitAddonRef.current) {
                fitAddonRef.current.fit();
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            terminal.dispose();
            window.removeEventListener('resize', handleResize);
        };
    }, [theme]);

    const writeToTerminal = (text: string, type: 'normal' | 'error' | 'success' = 'normal') => {
        if (!xtermRef.current) return;

        let colorCode = '\x1b[0m'; // Reset
        switch (type) {
            case 'error':
                colorCode = '\x1b[31m'; // Red
                break;
            case 'success':
                colorCode = '\x1b[32m'; // Green
                break;
            case 'normal':
            default:
                colorCode = '\x1b[37m'; // White
                break;
        }

        const resetCode = '\x1b[0m';
        xtermRef.current.write(`${colorCode}${text}${resetCode}`);
    };

    const detectFramework = () => {
        try {
            const packageJsonContent = fileData['package.json']?.code;
            if (!packageJsonContent) return { name: 'unknown', port: 3001 };

            const packageJson = JSON.parse(packageJsonContent);
            const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

            if (deps['next']) return { name: 'nextjs', port: 3001, displayName: 'Next.js' };
            if (deps['@remix-run/dev']) return { name: 'remix', port: 3001, displayName: 'Remix' };
            if (deps['vue']) return { name: 'vue', port: 8080, displayName: 'Vue.js' };
            if (deps['@angular/core']) return { name: 'angular', port: 4200, displayName: 'Angular' };
            if (deps['react']) return { name: 'react', port: 3001, displayName: 'React' };

            return { name: 'unknown', port: 3001, displayName: 'JavaScript' };
        } catch {
            return { name: 'unknown', port: 3001, displayName: 'JavaScript' };
        }
    };

    const getDependencies = () => {
        try {
            const packageJsonContent = fileData['package.json']?.code;
            if (!packageJsonContent) return [];

            const packageJson = JSON.parse(packageJsonContent);
            const dependencies = {
                ...packageJson.dependencies,
                ...packageJson.devDependencies
            };

            return Object.keys(dependencies);
        } catch {
            return [];
        }
    };

    const simulateInstallation = async (dependencies: string[]) => {
        setCurrentStep('Installing dependencies...');
        writeToTerminal(`$ npm install\n`);
        writeToTerminal(`📦 Installing ${dependencies.length} dependencies...\n\n`);

        // Show some dependencies being installed
        for (let i = 0; i < Math.min(dependencies.length, 5); i++) {
            await new Promise(resolve => setTimeout(resolve, 300));
            writeToTerminal(`  ✓ ${dependencies[i]}\n`, 'success');
        }

        if (dependencies.length > 5) {
            writeToTerminal(`  ... and ${dependencies.length - 5} more\n`);
        }

        await new Promise(resolve => setTimeout(resolve, 500));
        writeToTerminal(`\n✅ Dependencies installed successfully!\n\n`, 'success');
    };

    const simulateServerStart = async (framework: any) => {
        setCurrentStep('Starting development server...');

        const serverUrl = `http://localhost:${framework.port}`;

        writeToTerminal(`$ npm run dev\n`);
        writeToTerminal(`🚀 Starting ${framework.displayName} development server...\n`);

        await new Promise(resolve => setTimeout(resolve, 1000));

        writeToTerminal(`📡 Local:    ${serverUrl}\n`, 'success');
        writeToTerminal(`🌐 Network:  http://192.168.1.100:${framework.port}\n`);
        writeToTerminal(`\n✨ Ready in 1.2s\n\n`, 'success');

        setServerUrl(serverUrl);
        setIsRunning(true);
        setCurrentStep('');
        onServerReady?.(serverUrl);
    };

    const startDevServer = async () => {
        if (isRunning) return;

        const framework = detectFramework();
        const dependencies = getDependencies();

        if (dependencies.length === 0) {
            writeToTerminal('❌ No package.json found or no dependencies to install\n\n', 'error');
            return;
        }

        try {
            // Step 1: Install dependencies
            await simulateInstallation(dependencies);

            // Step 2: Start server
            await simulateServerStart(framework);

        } catch (error) {
            writeToTerminal(`❌ Error: ${error}\n\n`, 'error');
            setCurrentStep('');
        }
    };

    const stopServer = () => {
        if (!isRunning) return;

        writeToTerminal(`\n🛑 Stopping development server...\n`);
        writeToTerminal(`✅ Server stopped\n\n`, 'success');

        setIsRunning(false);
        setServerUrl(null);
        setCurrentStep('');
    };

    const clearTerminal = () => {
        if (xtermRef.current) {
            xtermRef.current.clear();
            writeToTerminal('🚀 Proxy Terminal Ready\n');
            writeToTerminal('💡 Click "Start Server" to begin development\n\n');
        }
    };

    const executeCustomCommand = (command: string) => {
        writeToTerminal(`$ ${command}\n`);

        if (command.includes('install')) {
            const dependencies = getDependencies();
            simulateInstallation(dependencies);
        } else if (command.includes('start') || command.includes('dev')) {
            const framework = detectFramework();
            simulateServerStart(framework);
        } else {
            writeToTerminal(`Command "${command}" executed\n\n`);
        }
    };

    return (
        <div className="h-full flex flex-col bg-background">
            <div className="border-b p-3 space-y-2">
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        onClick={startDevServer}
                        disabled={isRunning || !!currentStep}
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
                                <div className="w-2 h-2 bg-green-600 rounded-full" />
                                <span className="font-mono">{serverUrl}</span>
                            </div>
                        )}
                    </div>

                    <div className="text-muted-foreground">
                        Framework: {detectFramework().displayName}
                    </div>
                </div>
            </div>

            <div
                ref={terminalRef}
                className="flex-1 p-4 bg-background"
                style={{ minHeight: '400px' }}
            />
        </div>
    );
}