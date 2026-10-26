import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  isDark?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, isDark = true }) => {
  return (
    <div className={`prose max-w-none break-words ${isDark ? 'prose-invert text-zinc-100' : 'text-zinc-800'}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const codeString = String(children).replace(/\n$/, '');

            if (!inline && (match || codeString.includes('\n'))) {
              return <CodeBlock code={codeString} language={language || 'text'} isDark={isDark} />;
            }

            return (
              <code
                className={`px-1.5 py-0.5 rounded text-[13px] font-mono ${
                  isDark ? 'bg-zinc-800 text-zinc-200 border border-zinc-700/60' : 'bg-zinc-200 text-zinc-900 border border-zinc-300'
                }`}
                {...props}
              >
                {children}
              </code>
            );
          },
          p({ children }) {
            return <p className="mb-4 last:mb-0 leading-7 text-[15px]">{children}</p>;
          },
          ul({ children }) {
            return <ul className="my-3 pl-6 list-disc space-y-1.5 text-[15px]">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="my-3 pl-6 list-decimal space-y-1.5 text-[15px]">{children}</ol>;
          },
          li({ children }) {
            return <li className="leading-7">{children}</li>;
          },
          h1({ children }) {
            return <h1 className="text-2xl font-bold mt-6 mb-3 tracking-tight">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-xl font-semibold mt-5 mb-2.5 tracking-tight">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-lg font-medium mt-4 mb-2 tracking-tight">{children}</h3>;
          },
          blockquote({ children }) {
            return (
              <blockquote
                className={`border-l-4 my-4 pl-4 italic text-sm ${
                  isDark ? 'border-zinc-600 text-zinc-400' : 'border-zinc-300 text-zinc-600'
                }`}
              >
                {children}
              </blockquote>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4 rounded-lg border border-zinc-700/50">
                <table className="min-w-full text-left text-sm divide-y divide-zinc-700/60">{children}</table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className={isDark ? 'bg-zinc-800/80' : 'bg-zinc-100'}>{children}</thead>;
          },
          th({ children }) {
            return <th className="px-4 py-2.5 font-semibold text-xs uppercase tracking-wider">{children}</th>;
          },
          td({ children }) {
            return (
              <td className={`px-4 py-2 text-sm border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                {children}
              </td>
            );
          },
          hr() {
            return <hr className={`my-6 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`} />;
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

const CodeBlock: React.FC<{ code: string; language: string; isDark: boolean }> = ({ code, language, isDark }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-zinc-700/60 bg-[#1e1e1e] shadow-md text-zinc-100">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] text-xs font-mono text-zinc-400 border-b border-zinc-700/60 select-none">
        <span className="uppercase tracking-wider font-semibold">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-zinc-300 hover:text-white hover:bg-zinc-700/60 transition-all text-xs"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      <div className="p-4 overflow-x-auto text-[13.5px] leading-relaxed font-mono selection:bg-zinc-700 text-zinc-200">
        <pre className="m-0 p-0 font-mono">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};
