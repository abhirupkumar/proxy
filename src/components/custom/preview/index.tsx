"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { loadSandpackClient, SandboxSetup } from "@codesandbox/sandpack-client";
import { Nodebox } from "@codesandbox/nodebox";
import { SandpackLayout, SandpackPreview, SandpackProvider } from "@codesandbox/sandpack-react";
import { useTheme } from "next-themes";

interface PreviewFrameProps {
    // files: { [key: string]: { code: string } } | null;
    files: any;
}

export function Preview({ files }: PreviewFrameProps) {
    const [url, setUrl] = useState<string | null>(null);
    const sandpackRef = useRef<HTMLIFrameElement | null>(null);
    const [path, setPath] = useState("/");
    const [newPath, setNewPath] = useState("/");
    const [state, setState] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const { theme } = useTheme();

    // useEffect(() => {
    //     if (!sandpackRef.current) return;

    //     async function setupSandpack() {
    //         try {
    //             const iframe = sandpackRef.current as HTMLIFrameElement;
    //             if (!iframe) {
    //                 return;
    //             }
    //             // const newFileData: any = {};
    //             // Object.entries(files!).forEach(([filename, { code }]: [filename: string, { code: string }]) => {
    //             //     newFileData[filename] = code;
    //             // });
    //             const content: SandboxSetup = {
    //                 files,
    //             };
    //             const client: any = await loadSandpackClient(
    //                 iframe,
    //                 content
    //             );
    //             // console.log(client)
    //             const codeSandboxUrl = await client?.getCodeSandboxURL();
    //             setUrl("https://" + codeSandboxUrl.sandboxId + ".csb.app");
    //             setState("Server is on.");
    //         } catch (error) {
    //             setError("Failed to load Preview.");
    //             console.log(error);
    //         }
    //     }

    //     setupSandpack();
    // }, []);

    // useEffect(() => {
    //     init();
    // }, [])

    // async function init() {
    //     // Create a new Nodebox runtime to evaluate Node.js code.
    //     const runtime = new Nodebox({
    //         // Provide a reference to the iframe on the page
    //         // that will mount the Nodebox runtime, allowing it to
    //         // communicate with the rest of the application.
    //         iframe: document.getElementById("nodebox-iframe") as HTMLIFrameElement,
    //     });

    //     // Establish a connection to the runtime.
    //     await runtime.connect();

    //     const newFileData: any = {};
    //     Object.entries(files!).forEach(([filename, { code }]: [filename: string, { code: string }]) => {
    //         newFileData[filename] = code;
    //     });

    //     // Populate the file system with a Next.js project.
    //     await runtime.fs.init({
    //         ...newFileData
    //     });

    //     const shell = runtime.shell.create();

    //     const nextProcess = await shell.runCommand("next", ["dev"]);
    //     console.log(nextProcess)

    //     const previewInfo = await runtime.preview.getByShellId(nextProcess.id);
    // console.log(previewInfo)
    //     setUrl(previewInfo.url);
    // }

    return (
        <div className="h-full text-gray-400">
            {/* <div className="h-full flex flex-col">
                <div className="border-b p-4 flex items-center gap-2">
                    <Button size="icon" variant="outline" onClick={() => setPath("/")}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Input
                        value={newPath}
                        onChange={(e) => setNewPath(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key == 'Enter') setPath(newPath);
                        }}
                        className="font-mono text-sm"
                    />
                </div>
                <div className="flex-1 bg-background h-full">
                    <iframe
                        ref={sandpackRef} id="nodebox-iframe" className="hidden"></iframe>
                    {url ? <iframe
                        src={url + path}
                        width={"100%"}
                        height={"100%"}
                        title="Preview"
                        sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts allow-downloads allow-pointer-lock"
                        allow="accelerometer; autoplay; camera; encrypted-media; fullscreen; geolocation; gyroscope; microphone; midi; clipboard-read; clipboard-write; payment; usb; vr; xr-spatial-tracking; screen-wake-lock; magnetometer; ambient-light-sensor; battery; gamepad; picture-in-picture; display-capture; bluetooth;" className="opacity-100"></iframe> : <div className="text-lg text-center w-full h-full my-auto">Loading...</div>}
                </div>
            </div> */}
            <SandpackProvider
                files={files}
                template="react-ts"
                options={{
                    externalResources: [
                        "https://unpkg.com/@tailwindcss/ui/dist/tailwind-ui.min.css",
                    ]
                }}
                className="min-h-full"
                theme={theme == 'dark' ? "dark" : undefined}
            >
                <SandpackLayout className="h-full">
                    <SandpackPreview
                        showOpenNewtab={true}
                        showNavigator={true}
                        showRefreshButton={true}
                        showRestartButton={true}
                        showOpenInCodeSandbox={false}
                        showSandpackErrorOverlay={true}
                        className='h-[calc(100vh-7rem)]' />
                </SandpackLayout>
            </SandpackProvider>
        </div>
    );
}