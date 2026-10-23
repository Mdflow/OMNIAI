import React, { useRef, useEffect, useState } from 'react';
import {
  ArrowUp,
  Square,
  Paperclip,
  Globe,
  Mic,
  MicOff,
  X,
  Image as ImageIcon,
} from 'lucide-react';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSend: (message: string, image?: { data: string; mimeType: string; name: string }) => void;
  isStreaming: boolean;
  onStop: () => void;
  webSearch: boolean;
  setWebSearch: (val: boolean | ((prev: boolean) => boolean)) => void;
  isDark: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  onSend,
  isStreaming,
  onStop,
  webSearch,
  setWebSearch,
  isDark,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [attachedImage, setAttachedImage] = useState<{
    data: string;
    mimeType: string;
    name: string;
  } | null>(null);

  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition if supported
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInput(transcript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [setInput]);

  const toggleListening = () => {
    if (!speechSupported || !recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Speech recognition error:', err);
      }
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const nextHeight = Math.min(textarea.scrollHeight, 200);
    textarea.style.height = `${nextHeight}px`;
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP, etc.).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setAttachedImage({
        data: base64,
        mimeType: file.type,
        name: file.name,
      });
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = () => {
    setAttachedImage(null);
  };

  const handleSubmit = () => {
    if (isStreaming) {
      onStop();
      return;
    }

    const trimmed = input.trim();
    if (!trimmed && !attachedImage) return;

    onSend(trimmed, attachedImage || undefined);
    setInput('');
    setAttachedImage(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const canSend = input.trim().length > 0 || attachedImage !== null;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4">
      {/* Attached Image Preview */}
      {attachedImage && (
        <div className="mb-2 inline-flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-zinc-800/80 border border-zinc-700 text-xs text-zinc-200">
          <img
            src={attachedImage.data}
            alt="Upload preview"
            className="w-10 h-10 object-cover rounded-lg border border-zinc-600"
          />
          <div className="flex flex-col max-w-[180px]">
            <span className="truncate font-medium">{attachedImage.name}</span>
            <span className="text-[10px] text-zinc-400">Attached Image</span>
          </div>
          <button
            onClick={removeImage}
            className="p-1 rounded-md hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors ml-1"
            title="Remove attachment"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Input Container */}
      <div
        className={`relative rounded-3xl p-2.5 transition-all shadow-lg border ${
          isDark
            ? 'bg-[#2f2f2f] border-zinc-700/60 focus-within:border-zinc-500 shadow-black/40'
            : 'bg-[#f4f4f4] border-zinc-300 focus-within:border-zinc-400 shadow-zinc-200'
        }`}
      >
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message OmniChat..."
          rows={1}
          className={`w-full px-3 py-1.5 bg-transparent resize-none focus:outline-hidden text-[15px] leading-relaxed max-h-[200px] ${
            isDark ? 'text-zinc-100 placeholder-zinc-400' : 'text-zinc-900 placeholder-zinc-500'
          }`}
        />

        {/* Bottom Toolbar inside input */}
        <div className="flex items-center justify-between pt-1 px-1">
          {/* Left tools: Attach file & Web search toggle */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`p-2 rounded-full transition-colors ${
                isDark
                  ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/60'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/80'
              }`}
              title="Attach image for visual analysis"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Web Search toggle pill */}
            <button
              type="button"
              onClick={() => setWebSearch((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                webSearch
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                  : isDark
                  ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/60'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/80'
              }`}
              title="Search the web for up-to-date facts"
            >
              <Globe className={`w-3.5 h-3.5 ${webSearch ? 'text-blue-400' : ''}`} />
              <span className="text-[12px]">Search</span>
            </button>
          </div>

          {/* Right tools: Voice Dictation & Send/Stop */}
          <div className="flex items-center gap-1.5">
            {speechSupported && (
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2 rounded-full transition-colors relative ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : isDark
                    ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/60'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/80'
                }`}
                title={isListening ? 'Stop listening' : 'Dictate with speech-to-text'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}

            {isStreaming ? (
              <button
                type="button"
                onClick={onStop}
                className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-900 hover:bg-white flex items-center justify-center transition-transform active:scale-95 shadow-xs"
                title="Stop generating"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSend}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  canSend
                    ? 'bg-white text-zinc-950 hover:bg-zinc-200 shadow-md cursor-pointer active:scale-95'
                    : isDark
                    ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed opacity-50'
                    : 'bg-zinc-300 text-zinc-500 cursor-not-allowed opacity-50'
                }`}
                title="Send message (Enter)"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-2 text-center">
        <p className="text-[11.5px] text-zinc-500 tracking-tight">
          OmniChat can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  );
};
