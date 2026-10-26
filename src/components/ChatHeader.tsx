import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  ChevronDown,
  Sparkles,
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
  const [models, setModels] = useState<ModelOption[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // The available models come from the server, which reads them from AI_MODEL / AI_MODELS.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/models')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data?.models)) {
          setModels(data.models);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const currentModel =
    models.find((m) => m.id === selectedModelId) ||
    models[0] || {
      id: '',
      displayName: 'AI model',
      description: '',
      contextLimit: '',
      supportsVision: true,
    };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getModelIcon = () => <Sparkles className="w-4 h-4 text-emerald-400" />;

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
                Model
              </div>
              <div className="space-y-1">
                {models.length === 0 && (
                  <div className="px-3 py-2 text-[11px] text-zinc-400">Loading models…</div>
                )}
                {models.map((model) => {
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
                        {getModelIcon()}
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
                        {model.description && (
                          <p className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5 leading-snug">
                            {model.description}
                          </p>
                        )}
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
                <span>OpenAI-compatible</span>
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
