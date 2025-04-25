import dedent from "dedent";

export default {
  SUGGSTIONS: ['ToDo App', 'Music Store', 'Gym Managment Portal Dashboard', 'Quizz App', 'Ecommerce Store'],
  HERO_HEADING: 'What do you want to build?',
  HERO_DESC: 'Prompt, run, edit, and deploy full-stack web apps.',
  INPUT_PLACEHOLDER: 'What you want to build?',
  SIGNIN_HEADING: 'Continue With Proxy',
  SIGNIN_SUBHEADING: 'To use Proxy you must log into an existing account or create one.',
  SIGNIn_AGREEMENT_TEXT: 'By using Proxy, you agree to the collection of usage data for analytics.',

  DEFAULT_FILE: {
    '/public/index.html': {
      code: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`
    },
    '/App.css': {
      code: `@tailwind base;
@tailwind components;
@tailwind utilities;`
    },
    '/tailwind.config.js': {
      code: `
            /** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`
    },
    '/postcss.config.js': {
      code: `/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
  },
};

export default config;
`
    }
  },
  DEPENDANCY: {
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "autoprefixer": "^10.0.0",
    "uuid4": "^2.0.3",
    "tailwind-merge": "^2.4.0",
    "tailwindcss-animate": "^1.0.7",
    "lucide-react": "^0.469.0",
    "react-router-dom": "^7.1.1",
    "firebase": "^11.1.0",
    "@google/generative-ai": "^0.21.0",
    "date-fns": "^4.1.0",
    "react-chartjs-2": "^5.3.0",
    "chart.js": "^4.4.7",
  },
  PRICING_DESC: 'Start with a free account to speed up your workflow on public projects or boost your entire team with instantly-opening production environments.',
  PRICING_OPTIONS: [
    {
      name: 'Basic',
      tokens: '50K',
      value: 50000,
      desc: 'Ideal for hobbyists and casual users for light, exploratory use.',
      price: 4.99
    },
    {
      name: 'Starter',
      tokens: '120K',
      value: 120000,
      desc: 'Designed for professionals who need to use Proxy a few times per week.',
      price: 9.99
    },
    {
      name: 'Pro',
      tokens: '2.5M',
      value: 2500000,
      desc: 'Designed for professionals who need to use Proxy a few times per week.',
      price: 19.99
    },
    {
      name: 'Unlimted (License)',
      tokens: 'Unmited',
      value: 999999999,
      desc: 'Designed for professionals who need to use Proxy a few times per week.',
      price: 49.99
    }
  ],

  CUSTOM_SETUP: {
    files: {
      "/index.html": {
        code: `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <link rel="icon" type="image/svg+xml" href="/vite.svg" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Vite + React</title>
    </head>
    <body>
      <div id="root"></div>
      <script type="module" src="/src/main.jsx"></script>
    </body>
  </html>`,
      },
      "/src/main.jsx": {
        code: `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
      },
      "/src/App.jsx": {
        code: `import React from "react";
  
function App() {
  return (
    <div className="min-h-screen bg-blue-300 flex items-center justify-center">
      <p className="text-xl text-red-500">Start prompting (or editing) to see magic happen :)</p>
    </div>
  );
}
  
export default App;`,
      },
      "/src/index.css": {
        code: `@tailwind base;
  @tailwind components;
  @tailwind utilities;`,
      },
      "/vite.config.js": {
        code: `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
  
export default defineConfig({
    plugins: [react()],
  });`,
      },
      "/package.json": {
        code: `{
    "name": "vite-react-starter",
    "private": true,
    "version": "0.0.0",
    "type": "module",
    "scripts": {
      "dev": "vite",
      "build": "vite build",
      "preview": "vite preview"
    },
    "dependencies": {
      "react": "^18.3.1",
      "react-dom": "^18.3.1"
    },
    "devDependencies": {
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.1",
      "@vitejs/plugin-react": "^4.3.1",
      "autoprefixer": "^10.4.18",
      "postcss": "^8.4.35",
      "tailwindcss": "^3.4.1",
      "vite": "^5.4.2"
    }
  }`,
      },
      "/tailwind.config.js": {
        code: `export default {
    content: ["./index.html", "./src/**/*.{js,jsx, ts, tsx}"],
    theme: {
      extend: {},
    },
    plugins: [],
  };`,
      },
      "/postcss.config.js": {
        code: `export default {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  };`,
      },
    },
    template: "vite-react",
  }


}