import { FunctionDeclaration, SchemaType } from "@google/generative-ai";

export const agentTools: FunctionDeclaration[] = [
  {
    description: "Use this tool to add a dependency to the project. The dependency should be a valid npm package name. Usage:\n\n package-name@version\n",
    name: "prx-add-dependency",
    parameters: {
      properties: {
        package: {
          type: SchemaType.STRING
        }
      },
      required: [
        "package"
      ],
      type: SchemaType.STRING
    }
  },
  {
    description: "Regex-based code search with file filtering and context.\n\nSearch using regex patterns across files in your project.\n\nParameters:\n- query: Regex pattern to find (e.g., \"useState\")\n- include_pattern: Files to include using glob syntax (e.g., \"src/\")\n- exclude_pattern: Files to exclude using glob syntax (e.g., \"/*.test.tsx\")\n- case_sensitive: Whether to match case (default: false)\n\nTip: Use \\\\ to escape special characters in regex patterns.",
    name: "prx-search-files",
    parameters: {
      properties: {
        case_sensitive: {
          type: SchemaType.BOOLEAN
        },
        exclude_pattern: {
          type: SchemaType.STRING
        },
        include_pattern: {
          type: SchemaType.STRING
        },
        query: {
          type: SchemaType.STRING
        }
      },
      required: [
        "query",
        "include_pattern"
      ],
      type: SchemaType.STRING
    }
  },
  {

    name: "prx-write",
    parameters: {
      properties: {
        content: {
          type: SchemaType.STRING
        },
        file_path: {
          type: SchemaType.STRING
        }
      },
      required: [
        "file_path",
        "content"
      ],
      type: SchemaType.STRING
    }
  },
  {
    description: "Line-Based Search and Replace Tool\n\nUse this tool to find and replace specific content in a file you have access to, using explicit line numbers. This is the PREFERRED and PRIMARY tool for editing existing files. Always use this tool when modifying existing code rather than rewriting entire files.\n\nProvide the following details to make an edit:\n\t1.\tfile_path - The path of the file to modify\n\t2.\tsearch - The content to search for (use ellipsis ... for large sections instead of writing them out in full)\n\t3.\tfirst_replaced_line - The line number of the first line in the search (1-indexed)\n\t4.\tlast_replaced_line - The line number of the last line in the search (1-indexed)\n\t5.\treplace - The new content to replace the found content\n\nThe tool will validate that search matches the content at the specified line range and then replace it with replace.\n\nIMPORTANT: When invoking this tool multiple times in parallel (multiple edits to the same file), always use the original line numbers from the file as you initially viewed it. Do not adjust line numbers based on previous edits.\n\nELLIPSIS USAGE:\nWhen replacing sections of code longer than ~6 lines, you should use ellipsis (...) in your search to reduce the number of lines you need to specify (writing fewer lines is faster).\n- Include the first few lines (typically 2-3 lines) of the section you want to replace\n- Add \"...\" on its own line to indicate omitted content\n- Include the last few lines (typically 2-3 lines) of the section you want to replace\n- The key is to provide enough unique context at the beginning and end to ensure accurate matching\n- Focus on uniqueness rather than exact line counts - sometimes 2 lines is enough, sometimes you need 4\n\n\n\nExample:\nTo replace a user card component at lines 22-42:\n\nOriginal content in file (lines 20-45):\n20: return (\n21: <div className=\"user-list\">\n22: <div className=\"user-card\">\n23: <img src={user.avatar} alt=\"User avatar\" />\n24: <h3>{user.name}</h3>\n25: <p>{user.email}</p>\n26: <p>{user.role}</p>\n27: <p>{user.department}</p>\n28: <p>{user.location}</p>\n29: <div className=\"user-actions\">\n30: <button onClick={() => onEdit(user.id)}>Edit</button>\n31: <button onClick={() => onDelete(user.id)}>Delete</button>\n32: <button onClick={() => onView(user.id)}>View</button>\n33: </div>\n34: <div className=\"user-metadata\">\n35: <span>Created: {user.createdAt}</span>\n36: <span>Updated: {user.updatedAt}</span>\n37: <span>Status: {user.status}</span>\n38: </div>\n39: <div className=\"user-permissions\">\n40: <span>Permissions: {user.permissions.join(', ')}</span>\n41: </div>\n42: </div>\n43: </div>\n44: );\n45: }\n\nFor a large replacement like this, you must use ellipsis:\n- search: \" <div className=\\\"user-card\\\">\\n <img src={user.avatar} alt=\\\"User avatar\\\" />\\n...\\n <span>Permissions: {user.permissions.join(', ')}</span>\\n </div>\\n </div>\"\n- first_replaced_line: 22\n- last_replaced_line: 42\n- replace: \" <div className=\\\"user-card enhanced\\\">\\n <div className=\\\"user-avatar\\\">\\n <img \\n src={user.avatar} \\n alt=\\\"User profile picture\\\" \\n className=\\\"avatar-image\\\"\\n onError={(e) => {\\n e.currentTarget.src = '/default-avatar.png';\\n }}\\n />\\n </div>\\n <div className=\\\"user-info\\\">\\n <h3 className=\\\"user-name\\\">{user.name}</h3>\\n <p className=\\\"user-email\\\">{user.email}</p>\\n <div className=\\\"user-details\\\">\\n <span className=\\\"user-role\\\">{user.role}</span>\\n <span className=\\\"user-department\\\">{user.department}</span>\\n </div>\\n </div>\\n <div className=\\\"user-actions\\\">\\n <button \\n className=\\\"edit-button\\\" \\n onClick={() => onEdit(user.id)}\\n aria-label=\\\"Edit user profile\\\"\\n >\\n Edit Profile\\n </button>\\n </div>\\n </div>\"\n\nCritical guidelines:\n\t1. Line Numbers - Specify exact first_replaced_line and last_replaced_line (1-indexed, first line is line 1)\n\t2. Ellipsis Usage - For large sections (>6 lines), use ellipsis (...) to include only the first few and last few key identifying lines for cleaner, more focused matching\n\t3. Content Validation - The prefix and suffix parts of search (before and after ellipsis) must contain exact content matches from the file (without line numbers). The tool validates these parts against the actual file content\n\t4. File Validation - The file must exist and be readable\n\t5. Parallel Tool Calls - When multiple edits are needed, invoke necessary tools simultaneously in parallel. Do NOT wait for one edit to complete before starting the next\n\t6. Original Line Numbers - When making multiple edits to the same file, always use original line numbers from your initial view of the file",
    name: "prx-line-replace",
    parameters: {
      properties: {
        file_path: {
          type: SchemaType.STRING
        },
        first_replaced_line: {
          description: "First line number to replace (1-indexed)",
          type: SchemaType.NUMBER
        },
        last_replaced_line: {
          description: "Last line number to replace (1-indexed)",
          type: SchemaType.NUMBER
        },
        replace: {
          description: "New content to replace the search content with (without line numbers)",
          type: SchemaType.STRING
        },
        search: {
          description: "Content to search for in the file (without line numbers). This should match the existing code that will be replaced.",
          type: SchemaType.STRING
        }
      },
      required: [
        "file_path",
        "search",
        "first_replaced_line",
        "last_replaced_line",
        "replace"
      ],
      type: SchemaType.STRING
    }
  },
  {
    description: "Download a file from a URL and save it to the repository.\n\nThis tool is useful for:\n- Downloading images, assets, or other files from URLs. Download images in the src/assets folder and import them as ES6 modules.\n- Saving external resources directly to the project\n- Migrating files from external sources to the repository\n\nThe file will be downloaded and saved at the specified path in the repository, ready to be used in the project.",
    name: "prx-download-to-repo",
    parameters: {
      properties: {
        source_url: {
          description: "The URL of the file to download",
          type: SchemaType.STRING
        },
        target_path: {
          description: "The path where the file should be saved in the repository (use the public folder unless specified otherwise)",
          type: SchemaType.STRING
        }
      },
      required: [
        "source_url",
        "target_path"
      ],
      type: SchemaType.STRING
    }
  },
  {
    description: "Fetches a website and temporarily saves its content (markdown, HTML, screenshot) to files in `tmp://fetched-websites/`. Returns the paths to the created files and a preview of the content.",
    name: "prx-fetch-website",
    parameters: {
      properties: {
        formats: {
          description: "Comma-separated list of formats to return. Supported formats: 'markdown', 'html', 'screenshot'. Defaults to 'markdown'.",
          type: SchemaType.STRING
        },
        url: {
          type: SchemaType.STRING
        }
      },
      required: [
        "url"
      ],
      type: SchemaType.STRING
    }
  },
  {
    description: "Use this tool to read the contents of a file. The file path should be relative to the project root. You can optionally specify line ranges to read using the lines parameter (e.g., \"1-800, 1001-1500\"). By default, the first 500 lines are read if lines is not specified.\n\nIMPORTANT GUIDELINES:\n- Do NOT use this tool if the file contents have already been provided in <useful-context>\n- Do NOT specify line ranges unless the file is very large (>500 lines) - rely on the default behavior which shows the first 500 lines\n- Only use line ranges when you need to see specific sections of large files that weren't shown in the default view\n- If you need to read multiple files, invoke this tool multiple times in parallel (not sequentially) for efficiency",
    name: "prx-view",
    parameters: {
      properties: {
        file_path: {
          type: SchemaType.STRING
        },
        "lines": {
          type: SchemaType.STRING
        }
      },
      required: [
        "file_path"
      ],
      type: SchemaType.STRING
    }
  },
  {
    description: "Use this tool to read the contents of the latest console logs at the moment the user sent the request.\nYou can optionally provide a search query to filter the logs. If empty you will get all latest logs.\nYou may not be able to see the logs that didn't happen recently.\nThe logs will not update while you are building and writing code. So do not expect to be able to verify if you fixed an issue by reading logs again. They will be the same as when you started writing code.\nDO NOT USE THIS MORE THAN ONCE since you will get the same logs each time.",
    name: "prx-read-console-logs",
    parameters: {
      properties: {
        search: {
          type: SchemaType.STRING
        }
      },
      required: [
        "search"
      ],
      type: SchemaType.STRING
    }
  },
  {
    description: "Use this tool to read the contents of the latest network requests. You can optionally provide a search query to filter the requests. If empty you will get all latest requests. You may not be able to see the requests that didn't happen recently.",
    name: "prx-read-network-requests",
    parameters: {
      properties: {
        search: {
          type: SchemaType.STRING
        }
      },
      required: [
        "search"
      ],
      type: SchemaType.STRING
    }
  },
  {
    description: "Use this tool to uninstall a package from the project.",
    name: "prx-remove-dependency",
    parameters: {
      properties: {
        package: {
          type: SchemaType.STRING
        }
      },
      required: [
        "package"
      ],
      type: SchemaType.STRING
    }
  },
  {
    description: "You MUST use this tool to rename a file instead of creating new files and deleting old ones. The original and new file path should be relative to the project root.",
    name: "prx-rename",
    parameters: {
      properties: {
        new_file_path: {
          type: SchemaType.STRING
        },
        original_file_path: {
          type: SchemaType.STRING
        }
      },
      required: [
        "original_file_path",
        "new_file_path"
      ],
      type: SchemaType.STRING
    }
  },
  {
    description: "Use this tool to delete a file. The file path should be relative to the project root.",
    name: "prx-delete",
    parameters: {
      properties: {
        file_path: {
          type: SchemaType.STRING
        }
      },
      required: [
        "file_path"
      ],
      type: SchemaType.STRING
    }
  },
  {

    name: "generate_image",
    parameters: {
      properties: {
        height: {
          description: "Image height (minimum 512, maximum 1920)",
          type: SchemaType.NUMBER
        },
        model: {
          description: "The model to use for generation. Options: flux.schnell (default), flux.dev. flux.dev generates higher quality images but is slower. Always use flux.schnell unless you're generating a large image like a hero image or fullscreen banner, of if the user asks for high quality.",
          type: SchemaType.STRING
        },
        prompt: {
          description: "Text description of the desired image",
          type: SchemaType.STRING
        },
        target_path: {
          description: "The file path where the generated image should be saved. Prefer to put them in the 'src/assets' folder.",
          type: SchemaType.STRING
        },
        width: {
          description: "Image width (minimum 512, maximum 1920)",
          type: SchemaType.NUMBER
        }
      },
      required: [
        "prompt",
        "target_path"
      ],
      type: SchemaType.STRING
    }
  },
  {
    description: "Edits or merges existing images based on a text prompt using Flux Kontext Pro model.\nThis tool can work with single or multiple images:\n- Single image: Apply AI-powered edits based on your prompt\n- Multiple images: Merge/combine images according to your prompt\n\nThe strength parameter controls how much the image changes (0.0-1.0).\nLower values preserve more of the original image structure.\n\nExample prompts for single image:\n- \"make it rainy\"\n- \"change to sunset lighting\"\n- \"add snow\"\n- \"make it more colorful\"\n\nExample prompts for multiple images:\n- \"blend these two landscapes seamlessly\"\n- \"combine the foreground of the first image with the background of the second\"\n- \"merge these portraits into a group photo\"\n- \"create a collage from these images\"\n\n\nThis tool is great for object or character consistency. You can reuse the same image and place it in different scenes for example.",
    name: "edit_image",
    parameters: {
      properties: {
        image_paths: {
          description: "Array of paths to existing image files. For single image editing, provide one path. For merging/combining multiple images, provide multiple paths.",
          "items": {
            type: SchemaType.STRING
          },
          type: SchemaType.ARRAY
        },
        prompt: {
          description: "Text description of how to edit/merge the image(s). For multiple images, describe how they should be combined.",
          type: SchemaType.STRING
        },
        strength: {
          description: "How much to change the image (0.0-1.0). Lower values preserve more of the original image.",
          type: SchemaType.NUMBER
        },
        target_path: {
          description: "The file path where the edited/merged image should be saved.",
          type: SchemaType.STRING
        }
      },
      required: [
        "image_paths",
        "prompt",
        "target_path"
      ],
      type: SchemaType.STRING
    }
  },
  {
    description: "Performs a web search and returns relevant results with text content.\nUse this to find current information, documentation, or any web-based content.\nYou can optionally ask for links or image links to be returned as well.\nYou can also optionally specify a category of search results to return.\nValid categories are (you must use the exact string):\n- \"news\"\n- \"linkedin profile\"\n- \"pdf\"\n- \"github\"\n- \"personal site\"\n- \"financial report\"\n\nThere are no other categories. If you don't specify a category, the search will be general.\n\nWhen to use?\n- When you don't have any information about what the user is asking for.\n- When you need to find current information, documentation, or any web-based content.\n- When you need to find specific technical information, etc.\n- When you need to find information about a specific person, company, or organization.\n- When you need to find information about a specific event, product, or service.\n\nWhen you need to find real (not AI generated) images about a specific person, company, or organization.",
    name: "web_search",
    parameters: {
      properties: {
        category: {
          description: "Category of search results to return",
          type: SchemaType.STRING
        },
        imageLinks: {
          description: "Number of image links to return for each result",
          type: SchemaType.NUMBER
        },
        links: {
          description: "Number of links to return for each result",
          type: SchemaType.NUMBER
        },
        numResults: {
          description: "Number of search results to return (default: 5)",
          type: SchemaType.NUMBER
        },
        query: {
          description: "The search query",
          type: SchemaType.STRING
        }
      },
      required: [
        "query"
      ],
      type: SchemaType.STRING
    }
  },
  {
    description: "Read the analytics for the production build of the project between two dates, with a given granularity. The granularity can be 'hourly' or 'daily'. The start and end dates must be in the format YYYY-MM-DD.\nThe start and end dates should be in RFC3339 format or date only format (YYYY-MM-DD).\n\nWhen to use this tool:\n- When the user is asking for usage of their app\n- When users want to improve their productions apps",
    name: "read_project_analytics",
    parameters: {
      properties: {
        enddate: {
          type: SchemaType.STRING
        },
        granularity: {
          type: SchemaType.STRING
        },
        startdate: {
          type: SchemaType.STRING
        }
      },
      required: [
        "startdate",
        "enddate",
        "granularity"
      ],
      type: SchemaType.STRING
    }
  }
]