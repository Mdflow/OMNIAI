import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  ChevronDown,
  Sparkles,
  Brain,
  Feather,
  Code2,
  Plus,
  Share2,
  Settings,
  Check,
  Zap,
  Globe,
} from 'lucide-react';
import { ModelOption, AppView } from '../types';

interface ChatHeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  onNewChat: () => void;
  onOpenShare: () => void;
  onOpenSettings: () => void;
  isDark: boolean;
  currentView: AppView;
  onSwitchView: (view: AppView) => void;
}

const MODELS: ModelOption[] = [
  {
    id: 'gemini-3.6-flash',
    displayName: 'Gemini Flash',
    description: 'Our most responsive model for lightning-fast text, multimodal vision, and rapid answers.',
    badge: 'Fastest ⚡',
    contextLimit: '128k',
    supportsVision: true,
  },
  {
    id: 'gemini-3.5-flash',
    displayName: 'Deep Think Mode',
    description: 'Thinks deeply before responding. Excels at math, coding challenges, and complex logic.',
    badge: 'Reasoning',
    contextLimit: '128k',
    supportsVision: true,
  },
  {
    id: 'gemini-3.6-flash-coder',
    displayName: 'Code Architect',
    description: 'Specialized for software engineering, architecture reviews, debugging, and scripts.',
    badge: 'Dev',
    contextLimit: '128k',
    supportsVision: true,
  },
  {
    id: 'gemini-3.6-flash-creative',
    displayName: 'Creative & Prose',
    description: 'A creative tone for writing, engaging narratives, marketing copy, and dialogue.',
    badge: 'Creative',
    contextLimit: '128k',
    supportsVision: true,
  },
];

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  isSidebarOpen,
  onToggleSidebar,
  selectedModelId,
  onSelectModel,
  onNewChat,
  onOpenShare,
  onOpenSettings,
  isDark,
  currentView,
  onSwitchView,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentModel = MODELS.find((m) => m.id === selectedModelId) || MODELS[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getModelIcon = (id: string) => {
    switch (id) {
      case 'gemini-3.8-flash-thinking':
        return <Brain className="w-4 h-4 text-purple-400" />;
      case 'gemini-3.8-flash-coder':
        return <Code2 className="w-4 h-4 text-blue-400" />;
      case 'gemini-3.8-flash-creative':
        return <Feather className="w-4 h-4 text-amber-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <header
      className={`h-14 px-3 flex items-center justify-between border-b shrink-0 select-none ${
        isDark
          ? 'bg-[#212121]/90 border-zinc-800/80 text-zinc-100 backdrop-blur-md'
          : 'bg-white/90 border-zinc-200/80 text-zinc-800 backdrop-blur-md'
      }`}
    >
      {/* Left: Sidebar toggle & Model Selector */}
      <div className="flex items-center gap-2">
        {!isSidebarOpen && (
          <button
            onClick={onToggleSidebar}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100' : 'hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900'
            }`}
            title="Open sidebar (⌘S)"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Model dropdown trigger */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-medium text-sm transition-all ${
              isDark
                ? 'hover:bg-zinc-800/80 text-zinc-200 hover:text-white'
                : 'hover:bg-zinc-100 text-zinc-800 hover:text-zinc-900'
            }`}
          >
            <span className="flex items-center gap-1.5 font-semibold text-base tracking-tight">
              {currentModel.displayName}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div
              className={`absolute left-0 mt-2 w-80 rounded-2xl p-2 shadow-2xl border z-50 animate-in fade-in zoom-in-95 duration-150 ${
                isDark
                  ? 'bg-[#282828] border-zinc-700/80 text-zinc-100 shadow-black/60'
                  : 'bg-white border-zinc-200 text-zinc-900 shadow-zinc-300'
              }`}
            >
              <div className="px-3 py-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Model Architecture
              </div>
              <div className="space-y-1">
                {MODELS.map((model) => {
                  const isSelected = model.id === currentModel.id;
                  return (
                    <button
                      key={model.id}
                      onClick={() => {
                        onSelectModel(model.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl flex items-start gap-3 transition-colors ${
                        isSelected
                          ? isDark
                            ? 'bg-zinc-700/50 text-white'
                            : 'bg-zinc-100 text-zinc-900'
                          : isDark
                          ? 'hover:bg-zinc-800/60 text-zinc-300'
                          : 'hover:bg-zinc-50 text-zinc-700'
                      }`}
                    >
                      <div className="mt-0.5 p-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700/50">
                        {getModelIcon(model.id)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-xs text-inherit">{model.displayName}</span>
                          {model.badge && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {model.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5 leading-snug">
                          {model.description}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className={`mt-2 pt-2 border-t px-2 text-[11px] text-zinc-400 flex items-center justify-between ${isDark ? 'border-zinc-700/60' : 'border-zinc-200'}`}>
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" /> Real-time token streaming
                </span>
                <span>Context: 128k</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Actions: Switch View, New Chat, Share, Settings */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onSwitchView(currentView === 'chat' ? 'browser' : 'chat')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
            currentView === 'browser'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
          }`}
          title={currentView === 'chat' ? 'Open in-app web browser' : 'Switch back to chat'}
        >
          {currentView === 'chat' ? (
            <>
              <Globe className="w-3.5 h-3.5" />
              <span>Browse Website</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>OmniChat</span>
            </>
          )}
        </button>

        {currentView === 'chat' && (
          <button
            onClick={onNewChat}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              isDark
                ? 'hover:bg-zinc-800 text-zinc-300 hover:text-white'
                : 'hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900'
            }`}
            title="Start fresh conversation"
          >
            <Plus className="w-4 h-4 text-emerald-500" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        )}

        <button
          onClick={onOpenShare}
          className={`p-2 rounded-xl transition-colors ${
            isDark
              ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
              : 'hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900'
          }`}
          title="Share / Export conversation"
        >
          <Share2 className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenSettings}
          className={`p-2 rounded-xl transition-colors ${
            isDark
              ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
              : 'hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900'
          }`}
          title="Settings & instructions"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
