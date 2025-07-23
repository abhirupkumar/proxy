import { env } from "env";
import OpenAI from "openai";

// export const openai = new OpenAI({
//     baseURL: "https://api.sambanova.ai/v1",
//     apiKey: "7d102eff-2758-4a87-9e82-612d6fedc093",
// })

// export const openai = new OpenAI({
//     baseURL: "https://api.a4f.co/v1",
//     apiKey: "ddc-a4f-bcd8c66bdf03465f9f2f0db77a233f5c",
// })

// export const openai = new OpenAI({
//     baseURL: "https://openrouter.ai/api/v1",
//     apiKey: "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",
// })

export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})