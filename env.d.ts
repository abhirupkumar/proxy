export { }; // Make this file an external module

declare global {
    interface CloudflareEnv {
        DATABASE_URL: string;
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string;
        CLERK_SECRET_KEY: string;
        NEXT_PUBLIC_HOST: string;
        GROQ_AI_KEY: string;
        GOOGLE_API_KEY: string;
        OPENAI_API_KEY: string;
        CLERK_JWT_KEY: string;
        GITHUB_CLIENT_ID: string;
        GITHUB_CLIENT_SECRET: string;
        IMAGEKIT_PUBLIC_KEY: string;
        IMAGEKIT_PRIVATE_KEY: string;
        IMAGEKIT_URL_ENDPOINT: string;
        NEXT_PUBLIC_POSTHOG_KEY: string;
        NEXT_PUBLIC_POSTHOG_HOST: string;
        VERCEL_CLIENT_ID: string;
        VERCEL_CLIENT_SECRET: string;
        SUPABASE_CLIENT_ID: string;
        SUPABASE_CLIENT_SECRET: string;
    }
}