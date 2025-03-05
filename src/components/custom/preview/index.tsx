"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { WebContainer } from '@webcontainer/api';

interface PreviewFrameProps {
    files: any;
    webContainer: WebContainer;
}

export function Preview({ files, webContainer }: PreviewFrameProps) {
    const [url, setUrl] = useState("");
    const [path, setPath] = useState("/");
    const [state, setState] = useState<string>("");

    async function main() {
        const installProcess = await webContainer.spawn('npm', ['install']);

        installProcess.output.pipeTo(new WritableStream({
            write(data) {
                setState("Installing Dependencies");
                console.log(data);
            }
        }));

        setState("Spinning the dev server...");
        await webContainer.spawn('npm', ['run', 'dev']);

        // Wait for `server-ready` event
        webContainer.on('server-ready', (port, url) => {
            // ...
            console.log(url)
            console.log(port)
            setUrl(url);
            console.log(url)
            setState("Server is on.")
        });
    }

    useEffect(() => {
        main()
    }, [])
    return (
        <div className="h-full flex items-center justify-center text-gray-400">
            {!url && <div className="text-center">
                <p className="mb-2">{state}</p>
            </div>}
            {url && <div className="h-full flex flex-col">
                <div className="border-b p-4 flex items-center gap-2">
                    <Input
                        value={path}
                        onChange={(e) => setPath(e.target.value)}
                        className="font-mono text-sm"
                    />
                    <Button size="icon" variant="outline">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex-1 bg-background">
                    <iframe
                        src={url + path}
                        width={"100%"}
                        height={"100%"}
                        title="Preview"
                    />
                </div>
            </div>}
        </div>
    );
}