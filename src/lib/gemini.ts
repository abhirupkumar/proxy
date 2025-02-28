import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export const gemini = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });