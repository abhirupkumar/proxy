export class RegexProcessor {
    public currentRegex: string;
    private onFileContent: (filePath: string, fileContent: string) => void;
    private onShellCommand: (shellCommand: string) => void;
    public response: string;
    public filePath: string;
    public fileContent: string;
    public shellCommand: string;

    constructor(currentRegex: string, onFileContent: (filePath: string, fileContent: string) => void, onShellCommand: (shellCommand: string) => void, response: string, filePath: string, fileContent: string, shellCommand: string) {
        this.currentRegex = currentRegex;
        this.onFileContent = onFileContent;
        this.onShellCommand = onShellCommand;
        this.response = response;
        this.filePath = filePath;
        this.fileContent = fileContent;
        this.shellCommand = shellCommand;
    }

    append(regex: string) {
        this.currentRegex += regex;
    }

    parse() {
        const latestActionStart = this.currentRegex.split("\n").findIndex((line) => line.includes("<proxyAction type="));
        const latestActionEnd = this.currentRegex.split("\n").findIndex((line) => line.includes("</proxyAction>")) ?? (this.currentRegex.split("\n").length - 1);

        if (latestActionStart === -1) {
            return;
        }

        const latestActionType = this.currentRegex.split("\n")[latestActionStart].split("type=")[1].split(" ")[0].split(">")[0];
        // const latestActionContent = this.currentRegex.split("\n").slice(latestActionStart, latestActionEnd + 1).join("\n");
        let latestActionContent = this.currentRegex.split("\n").slice(latestActionStart).join("\n");
        if (latestActionEnd != -1) {
            latestActionContent = latestActionContent.split("\n").slice(0, latestActionEnd + 1).join("\n");
        }
        // console.log("this.currentRegex: " + this.currentRegex);
        // console.log("latestActionContent: " + latestActionContent);

        try {
            if (latestActionType === "\"shell\"") {
                let shellCommand = latestActionContent.split('\n').slice(1).join('\n');
                if (shellCommand.includes("</proxyAction>")) {
                    shellCommand = shellCommand.split("</proxyAction>")[0];
                    this.currentRegex = this.currentRegex.split(latestActionContent)[1];
                    this.onShellCommand(shellCommand);
                }
            } else if (latestActionType === "\"response\"") {
                let response2 = latestActionContent.split('\n').slice(1).join('\n');
                if (response2.includes("</proxyAction>")) {
                    response2 = response2.split("</proxyAction>")[0];
                    this.currentRegex = this.currentRegex.split(latestActionContent)[1];
                }
                this.response = response2;
            } else if (latestActionType === "\"file\"") {
                const filePath = this.currentRegex.split("\n")[latestActionStart].split("filePath=")[1].split(">")[0];
                let fileContent2 = latestActionContent.split("\n").slice(1).join("\n");
                if (fileContent2.includes("</proxyAction>")) {
                    fileContent2 = fileContent2.split("</proxyAction>")[0];
                    this.currentRegex = this.currentRegex.split(latestActionContent)[1];
                    this.onFileContent(filePath.split("\"")[1].replace(/^```[\w-]*\n/, '').replace(/\n```$/, ''), fileContent2);
                }
                this.filePath = filePath.split("\"")[1];
                this.fileContent = fileContent2.replace(/^```[\w-]*\n/, '').replace(/\n```$/, '');
            }
        } catch (e) { }
    }
}