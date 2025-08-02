import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { CoreMessage, streamText } from 'ai';
import { env } from 'env';
import { agentTools } from '@/data/functions-schema';

const google = createGoogleGenerativeAI({
  apiKey: env.GOOGLE_API_KEY,
});

export const geminiModel = google('gemini-1.5-flash');

export async function generateContentStream(
  history: CoreMessage[],
  systemInstruction?: string,
) {
  const result = streamText({
    model: geminiModel,
    system: systemInstruction,
    messages: history,
    tools: agentTools as any,
  });

  return result;
}
