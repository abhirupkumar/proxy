import OpenAI from "openai";

export const openai = new OpenAI({
    baseURL: "https://api.sree.shop/v1",
    apiKey: process.env.OPENAI_API_KEY!,
})