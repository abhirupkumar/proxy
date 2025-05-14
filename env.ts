import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
    /**
     * Specify your server-side environment variables schema here. This way you can ensure the app isn't
     * built with invalid env vars.
     */
    server: {
        //prisma
        DATABASE_URL: z.string().url(),
        CLERK_SECRET_KEY: z.string(),
        GROQ_AI_KEY: z.string(),
        GOOGLE_API_KEY: z.string(),
        OPENAI_API_KEY: z.string(),
        CLERK_JWT_KEY: z.string(),

        GITHUB_CLIENT_ID: z.string(),
        GITHUB_CLIENT_SECRET: z.string(),
        GITHUB_REDIRECT_URI: z.string().url(),

        IMAGEKIT_PUBLIC_KEY: z.string(),
        IMAGEKIT_PRIVATE_KEY: z.string(),
        IMAGEKIT_URL_ENDPOINT: z.string().url(),

        NODE_ENV: z.enum(["development", "production", "test"]),

        VERCEL_CLIENT_ID: z.string(),
        VERCEL_CLIENT_SECRET: z.string(),

        SUPABASE_CLIENT_ID: z.string(),
        SUPABASE_CLIENT_SECRET: z.string(),
    },
    /**
     * Specify your client-side environment variables schema here.
     * For them to be exposed to the client, prefix them with `NEXT_PUBLIC_`.
     */
    client: {
        // NEXT_PUBLIC_CLIENTVAR: z.string(),
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string(),
        NEXT_PUBLIC_HOST: z.string(),
        NEXT_PUBLIC_POSTHOG_KEY: z.string(),
        NEXT_PUBLIC_POSTHOG_HOST: z.string().url(),
    },
    /**
     * Destructure all variables from `process.env` to make sure they aren't tree-shaken away.
     */
    runtimeEnv: {
        DATABASE_URL: process.env.DATABASE_URL,
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
        CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
        NEXT_PUBLIC_HOST: process.env.NEXT_PUBLIC_HOST,
        GROQ_AI_KEY: process.env.GROQ_AI_KEY,
        GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        CLERK_JWT_KEY: process.env.CLERK_JWT_KEY,

        GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
        GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
        GITHUB_REDIRECT_URI: `${process.env.NEXT_PUBLIC_HOST}/api/github/callback`,

        IMAGEKIT_PUBLIC_KEY: process.env.IMAGEKIT_PUBLIC_KEY,
        IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY,
        IMAGEKIT_URL_ENDPOINT: process.env.IMAGEKIT_URL_ENDPOINT,

        NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
        NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,

        NODE_ENV: process.env.NODE_ENV,

        VERCEL_CLIENT_ID: process.env.VERCEL_CLIENT_ID,
        VERCEL_CLIENT_SECRET: process.env.VERCEL_CLIENT_SECRET,

        SUPABASE_CLIENT_ID: process.env.SUPABASE_CLIENT_ID,
        SUPABASE_CLIENT_SECRET: process.env.SUPABASE_CLIENT_SECRET,
    },
    skipValidation: true,
    emptyStringAsUndefined: true,
});