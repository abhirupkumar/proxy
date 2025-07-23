import { inngest } from "./client";

export const helloWorld = inngest.createFunction(
    { id: "hello-world" },
    { event: "test/hello.world" },
    async ({ event, step }) => {
        await step.sleep("wait-a-moment", "10s");
        return { message: `Hello ${event.data.email}!` };
    },
);

export const coder = inngest.createFunction(
    { id: "coding-agent" },
    { event: "test/coding.agent" },
    async ({ event, step }) => {

        return { message: `Hello ${event.data.email}!` };
    },
);
