export const NodeBasePrompt = {
  'index.js': {
    "code": '// run `node index.js` in the terminal\n\nconsole.log(`Hello Node.js v${process.versions.node}!`);\n'
  },
  "package.json": {
    "code": '{\n  "name": "node-starter",\n  "private": true,\n  "scripts": {\n    "test": "echo \\"Error: no test specified\\" && exit 1"\n  }\n}\n'
  },
}

export const ReactBasePrompt = {
  "eslint.config.js": {
    "code": "import js from '@eslint/js';\nimport globals from 'globals';\nimport reactHooks from 'eslint-plugin-react-hooks';\nimport reactRefresh from 'eslint-plugin-react-refresh';\nimport tseslint from 'typescript-eslint';\n\nexport default tseslint.config(\n  { ignores: ['dist'] },\n  {\n    extends: [js.configs.recommended, ...tseslint.configs.recommended],\n    files: ['**/*.{ts,tsx}'],\n    languageOptions: {\n      ecmaVersion: 2020,\n      globals: globals.browser,\n    },\n    plugins: {\n      'react-hooks': reactHooks,\n      'react-refresh': reactRefresh,\n    },\n    rules: {\n      ...reactHooks.configs.recommended.rules,\n      'react-refresh/only-export-components': [\n        'warn',\n        { allowConstantExport: true },\n      ],\n    },\n  }\n);\n"
  },
  "index.html": {
    "code": '<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <link rel="icon" type="image/svg+xml" href="/vite.svg" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>Vite + React + TS</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    \x3Cscript type="module" src="/src/main.tsx">\x3C/script>\n  </body>\n</html>\n'
  },
  "package.json": {
    "code": '{\n  "name": "vite-react-typescript-starter",\n  "private": true,\n  "version": "0.0.0",\n  "type": "module",\n  "scripts": {\n    "dev": "vite",\n    "build": "vite build",\n    "lint": "eslint .",\n    "preview": "vite preview"\n  },\n  "dependencies": {\n    "lucide-react": "^0.344.0",\n    "react": "^18.3.1",\n    "react-dom": "^18.3.1",\n    "react-router-dom": "^6.26.2",\n  },\n  "devDependencies": {\n    "@eslint/js": "^9.9.1",\n    "@types/react": "^18.3.5",\n    "@types/react-dom": "^18.3.0",\n    "@vitejs/plugin-react": "^4.3.1",\n    "autoprefixer": "^10.4.18",\n    "eslint": "^9.9.1",\n    "eslint-plugin-react-hooks": "^5.1.0-rc.0",\n    "eslint-plugin-react-refresh": "^0.4.11",\n    "globals": "^15.9.0",\n    "postcss": "^8.4.35",\n    "tailwindcss": "^3.4.1",\n    "typescript": "^5.5.3",\n    "typescript-eslint": "^8.3.0",\n    "vite": "^5.4.2"\n  }\n}\n'
  },
  "postcss.config.js": {
    "code": "export default {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n};"
  },
  "src/App.tsx": {
    "code": "import React from 'react';\n\nfunction App() {\n  return (\n    <div className=\"min-h-screen bg-gray-100 flex items-center justify-center\">\n      <p>Start prompting (or editing) to see magic happen :)</p>\n    </div>\n  );\n}\n\nexport default App;\n"
  },
  "src/index.css": {
    "code": "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n"
  },
  "src/main.tsx": {
    "code": "import { StrictMode } from 'react';\nimport { createRoot } from 'react-dom/client';\nimport App from './App.tsx';\nimport './index.css';\n\ncreateRoot(document.getElementById('root')!).render(\n  <StrictMode>\n    <App />\n  </StrictMode>\n);\n"
  },
  "src/vite-env.d.ts": {
    "code": '/// <reference types="vite/client" />\n'
  },
  "tailwind.config.js": {
    "code": "/** @type {import('tailwindcss').Config} */\nexport default {\n  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],\n  theme: {\n    extend: {},\n  },\n  plugins: [],\n};\n"
  },
  "tsconfig.app.json": {
    "code": '{\n  "compilerOptions": {\n    "target": "ES2020",\n    "useDefineForClassFields": true,\n    "lib": ["ES2020", "DOM", "DOM.Iterable"],\n    "module": "ESNext",\n    "skipLibCheck": true,\n\n    /* Bundler mode */\n    "moduleResolution": "bundler",\n    "allowImportingTsExtensions": true,\n    "isolatedModules": true,\n    "moduleDetection": "force",\n    "noEmit": true,\n    "jsx": "react-jsx",\n\n    /* Linting */\n    "strict": true,\n    "noUnusedLocals": true,\n    "noUnusedParameters": true,\n    "noFallthroughCasesInSwitch": true\n  },\n  "include": ["src"]\n}\n'
  },
  "tsconfig.json": {
    "code": '{\n  "files": [],\n  "references": [\n    { "path": "./tsconfig.app.json" },\n    { "path": "./tsconfig.node.json" }\n  ]\n}\n'
  },
  "tsconfig.node.json": {
    "code": '{\n  "compilerOptions": {\n    "target": "ES2022",\n    "lib": ["ES2023"],\n    "module": "ESNext",\n    "skipLibCheck": true,\n\n    /* Bundler mode */\n    "moduleResolution": "bundler",\n    "allowImportingTsExtensions": true,\n    "isolatedModules": true,\n    "moduleDetection": "force",\n    "noEmit": true,\n\n    /* Linting */\n    "strict": true,\n    "noUnusedLocals": true,\n    "noUnusedParameters": true,\n    "noFallthroughCasesInSwitch": true\n  },\n  "include": ["vite.config.ts"]\n}\n'
  },
  "vite.config.ts": {
    "code": "import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\n// https://vitejs.dev/config/\nexport default defineConfig({\n  plugins: [react()],\n  optimizeDeps: {\n    exclude: ['lucide-react'],\n  },\n});\n"
  },
}

export const NextBasePrompt = {
  ".eslintrc.json": {
    "code": "{\n  \"extends\": \"next/core-web-vitals\"\n}"
  },
  "app/globals.css": {
    "code": "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n:root {\n  --foreground-rgb: 0, 0, 0;\n  --background-start-rgb: 214, 219, 220;\n  --background-end-rgb: 255, 255, 255;\n}\n\n@media (prefers-color-scheme: dark) {\n  :root {\n    --foreground-rgb: 255, 255, 255;\n    --background-start-rgb: 0, 0, 0;\n    --background-end-rgb: 0, 0, 0;\n  }\n}\n\n@layer base {\n  :root {\n    --background: 0 0% 100%;\n    --foreground: 0 0% 3.9%;\n    --card: 0 0% 100%;\n    --card-foreground: 0 0% 3.9%;\n    --popover: 0 0% 100%;\n    --popover-foreground: 0 0% 3.9%;\n    --primary: 0 0% 9%;\n    --primary-foreground: 0 0% 98%;\n    --secondary: 0 0% 96.1%;\n    --secondary-foreground: 0 0% 9%;\n    --muted: 0 0% 96.1%;\n    --muted-foreground: 0 0% 45.1%;\n    --accent: 0 0% 96.1%;\n    --accent-foreground: 0 0% 9%;\n    --destructive: 0 84.2% 60.2%;\n    --destructive-foreground: 0 0% 98%;\n    --border: 0 0% 89.8%;\n    --input: 0 0% 89.8%;\n    --ring: 0 0% 3.9%;\n    --chart-1: 12 76% 61%;\n    --chart-2: 173 58% 39%;\n    --chart-3: 197 37% 24%;\n    --chart-4: 43 74% 66%;\n    --chart-5: 27 87% 67%;\n    --radius: 0.5rem;\n  }\n\n  .dark {\n    --background: 0 0% 3.9%;\n    --foreground: 0 0% 98%;\n    --card: 0 0% 3.9%;\n    --card-foreground: 0 0% 98%;\n    --popover: 0 0% 3.9%;\n    --popover-foreground: 0 0% 98%;\n    --primary: 0 0% 98%;\n    --primary-foreground: 0 0% 9%;\n    --secondary: 0 0% 14.9%;\n    --secondary-foreground: 0 0% 98%;\n    --muted: 0 0% 14.9%;\n    --muted-foreground: 0 0% 63.9%;\n    --accent: 0 0% 14.9%;\n    --accent-foreground: 0 0% 98%;\n    --destructive: 0 62.8% 30.6%;\n    --destructive-foreground: 0 0% 98%;\n    --border: 0 0% 14.9%;\n    --input: 0 0% 14.9%;\n    --ring: 0 0% 83.1%;\n    --chart-1: 220 70% 50%;\n    --chart-2: 160 60% 45%;\n    --chart-3: 30 80% 55%;\n    --chart-4: 280 65% 60%;\n    --chart-5: 340 75% 55%;\n  }\n}\n\n@layer base {\n  * {\n    @apply border-border;\n  }\n  body {\n    @apply bg-background text-foreground;\n  }\n}"
  },
  "app/layout.tsx": {
    "code": "import './globals.css';\nimport type { Metadata } from 'next';\nimport { Inter } from 'next/font/google';\n\nconst inter = Inter({ subsets: ['latin'] });\n\nexport const metadata: Metadata = {\n  title: 'Create Next App',\n  description: 'Generated by create next app',\n};\n\nexport default function RootLayout({\n  children,\n}: {\n  children: React.ReactNode;\n}) {\n  return (\n    <html lang=\"en\">\n      <body className={inter.className}>{children}</body>\n    </html>\n  );\n}"
  },
  "app/page.tsx": {
    "code": "export default function Home() {\n    return (\n        <div className=\"max-w-[1280px] p-[2rem] m-auto text-center\">\n            Start prompting.\n        </div>\n    );\n}"
  },
  "components.json": {
    "code": "{\n        \"$schema\": \"https://ui.shadcn.com/schema.json\",\n        \"style\": \"default\",\n        \"rsc\": true,\n        \"tsx\": true,\n        \"tailwind\": {\n            \"config\": \"tailwind.config.ts\",\n            \"css\": \"app/globals.css\",\n            \"baseColor\": \"neutral\",\n            \"cssVariables\": true,\n            \"prefix\": \"\"\n        },\n        \"aliases\": {\n            \"components\": \"@/components\",\n            \"utils\": \"@/lib/utils\",\n            \"ui\": \"@/components/ui\",\n            \"lib\": \"@/lib\",\n            \"hooks\": \"@/hooks\"\n        }\n}"
  },
  "lib/utils.ts": {
    "code": "import { clsx, type ClassValue } from 'clsx';\nimport { twMerge } from 'tailwind-merge';\n\nexport function cn(...inputs: ClassValue[]) {\n    return twMerge(clsx(inputs));\n}"
  },
  "next.config.js": {
    "code": "/** @type {import('next').NextConfig} */\nconst nextConfig = {\n    output: 'export',\n    eslint: {\n        ignoreDuringBuilds: true,\n    },\n    images: { unoptimized: true },\n};\nmodule.exports = nextConfig;"
  },
  "package.json": {
    "code": "{\n    \"name\": \"nextjs\",\n    \"version\": \"0.1.0\",\n    \"private\": true,\n    \"scripts\": {\n        \"dev\": \"next dev\",\n        \"build\": \"next build\",\n        \"start\": \"next start\",\n        \"lint\": \"next lint\"\n    },\n    \"dependencies\": {\n        \"@hookform/resolvers\": \"^3.9.0\",\n        \"@next/swc-wasm-nodejs\": \"13.5.1\",\n        \"@radix-ui/react-accordion\": \"^1.2.0\",\n        \"@radix-ui/react-alert-dialog\": \"^1.1.1\",\n        \"@radix-ui/react-aspect-ratio\": \"^1.1.0\",\n        \"@radix-ui/react-avatar\": \"^1.1.0\",\n        \"@radix-ui/react-checkbox\": \"^1.1.1\",\n        \"@radix-ui/react-collapsible\": \"^1.1.0\",\n        \"@radix-ui/react-context-menu\": \"^2.2.1\",\n        \"@radix-ui/react-dialog\": \"^1.1.1\",\n        \"@radix-ui/react-dropdown-menu\": \"^2.1.1\",\n        \"@radix-ui/react-hover-card\": \"^1.1.1\",\n        \"@radix-ui/react-label\": \"^2.1.0\",\n        \"@radix-ui/react-menubar\": \"^1.1.1\",\n        \"@radix-ui/react-navigation-menu\": \"^1.2.0\",\n        \"@radix-ui/react-popover\": \"^1.1.1\",\n        \"@radix-ui/react-progress\": \"^1.1.0\",\n        \"@radix-ui/react-radio-group\": \"^1.2.0\",\n        \"@radix-ui/react-scroll-area\": \"^1.1.0\",\n        \"@radix-ui/react-select\": \"^2.1.1\",\n        \"@radix-ui/react-separator\": \"^1.1.0\",\n        \"@radix-ui/react-slider\": \"^1.2.0\",\n        \"@radix-ui/react-slot\": \"^1.1.0\",\n        \"@radix-ui/react-switch\": \"^1.1.0\",\n        \"@radix-ui/react-tabs\": \"^1.1.0\",\n        \"@radix-ui/react-toast\": \"^1.1.0\",\n        \"@radix-ui/react-toggle\": \"^1.1.0\",\n        \"@radix-ui/react-tooltip\": \"^1.1.1\",\n        \"@shadcn/ui\": \"^1.0.0\",\n        \"clsx\": \"^1.2.1\",\n        \"next\": \"14.0.0\",\n        \"react\": \"^18.2.0\",\n        \"react-dom\": \"^18.2.0\",\n        \"tailwind-merge\": \"^2.2.1\",\n        \"tailwindcss\": \"^3.3.3\"\n    },\n    \"devDependencies\": {\n        \"@types/node\": \"^20.6.3\",\n        \"@types/react\": \"^18.2.24\",\n        \"autoprefixer\": \"^10.4.16\",\n        \"eslint\": \"^8.52.0\",\n        \"eslint-config-next\": \"14.0.0\",\n        \"postcss\": \"^8.4.31\",\n        \"typescript\": \"^5.2.2\"\n    }\n}"
  },
  "tailwind.config.ts": {
    "code": "import type { Config } from 'tailwindcss';\n\nconst config: Config = {\n    darkMode: 'class',\n    content: [\n        './app/**/*.{js,ts,jsx,tsx}',\n        './components/**/*.{js,ts,jsx,tsx}',\n        './lib/**/*.{js,ts,jsx,tsx}'\n    ],\n    theme: {\n        extend: {}\n    },\n    plugins: []\n};\n\nexport default config;"
  },
  "tsconfig.json": {
    "code": "{\n    \"compilerOptions\": {\n        \"target\": \"esnext\",\n        \"lib\": [\"dom\", \"dom.iterable\", \"esnext\"],\n        \"allowJs\": true,\n        \"skipLibCheck\": true,\n        \"strict\": true,\n        \"forceConsistentCasingInFileNames\": true,\n        \"noEmit\": true,\n        \"esModuleInterop\": true,\n        \"module\": \"esnext\",\n        \"moduleResolution\": \"node\",\n        \"resolveJsonModule\": true,\n        \"isolatedModules\": true,\n        \"jsx\": \"preserve\",\n        \"incremental\": true\n    },\n    \"include\": [\"next-env.d.ts\", \"**/*.ts\", \"**/*.tsx\"],\n    \"exclude\": [\"node_modules\"]\n}"
  },
  "postcss.config.js": {
    "code": "export default {\n    plugins: {\n        tailwindcss: {},\n        autoprefixer: {}\n    }\n};"
  }
}