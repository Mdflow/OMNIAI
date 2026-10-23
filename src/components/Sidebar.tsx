import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  Plus,
  Search,
  Pin,
  Trash2,
  Edit2,
  Check,
  X,
  Settings,
  Sun,
  Moon,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Share2,
  Globe,
} from 'lucide-react';
import { Conversation, UserSettings, AppView } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  isOpen: boolean;
  onToggle: () => void;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onTogglePin: (id: string) => void;
  onOpenSettings: () => void;
  onOpenShare: () => void;
  settings: UserSettings;
  onUpdateSettings: (settings: Partial<UserSettings>) => void;
  currentView: AppView;
  onSwitchView: (view: AppView) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  isOpen,
  onToggle,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onTogglePin,
  onOpenSettings,
  onOpenShare,
  settings,
  onUpdateSettings,
  currentView,
  onSwitchView,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Group conversations by time category: Pinned, Today, Yesterday, Previous 7 Days, Older
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }, [conversations, searchQuery]);

  const groups = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const todayCutoff = now - oneDay;
    const yesterdayCutoff = now - 2 * oneDay;
    const weekCutoff = now - 7 * oneDay;

    const pinned: Conversation[] = [];
    const today: Conversation[] = [];
    const yesterday: Conversation[] = [];
    const previousWeek: Conversation[] = [];
    const older: Conversation[] = [];

    filteredConversations.forEach((conv) => {
      if (conv.pinned) {
        pinned.push(conv);
      } else if (conv.updatedAt > todayCutoff) {
        today.push(conv);
      } else if (conv.updatedAt > yesterdayCutoff) {
        yesterday.push(conv);
      } else if (conv.updatedAt > weekCutoff) {
        previousWeek.push(conv);
      } else {
        older.push(conv);
      }
    });

    return [
      { label: 'Pinned', items: pinned },
      { label: 'Today', items: today },
      { label: 'Yesterday', items: yesterday },
      { label: 'Previous 7 Days', items: previousWeek },
      { label: 'Older', items: older },
    ].filter((g) => g.items.length > 0);
  }, [filteredConversations]);

  const startRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
    setActiveMenuId(null);
  };

  const saveRename = (id: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const isDark = settings.theme === 'dark';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 flex flex-col transition-all duration-300 ease-in-out ${
          isOpen ? 'w-64 md:w-68' : 'w-0 -translate-x-full md:translate-x-0 md:w-0'
        } ${
          isDark ? 'bg-[#171717] text-zinc-200 border-zinc-800' : 'bg-[#f9f9f9] text-zinc-800 border-zinc-200'
        } border-r overflow-hidden select-none`}
      >
        {/* Top Header / App Brand */}
        <div className="p-3.5 flex items-center justify-between border-b border-inherit">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-sm ring-2 ring-emerald-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm tracking-tight flex items-center gap-1.5">
                OmniChat
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20">
                  GPT-4o
                </span>
              </span>
            </div>
          </div>
          <button
            onClick={onToggle}
            className={`p-1.5 rounded-lg hover:bg-zinc-700/20 text-zinc-400 hover:text-zinc-200 transition-colors`}
            title="Close sidebar"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Mode Switcher: Chat vs In-App Web Browser */}
        <div className="px-3 pt-2 pb-1 flex gap-1">
          <button
            onClick={() => onSwitchView('chat')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentView === 'chat'
                ? 'bg-emerald-600 text-white shadow-xs'
                : isDark
                ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/80'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>OmniChat</span>
          </button>
          <button
            onClick={() => onSwitchView('browser')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentView === 'browser'
                ? 'bg-emerald-600 text-white shadow-xs'
                : isDark
                ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/80'
            }`}
            title="Browse any website directly on this site"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Web Browser</span>
          </button>
        </div>

        {/* Action Buttons: New Chat & Search */}
        <div className="p-3 space-y-2">
          <button
            onClick={onNewChat}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isDark
                ? 'bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-100 border border-zinc-700/50 shadow-xs'
                : 'bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-200 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Plus className="w-4 h-4 text-emerald-500" />
              <span>New chat</span>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono border border-zinc-700/40 px-1.5 py-0.5 rounded">
              ⌘O
            </span>
          </button>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-lg transition-colors focus:outline-hidden ${
                isDark
                  ? 'bg-zinc-800/40 text-zinc-200 placeholder-zinc-500 focus:bg-zinc-800/80 focus:ring-1 focus:ring-emerald-500/50'
                  : 'bg-zinc-200/60 text-zinc-800 placeholder-zinc-500 focus:bg-white focus:ring-1 focus:ring-emerald-500/50'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-4 scrollbar-thin">
          {filteredConversations.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              {searchQuery ? 'No conversations found' : 'No chats yet. Start a new one!'}
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.label} className="space-y-0.5">
                <div className="px-3 py-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  {group.label}
                </div>
                {group.items.map((conv) => {
                  const isActive = conv.id === activeId;
                  const isEditing = editingId === conv.id;

                  return (
                    <div
                      key={conv.id}
                      onClick={() => onSelectConversation(conv.id)}
                      className={`group relative flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer transition-all ${
                        isActive
                          ? isDark
                            ? 'bg-zinc-800 text-white font-medium'
                            : 'bg-zinc-200/80 text-zinc-900 font-medium'
                          : isDark
                          ? 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                          : 'text-zinc-600 hover:bg-zinc-200/40 hover:text-zinc-900'
                      }`}
                    >
                      {isEditing ? (
                        <form
                          onSubmit={(e) => saveRename(conv.id, e)}
                          className="flex items-center gap-1 w-full"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            value={editTitle}
                            autoFocus
                            onChange={(e) => setEditTitle(e.target.value)}
                            className={`flex-1 px-1.5 py-0.5 text-xs rounded bg-zinc-700 text-white focus:outline-hidden ring-1 ring-emerald-500`}
                          />
                          <button
                            type="submit"
                            className="p-1 hover:text-emerald-400"
                            title="Save"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="p-1 hover:text-red-400"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </form>
                      ) : (
                        <>
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-70" />
                            <span className="truncate text-xs">{conv.title}</span>
                          </div>

                          {/* Quick Actions (Pin, Rename, Delete) */}
                          <div
                            className={`flex items-center gap-1 shrink-0 ${
                              isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            } transition-opacity`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => onTogglePin(conv.id)}
                              className={`p-1 rounded hover:bg-zinc-700/40 ${
                                conv.pinned ? 'text-emerald-400' : 'text-zinc-400 hover:text-zinc-200'
                              }`}
                              title={conv.pinned ? 'Unpin chat' : 'Pin chat'}
                            >
                              <Pin className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => startRename(conv, e)}
                              className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/40"
                              title="Rename chat"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => onDeleteConversation(conv.id)}
                              className="p-1 rounded text-zinc-400 hover:text-red-400 hover:bg-zinc-700/40"
                              title="Delete chat"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Bottom Profile / Settings Footer */}
        <div className="p-3 border-t border-inherit space-y-1.5">
          <button
            onClick={onOpenShare}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              isDark ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-zinc-200 text-zinc-700'
            }`}
          >
            <Share2 className="w-4 h-4 text-zinc-400" />
            <span>Export & Share</span>
          </button>

          <button
            onClick={onOpenSettings}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              isDark ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-zinc-200 text-zinc-700'
            }`}
          >
            <Settings className="w-4 h-4 text-zinc-400" />
            <span>Settings & Instructions</span>
          </button>

          {/* User profile row & Theme Toggle */}
          <div className="pt-1.5 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-linear-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-xs font-bold text-white shadow-xs">
                U
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium truncate max-w-[100px]">ChatGPT User</span>
                <span className="text-[10px] text-zinc-500">Free Tier</span>
              </div>
            </div>

            <button
              onClick={() => onUpdateSettings({ theme: isDark ? 'light' : 'dark' })}
              className={`p-1.5 rounded-lg transition-colors ${
                isDark ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
              }`}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
