// _worker.js - This is needed to make env vars available
export default {
    async fetch(request, env, ctx) {
        // Make env vars available to your application
        // This exposes Cloudflare bindings to your code
        Object.keys(env).forEach(key => {
            // @ts-ignore - Make bindings available globally
            globalThis[key] = env[key];
        });

        // Run the Next.js app
        const mod = await import('next-on-pages/middleware');
        return mod.default(request, env, ctx);
    }
};