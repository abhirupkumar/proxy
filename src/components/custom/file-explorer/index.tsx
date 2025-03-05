"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Folder, File } from "lucide-react";
import { useState } from "react";

interface FileExplorerProps {
    onFileSelect: (path: string) => void;
}

interface FileData {
    code: string;
}

interface FileSystem {
    [key: string]: FileData;
}

const fileSystem: FileSystem = {
    "index.html": {
        "code": "<!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <link rel=\"icon\" type=\"image/svg+xml\" href=\"/vite.svg\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>Vite + React + TS</title>\n  </head>\n  <body>\n    <div id=\"root\"></div>\n    <script type=\"module\" src=\"/src/main.tsx\"></script>\n  </body>\n</html>\n"
    },
    "src/App.tsx": {
        "code": "import { useEffect, useState } from 'react';\nimport { Plus, Trash } from 'lucide-react';\n\ninterface Todo {\n  id: number;\n  text: string;\n  completed: boolean;\n}\n\nconst initialTodos: Todo[] = JSON.parse(localStorage.getItem('todos') || '[]');\n\nfunction App() {\n  const [todos, setTodos] = useState<Todo[]>(initialTodos);\n  const [newTodoText, setNewTodoText] = useState('');\n\n  useEffect(() => {\n    localStorage.setItem('todos', JSON.stringify(todos));\n  }, [todos]);\n\n  const addTodo = () => {\n    if (newTodoText.trim() !== '') {\n      setTodos([...todos, { id: Date.now(), text: newTodoText, completed: false }]);\n      setNewTodoText('');\n    }\n  };\n\n  const toggleTodo = (id: number) => {\n    setTodos(todos.map(todo =>\n      todo.id === id ? { ...todo, completed: !todo.completed } : todo\n    ));\n  };\n\n  const deleteTodo = (id: number) => {\n    setTodos(todos.filter(todo => todo.id !== id));\n  };\n\n  return (\n    <div className=\"min-h-screen bg-gray-100 p-4\">\n      <div className=\"flex items-center space-x-2\">\n        <input\n          type=\"text\"\n          value={newTodoText}\n          onChange={e => setNewTodoText(e.target.value)}\n          className=\"flex-1 p-2 border rounded\"\n          placeholder=\"Add new todo...\"\n        />\n        <button onClick={addTodo} className=\"bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded\">\n          <Plus className=\"h-5 w-5 inline-block\" />\n        </button>\n      </div>\n      <ul className=\"mt-4\">\n        {todos.map(todo => (\n          <li key={todo.id} className=\"flex items-center justify-between p-2 border-b\">\n            <div className=\"flex items-center space-x-2\">\n              <input\n                type=\"checkbox\"\n                checked={todo.completed}\n                onChange={() => toggleTodo(todo.id)}\n                className=\"accent-blue-500\"\n              />\n              <span className={`${todo.completed ? 'line-through' : ''} ml-2`}>{todo.text}</span>\n            </div>\n            <button onClick={() => deleteTodo(todo.id)} className=\"text-red-500 hover:text-red-700\">\n              <Trash className=\"h-5 w-5 inline-block\" />\n            </button>\n          </li>\n        ))}\n      </ul>\n    </div>\n  );\n}"
    },
    "src/main.tsx": {
        "code": "import { StrictMode } from 'react';\nimport { createRoot } from 'react-dom/client';\nimport App from './App.tsx';\nimport './index.css';\n\ncreateRoot(document.getElementById('root')!).render(\n  <StrictMode>\n    <App />\n  </StrictMode>\n);\n"
    }
};

export function FileExplorer({ onFileSelect }: FileExplorerProps) {
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["src"]));

    // Convert flat file structure to tree structure
    const createFileTree = () => {
        const tree: Record<string, any> = {};

        Object.keys(fileSystem).forEach((path) => {
            const parts = path.split('/');
            let current = tree;

            parts.forEach((part, index) => {
                if (index === parts.length - 1) {
                    // It's a file
                    current[part] = {
                        type: 'file',
                        content: fileSystem[path].code
                    };
                } else {
                    // It's a directory
                    current[part] = current[part] || {
                        type: 'directory',
                        children: {}
                    };
                    current = current[part].children;
                }
            });
        });

        return tree;
    };

    const toggleFolder = (path: string) => {
        const newExpanded = new Set(expandedFolders);
        if (newExpanded.has(path)) {
            newExpanded.delete(path);
        } else {
            newExpanded.add(path);
        }
        setExpandedFolders(newExpanded);
    };

    const renderFileSystem = (structure: any, path = "") => {
        return Object.entries(structure).map(([name, item]: [string, any]) => {
            const fullPath = path ? `${path}/${name}` : name;

            if (item.type === "directory") {
                const isExpanded = expandedFolders.has(fullPath);
                return (
                    <div key={fullPath}>
                        <button
                            className="flex items-center w-full px-2 py-1 hover:bg-accent rounded-sm text-sm"
                            onClick={() => toggleFolder(fullPath)}
                        >
                            <Folder className="h-4 w-4 mr-2" />
                            {name}
                        </button>
                        {isExpanded && item.children && (
                            <div className="ml-4">
                                {renderFileSystem(item.children, fullPath)}
                            </div>
                        )}
                    </div>
                );
            }

            return (
                <button
                    key={fullPath}
                    className="flex items-center w-full px-2 py-1 hover:bg-accent rounded-sm text-sm"
                    onClick={() => onFileSelect(fullPath)}
                >
                    <File className="h-4 w-4 mr-2" />
                    {name}
                </button>
            );
        });
    };

    const fileTree = createFileTree();

    return (
        <div className="border-r h-full bg-card">
            <div className="p-4 border-b">
                <h2 className="font-semibold">Files</h2>
            </div>
            <ScrollArea className="h-[calc(100vh-8rem)]">
                <div className="p-2">
                    {renderFileSystem(fileTree)}
                </div>
            </ScrollArea>
        </div>
    );
}