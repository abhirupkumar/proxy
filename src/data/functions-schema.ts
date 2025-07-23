import { FunctionDeclaration, SchemaType } from "@google/generative-ai";

export const agentTools: FunctionDeclaration[] = [
  {
    name: "ask_user",
    description: "Ask the user a question to confirm a plan or get more information.",
  },
  {
    name: "list_dir",
    description: "List the contents of a directory. The quick tool to use for discovery, before using more targeted tools like semantic search or file reading. Useful to try to understand the file structure before diving deeper into specific files. Can be used to explore the codebase.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        target_dir_path: {
          type: SchemaType.STRING,
          description: "Directory path to list contents of."
        }
      },
      required: [
        "target_dir_path"
      ]
    }
  },
  {
    name: "read_files",
    description: "Read the contents of files. The output of this tool call will be the 1-indexed file contents from start_line_one_indexed to end_line_one_indexed_inclusive, together with a summary of the lines outside start_line_one_indexed and end_line_one_indexed_inclusive. Note that this call can view at most 250 lines at a time.\n\nWhen using this tool to gather information, it's your responsibility to ensure you have the COMPLETE context. Specifically, each time you call this command you should:\n1) Assess if the contents you viewed are sufficient to proceed with your task.\n2) Take note of where there are lines not shown.\n3) If the file contents you have viewed are insufficient, and you suspect they may be in lines not shown, call the tool again to view those lines.\n4) When in doubt, call this tool again. Remember that partial file views may miss critical dependencies, imports, or functionality.\n\nIn some cases, if reading a range of lines is not enough, you may choose to read the entire file. Use this option sparingly.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        files_to_read: {
          type: SchemaType.ARRAY,
          description: "A list of files to read.",
          items: {
            type: SchemaType.OBJECT,
            properties: {
              target_file_paths: {
                type: SchemaType.ARRAY,
                description: "The paths of the files to read.",
                items: {
                  type: SchemaType.STRING,
                  description: "A single file path to read."
                }
              }
            },
            required: [
              "target_file_paths"
            ]
          }
        }
      },
      required: [
        "files_to_read"
      ]
    },
  },
  {
    name: "edit_file",
    description: "Use this tool to make an edit to an existing file or create a new file. Specify the `target_file_path` argument first.\ncode_edit will be read by a less intelligent model, which will quickly apply the edit.\n\nYou should make it clear what the edit is while minimizing the unchanged code you write.\nWhen writing the edit, specify each edit in sequence using the special comment `// ... existing code ... <description of existing code>` to represent unchanged code in between edited lines.\n\nFor example:\n```\n// ... existing code ... <original import statements>\n<first edit here>\n// ... existing code ... <`LoginButton` component>\n<second edit here>\n// ... existing code ... <the rest of the file>\n```\nALWAYS include the `// ... existing code ... <description of existing code>` comment for each edit to indicate the code that should not be changed.\n\nYou should repeat as few lines of the original file as possible to convey the change.\nBut, each edit should contain sufficient context of unchanged lines around the code you are editing to resolve ambiguity.\nDO NOT omit spans of pre-existing code without using the `// ... existing code ... <description of existing code>` comment to indicate its absence.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        code_edit: {
          type: SchemaType.STRING,
          description: "Specify ONLY the precise lines of code that you wish to edit. **NEVER specify or write out unchanged code**. Instead, represent all unchanged code using the comment of the language you're editing in - example: `// ...[existing code] <description of existing code> ...`."
        },
        instructions: {
          type: SchemaType.STRING,
          description: "A single sentence instruction describing what you are going to do for the sketched edit. Don't repeat what you have said previously in normal messages. And use it to disambiguate uncertainty in the edit."
        },
        smart_apply: {
          type: SchemaType.BOOLEAN,
          description: "Use a smart model to apply the code_edit. This is useful if the edit is long, or if the last edit was incorrect. Make sure to include the proper `// ... existing code ...` comments to indicate the code that should not be changed. Default is false."
        },
        target_file_path: {
          type: SchemaType.STRING,
          description: "The target file to modify. The tool will create any directories in the path that don't exist."
        }
      },
      required: [
        "target_file_path",
        "instructions",
        "code_edit"
      ]
    }
  },
  {
    name: "versioning",
    description: "Create a new version for a project. Calling this tool will automatically increment the version by 1. Make sure the app is error-free and implemented all of user's request before calling this tool.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        version_changelog: {
          type: SchemaType.ARRAY,
          description: "The version changelog. Write 1-5 short points.",
          items: {
            type: SchemaType.STRING
          }
        },
        version_number: {
          type: SchemaType.STRING,
          description: "A whole number. Leave empty to automatically increment."
        },
        version_title: {
          type: SchemaType.STRING,
          description: "The title of the version. This is used to help the user navigate to the version."
        }
      },
      required: [
        "version_title",
        "version_changelog"
      ]
    }
  }
]
