import React, { useState } from 'react';
import {
  X,
  Share2,
  FileText,
  FileCode,
  Copy,
  Check,
  Download,
} from 'lucide-react';
import { Conversation } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation | null;
  isDark: boolean;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  conversation,
  isDark,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !conversation) return null;

  const handleCopyText = async () => {
    const formatted = conversation.messages
      .map((m) => `${m.role.toUpperCase()}:\n${m.content}\n`)
      .join('\n---\n\n');

    try {
      await navigator.clipboard.writeText(formatted);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownloadMarkdown = () => {
    let md = `# ${conversation.title}\n\n`;
    md += `*Exported from OmniChat on ${new Date().toLocaleString()}*\n\n---\n\n`;

    conversation.messages.forEach((m) => {
      md += `### ${m.role === 'user' ? 'User' : 'OmniChat'}\n\n${m.content}\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conversation.title.toLowerCase().replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    const data = JSON.stringify(conversation, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conversation.title.toLowerCase().replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${
          isDark
            ? 'bg-[#212121] border-zinc-700/80 text-zinc-100'
            : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-inherit">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-emerald-500" />
            <h2 className="text-base font-semibold tracking-tight">Export & Share Chat</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="text-xs text-zinc-400">
            Export "<span className="text-inherit font-medium">{conversation.title}</span>" with {conversation.messages.length} messages.
          </div>

          <div className="space-y-2.5">
            {/* Copy to clipboard */}
            <button
              onClick={handleCopyText}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                isDark
                  ? 'bg-zinc-800/40 hover:bg-zinc-800 border-zinc-700/60'
                  : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Copy className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="text-xs font-semibold text-inherit">Copy Plain Text</div>
                  <div className="text-[11px] text-zinc-400">Formatted conversation to clipboard</div>
                </div>
              </div>
              {copied ? (
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                  <Check className="w-4 h-4" /> Copied!
                </span>
              ) : (
                <span className="text-xs text-zinc-400">Copy</span>
              )}
            </button>

            {/* Markdown Download */}
            <button
              onClick={handleDownloadMarkdown}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                isDark
                  ? 'bg-zinc-800/40 hover:bg-zinc-800 border-zinc-700/60'
                  : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-blue-400" />
                <div>
                  <div className="text-xs font-semibold text-inherit">Download Markdown (.md)</div>
                  <div className="text-[11px] text-zinc-400">Formatted with headers and code blocks</div>
                </div>
              </div>
              <Download className="w-4 h-4 text-zinc-400" />
            </button>

            {/* JSON Download */}
            <button
              onClick={handleDownloadJSON}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                isDark
                  ? 'bg-zinc-800/40 hover:bg-zinc-800 border-zinc-700/60'
                  : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileCode className="w-4 h-4 text-purple-400" />
                <div>
                  <div className="text-xs font-semibold text-inherit">Download JSON (.json)</div>
                  <div className="text-[11px] text-zinc-400">Raw conversation data with metadata</div>
                </div>
              </div>
              <Download className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
