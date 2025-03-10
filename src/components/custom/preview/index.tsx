"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { WebContainer } from '@webcontainer/api';

interface PreviewFrameProps {
    files: any;
    webcontainer: WebContainer;
}

export function Preview({ files, webcontainer }: PreviewFrameProps) {
    const [url, setUrl] = useState("");
    const [path, setPath] = useState("/");
    const [newPath, setNewPath] = useState("/");
    const [state, setState] = useState<string>("");
    const [webData, setWebData] = useState<string>();
    const [error, setError] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState<boolean>(false);

    useEffect(() => {
        const createMountStructure = (files: Record<string, any>) => {
            const mountStructure: Record<string, any> = {};

            Object.entries(files).forEach(([filePath, fileData]) => {
                const parts = filePath.split('/');
                let currentDir = mountStructure;

                for (let i = 0; i < parts.length; i++) {
                    const part = parts[i];

                    if (i === parts.length - 1) {
                        // If it's the last part, it's a file
                        currentDir[part] = { file: { contents: fileData.code } };
                    } else {
                        // If it's a folder, create a directory entry
                        if (!currentDir[part]) {
                            currentDir[part] = { directory: {} };
                        }
                        currentDir = currentDir[part].directory;
                    }
                }
            });

            return mountStructure;
        };
        setIsMounted(false);
        if (files) {
            const mountStructure = createMountStructure(files);
            webcontainer?.mount(mountStructure);
        }
        setIsMounted(true);
    }, [files, isMounted]);

    async function main() {
        const installProcess = await webcontainer.spawn('npm', ['install']);

        installProcess.output.pipeTo(new WritableStream({
            write(data) {
                setState("Installing Dependencies...");
                console.log(data)
                setWebData((prev) => (prev ? prev + "\n" + data : data));
            }
        }));

        setState("Spinning up the preview...");
        setWebData("");
        const runProcess = await webcontainer.spawn('npm', ['run', 'dev']);

        runProcess.output.pipeTo(new WritableStream({
            write(data) {
                setWebData((prev) => (prev ? prev + "\n" + data : data));
            }
        }));

        runProcess.exit.then((code) => {
            if (code !== 0) {
                setError("Error while running the server. Check logs.");
            }
        });

        // Wait for `server-ready` event
        webcontainer.on('server-ready', (port, url) => {
            // ...
            setUrl(url);
            setState("Server is on.")
        });
    }

    useEffect(() => {
        if (isMounted == true)
            main()
    }, [isMounted])

    return (
        <div className="h-full text-gray-400">
            {isMounted ? <div className="h-full flex flex-col">
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
                {url ? <div className="flex-1 bg-background">
                    <iframe
                        src={url + path}
                        width={"100%"}
                        height={"100%"}
                        title="Preview"
                    />
                </div> : <div className="text-center my-auto">
                    <p className="mb-2">{state}</p>
                    {webData && <p className="mb-2">{webData}</p>}
                </div>}
            </div> :
                <div className="text-center">
                    <p className="mb-2">Mounting the Preview...</p>
                </div>
            }
        </div>
    );
}