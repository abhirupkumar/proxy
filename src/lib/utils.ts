import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { PluggableList, Plugin } from "unified";
import { SKIP, visit } from "unist-util-visit";
import rehypeSanitize, { defaultSchema, type Options as RehypeSanitizeOptions } from 'rehype-sanitize';
import { Metadata } from "next";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const allowedHTMLElements = [
  'a',
  'b',
  'blockquote',
  'br',
  'code',
  'dd',
  'del',
  'details',
  'div',
  'dl',
  'dt',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'i',
  'ins',
  'kbd',
  'li',
  'ol',
  'p',
  'pre',
  'q',
  'rp',
  'rt',
  'ruby',
  's',
  'samp',
  'source',
  'span',
  'strike',
  'strong',
  'sub',
  'summary',
  'sup',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'ul',
  'var',
];

const rehypeSanitizeOptions: RehypeSanitizeOptions = {
  ...defaultSchema,
  tagNames: allowedHTMLElements,
  attributes: {
    ...defaultSchema.attributes,
    div: [...(defaultSchema.attributes?.div ?? []), 'data*', ['className', '__proxyRegex__']],
  },
  strip: [],
};

export function remarkPlugins(limitedMarkdown: boolean) {
  const plugins: PluggableList = [remarkGfm];

  if (limitedMarkdown) {
    plugins.unshift(limitedMarkdownPlugin);
  }

  return plugins;
}

export function rehypePlugins(html: boolean) {
  const plugins: PluggableList = [];

  if (html) {
    plugins.push(rehypeRaw, [rehypeSanitize, rehypeSanitizeOptions]);
  }

  return plugins;
}

const limitedMarkdownPlugin: Plugin = () => {
  return (tree, file) => {
    const contents = file.toString();

    visit(tree, (node, index, parent: any) => {
      if (
        index == null ||
        ['paragraph', 'text', 'inlineCode', 'code', 'strong', 'emphasis'].includes(node.type) ||
        !node.position
      ) {
        return true;
      }

      let value = contents.slice(node.position.start.offset, node.position.end.offset);

      if (node.type === 'heading') {
        value = `\n${value}`;
      }

      parent.children[index] = {
        type: 'text',
        value,
      } as any;

      return [SKIP, index] as const;
    });
  };
};

export function stripIndents(value: string): string;
export function stripIndents(strings: TemplateStringsArray, ...values: any[]): string;
export function stripIndents(arg0: string | TemplateStringsArray, ...values: any[]) {
  if (typeof arg0 !== 'string') {
    const processedString = arg0.reduce((acc, curr, i) => {
      acc += curr + (values[i] ?? '');
      return acc;
    }, '');

    return _stripIndents(processedString);
  }

  return _stripIndents(arg0);
}

function _stripIndents(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .trimStart()
    .replace(/[\r\n]$/, '');
}

export function extractEnvVariables(content: string): Record<string, string> {
  const envVars: Record<string, string> = {};

  // Split by lines and process each line
  const lines = content.split('\n');

  for (const line of lines) {
    // Skip comments and empty lines
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    // Find the first equals sign (to handle values that contain = signs)
    const equalSignIndex = trimmedLine.indexOf('=');
    if (equalSignIndex < 1) continue; // Skip invalid lines

    const key = trimmedLine.substring(0, equalSignIndex).trim();
    let value = trimmedLine.substring(equalSignIndex + 1).trim();

    // Handle quoted values
    if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
      value = value.substring(1, value.length - 1);
    }

    // Store the key-value pair
    envVars[key] = value;
  }

  return envVars;
}

/**
 * Formats a date to a readable string
 */
export function formatDate(date: Date | null): string {
  if (!date) return 'Never';

  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Get status text
export const getStatusText = (status: string) => {
  switch (status) {
    case 'READY':
    case 'SUCCEEDED':
    case 'PROMOTED':
      return 'Deployed';
    case 'ERROR':
    case 'FAILED':
      return 'Failed';
    case 'BUILDING':
    case 'INITIALIZING':
      return 'Building';
    case 'QUEUED':
      return 'Queued';
    case 'CANCELED':
      return 'Canceled';
    case 'NONE':
    default:
      return '';
  }
};

export function constructMetadata({
  title = "Proxy",
  description = "Proxy - AI Full Stack Developer",
  image = "/logo-white.svg",
}: {
  title?: string;
  description?: string;
  image?: string;
  noIndex?: boolean;
} = {}): Metadata {
  return {
    title,
    description,
    icons: {
      icon: [
        {
          url: image,
          href: image,
        },
      ],
    },
    openGraph: {
      title,
      description,
      images: [
        {
          url: image,
          href: image,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    metadataBase: new URL("https://proxyai.tech"),
  };
}