export const NodeBasePrompt = '<proxyArtifact id=\"project-import\" title=\"Project Files\"><proxyAction type=\"file\" filePath=\"index.js\">// run `node index.js` in the terminal\n\nconsole.log(`Hello Node.js v${process.versions.node}!`);\n</proxyAction><proxyAction type=\"file\" filePath=\"package.json\">{\n  \"name\": \"node-starter\",\n  \"private\": true,\n  \"scripts\": {\n    \"test\": \"echo \\\"Error: no test specified\\\" && exit 1\"\n  }\n}\n</proxyAction></proxyArtifact>';

export const ReactBasePrompt = `
<proxyArtifact id="project-import" title="Project Files">

  <proxyAction type="file" filePath="eslint.config.js">
    import js from '@eslint/js';
    import globals from 'globals';
    import reactHooks from 'eslint-plugin-react-hooks';
    import reactRefresh from 'eslint-plugin-react-refresh';
    import tseslint from 'typescript-eslint';

    export default tseslint.config(
      { ignores: ['dist'] },
      {
        extends: [js.configs.recommended, ...tseslint.configs.recommended],
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
          ecmaVersion: 2020,
          globals: globals.browser,
        },
        plugins: {
          'react-hooks': reactHooks,
          'react-refresh': reactRefresh,
        },
        rules: {
          ...reactHooks.configs.recommended.rules,
          'react-refresh/only-export-components': [
            'warn',
            { allowConstantExport: true },
          ],
        },
      }
    );
  </proxyAction>

  <proxyAction type="file" filePath="index.html">
    <!doctype html>
    <html lang="en">

      <head>
        <meta charset="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/vite.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Vite + React + TS</title>
      </head>

      <body>
        <div id="root"></div>
        <script type="module" src="/src/main.tsx"></script>
      </body>

    </html>
  </proxyAction>

  <proxyAction type="file" filePath="package.json">
    {
      "name": "vite-react-typescript-starter",
      "private": true,
      "version": "0.0.0",
      "type": "module",
      "scripts": {
        "dev": "vite",
        "build": "vite build",
        "lint": "eslint .",
        "preview": "vite preview"
      },
      "dependencies": {
        "lucide-react": "^0.344.0",
        "react": "^18.3.1",
        "react-dom": "^18.3.1"
      },
      "devDependencies": {
        "@eslint/js": "^9.9.1",
        "@types/react": "^18.3.5",
        "@types/react-dom": "^18.3.0",
        "@vitejs/plugin-react": "^4.3.1",
        "autoprefixer": "^10.4.18",
        "eslint": "^9.9.1",
        "eslint-plugin-react-hooks": "^5.1.0-rc.0",
        "eslint-plugin-react-refresh": "^0.4.11",
        "globals": "^15.9.0",
        "postcss": "^8.4.35",
        "tailwindcss": "^3.4.1",
        "typescript": "^5.5.3",
        "typescript-eslint": "^8.3.0",
        "vite": "^5.4.2"
      }
    }
  </proxyAction>

  <proxyAction type="file" filePath="postcss.config.js">
    export default {
      plugins: {
        tailwindcss: {},
        autoprefixer: {},
      },
    };
  </proxyAction>

  <proxyAction type="file" filePath="tailwind.config.js">
    /** @type {import('tailwindcss').Config} */
    export default {
      content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
      theme: {
        extend: {},
      },
      plugins: [],
    };
  </proxyAction>

  <proxyAction type="file" filePath="tsconfig.app.json">
    {
      "compilerOptions": {
        "target": "ES2020",
        "useDefineForClassFields": true,
        "lib": ["ES2020", "DOM", "DOM.Iterable"],
        "module": "ESNext",
        "skipLibCheck": true,

        /* Bundler mode */
        "moduleResolution": "bundler",
        "allowImportingTsExtensions": true,
        "isolatedModules": true,
        "moduleDetection": "force",
        "noEmit": true,
        "jsx": "react-jsx",

        /* Linting */
        "strict": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "noFallthroughCasesInSwitch": true
      },
      "include": ["src"]
    }
  </proxyAction>

  <proxyAction type="file" filePath="tsconfig.json">
    {
      "files": [],
      "references": [
        { "path": "./tsconfig.app.json" },
        { "path": "./tsconfig.node.json" }
      ]
    }
  </proxyAction>

  <proxyAction type="file" filePath="tsconfig.node.json">
    {
      "compilerOptions": {
        "target": "ES2022",
        "lib": ["ES2023"],
        "module": "ESNext",
        "skipLibCheck": true,

        /* Bundler mode */
        "moduleResolution": "bundler",
        "allowImportingTsExtensions": true,
        "isolatedModules": true,
        "moduleDetection": "force",
        "noEmit": true,

        /* Linting */
        "strict": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "noFallthroughCasesInSwitch": true
      },
      "include": ["vite.config.ts"]
    }
  </proxyAction>

  <proxyAction type="file" filePath="vite.config.ts">
    import { defineConfig } from 'vite';
    import react from '@vitejs/plugin-react';

    // https://vitejs.dev/config/
    export default defineConfig({
      plugins: [react()],
      optimizeDeps: {
        exclude: ['lucide-react'],
      },
    });
  </proxyAction>

  <proxyAction type="file" filePath="src/App.tsx">
    import React from 'react';

    function App() {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <p>Start prompting (or editing) to see magic happen :)</p>
        </div>
      );
    }

    export default App;
  </proxyAction>

  <proxyAction type="file" filePath="src/index.css">
    @tailwind base;
    @tailwind components;
    @tailwind utilities;
  </proxyAction>

  <proxyAction type="file" filePath="src/main.tsx">
    import { StrictMode } from 'react';
    import { createRoot } from 'react-dom/client';
    import App from './App.tsx';
    import './index.css';

    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  </proxyAction>

  <proxyAction type="file" filePath="src/vite-env.d.ts">
    /// <reference types="vite/client" />
  </proxyAction>

</proxyArtifact>

`

export const NextBasePrompt = `
<proxyArtifact id="project-import" title="Project Files">

  <proxyAction type="file" filePath=".eslintrc.json">
    {
        "extends": "next/core-web-vitals"
    }
  </proxyAction>

  <proxyAction type="file" filePath="app/globals.css">
    @tailwind base;
    @tailwind components;
    @tailwind utilities;

    :root {
    --foreground-rgb: 0, 0, 0;
    --background-start-rgb: 214, 219, 220;
    --background-end-rgb: 255, 255, 255;
    }

    @media (prefers-color-scheme: dark) {
    :root {
        --foreground-rgb: 255, 255, 255;
        --background-start-rgb: 0, 0, 0;
        --background-end-rgb: 0, 0, 0;
    }
    }

    @layer base {
    :root {
        --background: 0 0% 100%;
        --foreground: 0 0% 3.9%;
        --card: 0 0% 100%;
        --card-foreground: 0 0% 3.9%;
        --popover: 0 0% 100%;
        --popover-foreground: 0 0% 3.9%;
        --primary: 0 0% 9%;
        --primary-foreground: 0 0% 98%;
        --secondary: 0 0% 96.1%;
        --secondary-foreground: 0 0% 9%;
        --muted: 0 0% 96.1%;
        --muted-foreground: 0 0% 45.1%;
        --accent: 0 0% 96.1%;
        --accent-foreground: 0 0% 9%;
        --destructive: 0 84.2% 60.2%;
        --destructive-foreground: 0 0% 98%;
        --border: 0 0% 89.8%;
        --input: 0 0% 89.8%;
        --ring: 0 0% 3.9%;
        --chart-1: 12 76% 61%;
        --chart-2: 173 58% 39%;
        --chart-3: 197 37% 24%;
        --chart-4: 43 74% 66%;
        --chart-5: 27 87% 67%;
        --radius: 0.5rem;
    }

    .dark {
        --background: 0 0% 3.9%;
        --foreground: 0 0% 98%;
        --card: 0 0% 3.9%;
        --card-foreground: 0 0% 98%;
        --popover: 0 0% 3.9%;
        --popover-foreground: 0 0% 98%;
        --primary: 0 0% 98%;
        --primary-foreground: 0 0% 9%;
        --secondary: 0 0% 14.9%;
        --secondary-foreground: 0 0% 98%;
        --muted: 0 0% 14.9%;
        --muted-foreground: 0 0% 63.9%;
        --accent: 0 0% 14.9%;
        --accent-foreground: 0 0% 98%;
        --destructive: 0 62.8% 30.6%;
        --destructive-foreground: 0 0% 98%;
        --border: 0 0% 14.9%;
        --input: 0 0% 14.9%;
        --ring: 0 0% 83.1%;
        --chart-1: 220 70% 50%;
        --chart-2: 160 60% 45%;
        --chart-3: 30 80% 55%;
        --chart-4: 280 65% 60%;
        --chart-5: 340 75% 55%;
    }
    }

    @layer base {
    * {
        @apply border-border;
    }
    body {
        @apply bg-background text-foreground;
    }
    }
  </proxyAction>

  <proxyAction type="file" filePath="app/layout.tsx">
    import './globals.css';
    import type { Metadata } from 'next';
    import { Inter } from 'next/font/google';

    const inter = Inter({ subsets: ['latin'] });

    export const metadata: Metadata = {
    title: 'Create Next App',
    description: 'Generated by create next app',
    };

    export default function RootLayout({
    children,
    }: {
    children: React.ReactNode;
    }) {
    return (
        <html lang="en">
        <body className={inter.className}>{children}</body>
        </html>
    );
    }
  </proxyAction>

  <proxyAction type="file" filePath="app/page.tsx">
    export default function Home() {
        return (
            <div
            style={{
                maxWidth: 1280,
                margin: '0 auto',
                padding: '2rem',
                textAlign: 'center',
            }}
            >
            Start prompting.
            </div>
        );
    }
  </proxyAction>

  <proxyAction type="file" filePath="components.json">
    {
        "$schema": "https://ui.shadcn.com/schema.json",
        "style": "default",
        "rsc": true,
        "tsx": true,
        "tailwind": {
            "config": "tailwind.config.ts",
            "css": "app/globals.css",
            "baseColor": "neutral",
            "cssVariables": true,
            "prefix": ""
        },
        "aliases": {
            "components": "@/components",
            "utils": "@/lib/utils",
            "ui": "@/components/ui",
            "lib": "@/lib",
            "hooks": "@/hooks"
        }
    }
  </proxyAction>

  <proxyAction type="file" filePath="lib/utils.ts">
    import { clsx, type ClassValue } from 'clsx';
    import { twMerge } from 'tailwind-merge';

    export function cn(...inputs: ClassValue[]) {
        return twMerge(clsx(inputs));
    }
  </proxyAction>

  <proxyAction type="file" filePath="next.config.js">
    /** @type {import('next').NextConfig} */
    const nextConfig = {
        output: 'export',
        eslint: {
            ignoreDuringBuilds: true,
        },
        images: { unoptimized: true },
    };
    module.exports = nextConfig;
  </proxyAction>

  <proxyAction type="file" filePath="package.json">
    {
        "name": "nextjs",
        "version": "0.1.0",
        "private": true,
        "scripts": {
            "dev": "next dev",
            "build": "next build",
            "start": "next start",
            "lint": "next lint"
        },
        "dependencies": {
            "@hookform/resolvers": "^3.9.0",
            "@next/swc-wasm-nodejs": "13.5.1",
            "@radix-ui/react-accordion": "^1.2.0",
            "@radix-ui/react-alert-dialog": "^1.1.1",
            "@radix-ui/react-aspect-ratio": "^1.1.0",
            "@radix-ui/react-avatar": "^1.1.0",
            "@radix-ui/react-checkbox": "^1.1.1",
            "@radix-ui/react-collapsible": "^1.1.0",
            "@radix-ui/react-context-menu": "^2.2.1",
            "@radix-ui/react-dialog": "^1.1.1",
            "@radix-ui/react-dropdown-menu": "^2.1.1",
            "@radix-ui/react-hover-card": "^1.1.1",
            "@radix-ui/react-label": "^2.1.0",
            "@radix-ui/react-menubar": "^1.1.1",
            "@radix-ui/react-navigation-menu": "^1.2.0",
            "@radix-ui/react-popover": "^1.1.1",
            "@radix-ui/react-progress": "^1.1.0",
            "@radix-ui/react-radio-group": "^1.2.0",
            "@radix-ui/react-scroll-area": "^1.1.0",
            "@radix-ui/react-select": "^2.1.1",
            "@radix-ui/react-separator": "^1.1.0",
            "@radix-ui/react-slider": "^1.2.0",
            "@radix-ui/react-slot": "^1.1.0",
            "@radix-ui/react-switch": "^1.1.0",
            "@radix-ui/react-tabs": "^1.1.0",
            "@radix-ui/react-toast": "^1.1.0",
            "@radix-ui/react-toggle": "^1.1.0",
            "@radix-ui/react-tooltip": "^1.1.1",
            "@shadcn/ui": "^1.0.0",
            "clsx": "^1.2.1",
            "next": "14.0.0",
            "react": "^18.2.0",
            "react-dom": "^18.2.0",
            "tailwind-merge": "^2.2.1",
            "tailwindcss": "^3.3.3"
        },
        "devDependencies": {
            "@types/node": "^20.6.3",
            "@types/react": "^18.2.24",
            "autoprefixer": "^10.4.16",
            "eslint": "^8.52.0",
            "eslint-config-next": "14.0.0",
            "postcss": "^8.4.31",
            "typescript": "^5.2.2"
        }
    }
  </proxyAction>

  <proxyAction type="file" filePath="tailwind.config.ts">
    import type { Config } from 'tailwindcss';

    const config: Config = {
    darkMode: 'class',
    content: [
        './app/**/*.{js,ts,jsx,tsx}',
        './components/**/*.{js,ts,jsx,tsx}',
        './lib/**/*.{js,ts,jsx,tsx}'
    ],
    theme: {
        extend: {}
    },
    plugins: []
    };

    export default config;
  </proxyAction>

  <proxyAction type="file" filePath="tsconfig.json">
    {
        "compilerOptions": {
            "target": "esnext",
            "lib": ["dom", "dom.iterable", "esnext"],
            "allowJs": true,
            "skipLibCheck": true,
            "strict": true,
            "forceConsistentCasingInFileNames": true,
            "noEmit": true,
            "esModuleInterop": true,
            "module": "esnext",
            "moduleResolution": "node",
            "resolveJsonModule": true,
            "isolatedModules": true,
            "jsx": "preserve",
            "incremental": true
        },
        "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
        "exclude": ["node_modules"]
    }
  </proxyAction>

  <proxyAction type="file" filePath="postcss.config.js">
    export default {
        plugins: {
            tailwindcss: {},
            autoprefixer: {},
        },
    };
  </proxyAction>

  <proxyAction type="file" filePath="src/vite-env.d.ts">
    /// <reference types="vite/client" />
  </proxyAction>

</proxyArtifact>
`