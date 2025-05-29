"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, ExternalLink, Smartphone, Tablet, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

interface PreviewProps {
    fileData: Record<string, { code: string }>;
    serverUrl?: string;
    template: string;
}

type ViewportSize = 'mobile' | 'tablet' | 'desktop';

export function Preview({ fileData, serverUrl, template }: PreviewProps) {
    const [currentUrl, setCurrentUrl] = useState<string>("");
    const [inputUrl, setInputUrl] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [viewport, setViewport] = useState<ViewportSize>('desktop');
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const { theme } = useTheme();

    // Update URL when server starts
    useEffect(() => {
        if (serverUrl) {
            setCurrentUrl(serverUrl);
            setInputUrl(serverUrl);
        }
    }, [serverUrl]);

    // Handle iframe loading states
    useEffect(() => {
        if (!iframeRef.current || !currentUrl) return;

        const iframe = iframeRef.current;

        const handleLoad = () => {
            setLoading(false);
            setError(null);
        };

        const handleError = () => {
            setLoading(false);
            setError('Failed to load preview');
        };

        iframe.addEventListener('load', handleLoad);
        iframe.addEventListener('error', handleError);

        return () => {
            iframe.removeEventListener('load', handleLoad);
            iframe.removeEventListener('error', handleError);
        };
    }, [currentUrl]);

    const refreshPreview = () => {
        if (iframeRef.current && currentUrl) {
            setLoading(true);
            setError(null);
            iframeRef.current.src = currentUrl + '?t=' + Date.now();
        }
    };

    const navigateToUrl = () => {
        if (inputUrl.trim()) {
            setLoading(true);
            setError(null);
            setCurrentUrl(inputUrl.trim());
        }
    };

    const openInNewTab = () => {
        if (currentUrl) {
            window.open(currentUrl, '_blank');
        }
    };

    const getViewportStyles = () => {
        switch (viewport) {
            case 'mobile':
                return { width: '375px', height: '667px' };
            case 'tablet':
                return { width: '768px', height: '1024px' };
            case 'desktop':
            default:
                return { width: '100%', height: '100%' };
        }
    };

    const getFrameworkInfo = () => {
        try {
            const packageJsonContent = fileData['package.json']?.code;
            if (!packageJsonContent) return null;

            const packageJson = JSON.parse(packageJsonContent);
            const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

            if (deps['next']) return { name: 'Next.js', icon: '⚡' };
            if (deps['@remix-run/dev']) return { name: 'Remix', icon: '💿' };
            if (deps['vue']) return { name: 'Vue.js', icon: '💚' };
            if (deps['@angular/core']) return { name: 'Angular', icon: '🅰️' };
            if (deps['react']) return { name: 'React', icon: '⚛️' };

            return { name: 'JavaScript', icon: '📦' };
        } catch {
            return { name: 'Unknown', icon: '❓' };
        }
    };

    const frameworkInfo = getFrameworkInfo();

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Header */}
            <div className="border-b p-3 space-y-2">
                {/* URL Bar */}
                <div className="flex items-center gap-2">
                    <Button
                        size="icon"
                        variant="outline"
                        onClick={refreshPreview}
                        disabled={!currentUrl || loading}
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>

                    <Input
                        value={inputUrl}
                        onChange={(e) => setInputUrl(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') navigateToUrl();
                        }}
                        placeholder="Enter URL or wait for dev server..."
                        className="flex-1 font-mono text-sm"
                        disabled={loading}
                    />

                    <Button
                        size="icon"
                        variant="outline"
                        onClick={openInNewTab}
                        disabled={!currentUrl}
                    >
                        <ExternalLink className="h-4 w-4" />
                    </Button>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {/* Viewport Controls */}
                        <div className="flex items-center gap-1 border rounded-md p-1">
                            <Button
                                size="sm"
                                variant={viewport === 'mobile' ? 'default' : 'ghost'}
                                onClick={() => setViewport('mobile')}
                                className="px-2 py-1 h-7"
                            >
                                <Smartphone className="h-3 w-3" />
                            </Button>
                            <Button
                                size="sm"
                                variant={viewport === 'tablet' ? 'default' : 'ghost'}
                                onClick={() => setViewport('tablet')}
                                className="px-2 py-1 h-7"
                            >
                                <Tablet className="h-3 w-3" />
                            </Button>
                            <Button
                                size="sm"
                                variant={viewport === 'desktop' ? 'default' : 'ghost'}
                                onClick={() => setViewport('desktop')}
                                className="px-2 py-1 h-7"
                            >
                                <Monitor className="h-3 w-3" />
                            </Button>
                        </div>

                        {/* Framework Info */}
                        {frameworkInfo && (
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <span>{frameworkInfo.icon}</span>
                                <span>{frameworkInfo.name}</span>
                            </div>
                        )}
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {loading && (
                            <div className="flex items-center gap-1">
                                <RefreshCw className="h-3 w-3 animate-spin" />
                                <span>Loading...</span>
                            </div>
                        )}
                        {error && (
                            <div className="text-red-500 flex items-center gap-1">
                                <span>❌</span>
                                <span>{error}</span>
                            </div>
                        )}
                        {currentUrl && !loading && !error && (
                            <div className="text-green-600 flex items-center gap-1">
                                <span>🟢</span>
                                <span>Ready</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 p-4 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                {currentUrl ? (
                    <div
                        className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden border transition-all duration-300"
                        style={getViewportStyles()}
                    >
                        <iframe
                            ref={iframeRef}
                            src={currentUrl}
                            title="App Preview"
                            className="w-full h-full border-0"
                            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
                            loading="lazy"
                        />
                    </div>
                ) : (
                    <div className="text-center p-8 text-muted-foreground">
                        <div className="mb-4 text-4xl">🚀</div>
                        <h3 className="text-lg font-medium mb-2">No Preview Available</h3>
                        <p className="text-sm">
                            Start the development server in the Terminal to see your app preview here.
                        </p>
                        <div className="mt-4 p-4 bg-muted rounded-lg text-left max-w-md">
                            <p className="text-xs font-mono">
                                💡 <strong>Quick Start:</strong><br />
                                1. Click "Start Server" in Terminal<br />
                                2. Wait for the server to start<br />
                                3. Preview will appear automatically
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            {currentUrl && (
                <div className="border-t p-2 text-xs text-muted-foreground flex items-center justify-between">
                    <span>Preview: {viewport} view</span>
                    <span className="font-mono">{currentUrl}</span>
                </div>
            )}
        </div>
    );
}