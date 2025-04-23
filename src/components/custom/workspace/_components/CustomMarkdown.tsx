import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ClipboardCopy } from 'lucide-react';
import styles from './CodeBlock.module.css';

// Interface for CodeBlock props
interface CodeBlockProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
  [key: string]: any;
}

// Define custom renderer for code blocks
const CodeBlock: React.FC<CodeBlockProps> = ({ node, inline, className, children, ...props }) => {
  const [copied, setCopied] = useState<boolean>(false);

  // Handle inline code
  if (inline) {
    return <code className={className} {...props}>{children}</code>;
  }

  // Extract language from className (format: language-xxx)
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';

  const handleCopy = (): void => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.codeBlockContainer}>
      <div className={styles.codeHeader}>
        {language && <span className={styles.codeLanguage}>{language}</span>}
        <button
          onClick={handleCopy}
          className={styles.copyButton}
          aria-label="Copy code"
        >
          <ClipboardCopy size={16} />
          <span>{copied ? "Copied!" : "Copy"}</span>
        </button>
      </div>
      <pre className={styles.codeBlock}>
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
};

// Interface for EnhancedMarkdown props
interface EnhancedMarkdownProps {
  children: string;
  allowedElements?: string[];
  className?: string;
}

// Enhanced ReactMarkdown component
const CustomMarkdown: React.FC<EnhancedMarkdownProps> = ({
  children,
  allowedElements,
  className
}) => {
  return (
    <ReactMarkdown
      allowedElements={allowedElements}
      className={className}
      components={{
        code: CodeBlock as any // Type casting needed due to ReactMarkdown's component typing
      }}
    >
      {children}
    </ReactMarkdown>
  );
};

export default CustomMarkdown;