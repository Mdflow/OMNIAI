import React, { useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  Volume2,
  VolumeX,
  ThumbsUp,
  ThumbsDown,
  Edit3,
} from 'lucide-react';
import { ChatMessage } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface MessageItemProps {
  message: ChatMessage;
  isStreamingThis: boolean;
  onRegenerate?: () => void;
  onEditPrompt?: (newContent: string) => void;
  isDark: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isStreamingThis,
  onRegenerate,
  onEditPrompt,
  isDark,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(message.content);

  const isUser = message.role === 'user';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message.content);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleSaveEdit = () => {
    if (editedText.trim() && onEditPrompt) {
      onEditPrompt(editedText.trim());
      setIsEditing(false);
    }
  };

  return (
    <div
      className={`py-5 px-4 sm:px-6 w-full group transition-colors ${
        isUser
          ? ''
          : isDark
          ? 'bg-zinc-800/20'
          : 'bg-zinc-50/60'
      }`}
    >
      <div className="max-w-3xl mx-auto flex gap-4 items-start">
        {/* Avatar */}
        <div className="shrink-0 pt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-linear-to-tr from-zinc-700 to-zinc-800 flex items-center justify-center text-xs font-bold text-white shadow-xs ring-1 ring-zinc-700">
              U
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-100 shadow-xs">
              <Sparkles className="w-4 h-4 text-zinc-200" />
            </div>
          )}
        </div>

        {/* Message Content Container */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-xs tracking-tight text-inherit">
              {isUser ? 'You' : 'OmniChat'}
            </span>
            <span className="text-[10px] text-zinc-400">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* User Attached Image (if present) */}
          {message.image && (
            <div className="mb-3 inline-block">
              <img
                src={message.image.data}
                alt={message.image.name || 'User attachment'}
                className="max-h-72 max-w-full rounded-xl border border-zinc-700/60 object-contain shadow-md"
              />
            </div>
          )}

          {/* User message edit state vs normal display */}
          {isUser && isEditing ? (
            <div className="mt-2 space-y-2">
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className={`w-full p-2.5 rounded-xl text-sm border focus:outline-hidden ${
                  isDark
                    ? 'bg-zinc-800 border-zinc-700 text-zinc-100 ring-1 ring-zinc-600'
                    : 'bg-white border-zinc-300 text-zinc-900 ring-1 ring-zinc-400'
                }`}
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-900 font-medium text-xs hover:bg-zinc-200"
                >
                  Save & Submit
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-700 text-zinc-300 text-xs font-medium hover:bg-zinc-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : isUser ? (
            <div className="text-[15px] leading-relaxed whitespace-pre-wrap select-text">
              {message.content}
            </div>
          ) : (
            <div>
              <MarkdownRenderer content={message.content} isDark={isDark} />
              {isStreamingThis && (
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-100 animate-pulse ml-1.5 align-middle" />
              )}
            </div>
          )}

          {/* Error notice if message failed */}
          {message.error && (
            <div className="mt-2 text-xs text-red-400 bg-red-950/40 border border-red-800/60 p-2.5 rounded-lg">
              Generation was interrupted or encountered an issue. You can try regenerating.
            </div>
          )}

          {/* Action Toolbar on Bottom */}
          <div className="flex items-center gap-1 mt-3 text-zinc-400 select-none">
            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className={`p-1.5 rounded-md hover:text-zinc-200 transition-colors ${
                isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-200'
              }`}
              title="Copy message to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {/* Read Aloud button (Text to Speech) */}
            <button
              onClick={handleSpeak}
              className={`p-1.5 rounded-md hover:text-zinc-200 transition-colors ${
                isSpeaking ? 'text-emerald-400' : ''
              } ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-200'}`}
              title={isSpeaking ? 'Stop audio' : 'Read aloud'}
            >
              {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            {/* If user message: allow editing */}
            {isUser && onEditPrompt && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className={`p-1.5 rounded-md hover:text-zinc-200 transition-colors ${
                  isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-200'
                }`}
                title="Edit message"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* If assistant message: Regenerate & Thumbs feedback */}
            {!isUser && onRegenerate && (
              <button
                onClick={onRegenerate}
                className={`p-1.5 rounded-md hover:text-zinc-200 transition-colors ${
                  isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-200'
                }`}
                title="Regenerate response"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}

            {!isUser && (
              <>
                <button
                  onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
                  className={`p-1.5 rounded-md transition-colors ${
                    feedback === 'up'
                      ? 'text-emerald-400'
                      : isDark
                      ? 'hover:text-zinc-200 hover:bg-zinc-800'
                      : 'hover:text-zinc-800 hover:bg-zinc-200'
                  }`}
                  title="Good response"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
                  className={`p-1.5 rounded-md transition-colors ${
                    feedback === 'down'
                      ? 'text-red-400'
                      : isDark
                      ? 'hover:text-zinc-200 hover:bg-zinc-800'
                      : 'hover:text-zinc-800 hover:bg-zinc-200'
                  }`}
                  title="Bad response"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
