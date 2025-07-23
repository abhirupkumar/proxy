import { NextRequest, NextResponse } from 'next/server';
import testFiles from '@/data/test-files.json';
import { editFile, listDir, readFiles } from '@/data/dummy-functions';

export async function POST(req: NextRequest) {
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ status: 404 });
    }
    let lastResponse: any = null;
    let history: any[] = [
        {
            "role": "user",
            "parts": [
                {
                    "text": "Create an ecommerce site"
                }
            ]
        },
        {
            "role": "model",
            "parts": [
                {
                    "text": "To create an e-commerce site, we need to follow these steps:\n\n1.  **Set up the project:** Create a new project directory and install necessary packages.  We'll use a modern JavaScript framework like React for the front-end and Node.js with Express for the back-end.  A database (like MongoDB or PostgreSQL) will be needed to store product information, user accounts, and orders.\n2.  **Design the database schema:** Define the structure for storing products (name, description, price, images, etc.), users (username, password, address, etc.), and orders (items, total price, shipping address, etc.).\n3.  **Develop the back-end API:** Create RESTful APIs to handle product CRUD operations (Create, Read, Update, Delete), user authentication and authorization, and order management.\n4.  **Develop the front-end:** Build the user interface with React, including components for product browsing, shopping cart, checkout, user accounts, and order history.  We'll need to integrate the front-end with the back-end APIs.\n5.  **Implement payment gateway integration:** Integrate a secure payment gateway (like Stripe or PayPal) to process payments.\n6.  **Testing and deployment:** Thoroughly test the entire application and deploy it to a hosting platform (like Netlify, Heroku, or AWS).\n\n\nShall I proceed with this plan?\n\n"
                }
            ]
        },
        {
            "role": "model",
            "parts": [
                {
                    "functionCall": {
                        "name": "ask_user",
                        "args": {}
                    }
                }
            ]
        },
        {
            "role": "user",
            "parts": [
                {
                    "text": "Yes, proceed with the plan."
                }
            ]
        },
        {
            "role": "model",
            "parts": [
                {
                    "functionCall": {
                        "name": "list_dir",
                        "args": {
                            "target_dir_path": "/"
                        }
                    }
                }
            ]
        },
        {
            "role": "model",
            "parts": [
                {
                    "functionResponse": {
                        "name": "list_dir",
                        "response": {
                            "status": "completed",
                            "files": [
                                ".eslintrc.json",
                                ".gitignore",
                                "components.json",
                                "next.config.js",
                                "package.json",
                                "postcss.config.js",
                                "tailwind.config.ts",
                                "tsconfig.json",
                                "app/globals.css",
                                "app/layout.tsx",
                                "app/page.tsx",
                                "hooks/use-toast.ts",
                                "lib/utils.ts",
                                "components/ui/alert-dialog.tsx",
                                "components/ui/accordion.tsx",
                                "components/ui/alert.tsx",
                                "components/ui/aspect-ratio.tsx",
                                "components/ui/avatar.tsx",
                                "components/ui/badge.tsx",
                                "components/ui/breadcrumb.tsx",
                                "components/ui/button.tsx",
                                "components/ui/calendar.tsx",
                                "components/ui/card.tsx",
                                "components/ui/carousel.tsx",
                                "components/ui/checkbox.tsx",
                                "components/ui/chart.tsx",
                                "components/ui/collapsible.tsx",
                                "components/ui/command.tsx",
                                "components/ui/context-menu.tsx",
                                "components/ui/dialog.tsx",
                                "components/ui/drawer.tsx",
                                "components/ui/dropdown-menu.tsx",
                                "components/ui/hover-card.tsx",
                                "components/ui/input-otp.tsx",
                                "components/ui/form.tsx",
                                "components/ui/input.tsx",
                                "components/ui/label.tsx",
                                "components/ui/menubar.tsx",
                                "components/ui/navigation-menu.tsx",
                                "components/ui/pagination.tsx",
                                "components/ui/popover.tsx",
                                "components/ui/progress.tsx",
                                "components/ui/resizable.tsx",
                                "components/ui/radio-group.tsx",
                                "components/ui/scroll-area.tsx",
                                "components/ui/select.tsx",
                                "components/ui/separator.tsx",
                                "components/ui/sheet.tsx",
                                "components/ui/skeleton.tsx",
                                "components/ui/slider.tsx",
                                "components/ui/sonner.tsx",
                                "components/ui/switch.tsx",
                                "components/ui/table.tsx",
                                "components/ui/tabs.tsx",
                                "components/ui/textarea.tsx",
                                "components/ui/toast.tsx",
                                "components/ui/toaster.tsx",
                                "components/ui/toggle-group.tsx",
                                "components/ui/toggle.tsx",
                                "components/ui/tooltip.tsx"
                            ]
                        }
                    }
                }
            ]
        },
        {
            "role": "model",
            "parts": [
                {
                    "text": "Okay, I see the project uses Next.js and Tailwind CSS.  I will proceed with setting up the database and backend API first, then the frontend.  I will focus on a minimal viable product (MVP) initially, and add more features iteratively.\n\nI'll start by creating the database schema.  Since the project doesn't specify a database, I'll assume MongoDB for its ease of use.  The schema will include collections for `products`, `users`, and `orders`.\n\nNext, I will create the backend API using Node.js and Express.  This API will handle the creation, reading, updating, and deletion of products, user authentication and authorization, and order management.\n\nAfter that, I will develop the frontend using Next.js and Tailwind CSS.  This will involve creating components for product browsing, a shopping cart, checkout, user accounts, and order history.\n\nFinally, I will integrate a payment gateway (Stripe is a popular choice).  I'll start with basic testing, focusing on functionality, and then expand testing as the project grows.  Deployment will follow after sufficient testing.\n\n\nI will now start creating the `products`, `users`, and `orders` schema for MongoDB.  Then, I'll create the backend API endpoints.  I will use the tools provided to perform these tasks.\n"
                }
            ]
        }
    ];

    try {
        const { message } = await req.json();

        const callAgent = async () => {
            const response = await fetch('http://localhost:3000/api/agent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message, history }),
            });

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let fullResponse = '';
            let functionCalled: any = null;
            let functionResponse: any = null;

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value, { stream: true });

                    try {
                        const parsed = JSON.parse(chunk);
                        if (parsed.functionCall) {
                            functionCalled = parsed.functionCall;
                            const { name, args } = parsed.functionCall;
                            if (name == 'ask_user') continue;
                            console.log("Function called:", name, "with args:", args);
                            // @ts-ignore
                            if (name == 'list_dir') {
                                const result = listDir(args as any);
                                functionResponse = { name: name, response: result }
                            }
                            if (name == 'read_files') {
                                const result = readFiles(args as any);
                                functionResponse = { name: name, response: result }
                            }
                            if (name == 'edit_file') {
                                const result = editFile(args as any);
                                functionResponse = { name: name, response: result }
                            }
                            console.log("functionResponse: ", functionResponse);
                        } else if (parsed.text) {
                            fullResponse += parsed.text;
                        }
                    } catch (error) {
                        console.error("Error parsing chunk:", chunk);
                        // lastResponse = { text: chunk };
                    }
                }
            }
            history.push({ role: 'model', parts: [{ text: fullResponse }] });
            if (functionCalled) history.push({ role: 'model', parts: [{ functionCall: functionCalled }] });
            if (functionResponse) history.push({ role: 'model', parts: [{ functionResponse: functionResponse }] });
        };

        await callAgent();

    }
    catch (error) {
        console.log("Error Occured : ", error);
        lastResponse = { error: "Error from agent!" };
    }
    return NextResponse.json({ history });
}

export const runtime = "edge";
