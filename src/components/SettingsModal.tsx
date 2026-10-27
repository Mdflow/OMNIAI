import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Sparkles,
  Command,
  Trash2,
  Check,
  Moon,
  Sun,
  Key,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { UserSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSaveSettings: (settings: Partial<UserSettings>) => void;
  onClearAllChats: () => void;
  isDark: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onClearAllChats,
  isDark,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'instructions' | 'shortcuts'>('general');
  const [customInstructions, setCustomInstructions] = useState(settings.customInstructions || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const [keyStatus, setKeyStatus] = useState<any>(null);
  const [isCheckingKey, setIsCheckingKey] = useState(false);

  const checkApiStatus = async () => {
    setIsCheckingKey(true);
    try {
      const res = await fetch('/api/key-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setKeyStatus(data);
    } catch (err: any) {
      setKeyStatus({
        configured: false,
        valid: false,
        error: 'Could not contact server to verify API key.',
      });
    } finally {
      setIsCheckingKey(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setKeyStatus(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveInstructions = () => {
    onSaveSettings({ customInstructions });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ${
          isDark
            ? 'bg-[#212121] border-zinc-700/80 text-zinc-100'
            : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-inherit">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-500" />
            <h2 className="text-base font-semibold tracking-tight">Settings</h2>
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

        {/* Tab Navigation */}
        <div className={`flex border-b px-6 gap-6 text-sm font-medium ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <button
            onClick={() => setActiveTab('general')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'general'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-inherit'
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('instructions')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'instructions'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-inherit'
            }`}
          >
            Custom Instructions
          </button>
          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'shortcuts'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-inherit'
            }`}
          >
            Shortcuts
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Theme Preference */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm">Color Theme</div>
                  <div className="text-xs text-zinc-400">Choose between dark and light appearance</div>
                </div>
                <div className={`flex rounded-xl p-1 border ${isDark ? 'bg-zinc-800/80 border-zinc-700' : 'bg-zinc-100 border-zinc-200'}`}>
                  <button
                    onClick={() => onSaveSettings({ theme: 'dark' })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      settings.theme === 'dark'
                        ? 'bg-zinc-700 text-white shadow-xs'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" /> Dark
                  </button>
                  <button
                    onClick={() => onSaveSettings({ theme: 'light' })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      settings.theme === 'light'
                        ? 'bg-white text-zinc-900 shadow-xs'
                        : 'text-zinc-400 hover:text-zinc-600'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" /> Light
                  </button>
                </div>
              </div>

              {/* Response Tone */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm">Default Response Tone</div>
                  <div className="text-xs text-zinc-400">Controls verbosity and style of answers</div>
                </div>
                <select
                  value={settings.systemTone}
                  onChange={(e) => onSaveSettings({ systemTone: e.target.value as any })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border focus:outline-hidden ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-100 border-zinc-200 text-zinc-900'
                  }`}
                >
                  <option value="balanced">Balanced (Standard)</option>
                  <option value="concise">Concise & Direct</option>
                  <option value="detailed">In-depth & Thorough</option>
                  <option value="academic">Academic & Rigorous</option>
                  <option value="casual">Casual & Conversational</option>
                </select>
              </div>

              {/* API Key (server-managed, shared across all visitors) */}
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-zinc-800/50 border-zinc-700/80' : 'bg-zinc-50 border-zinc-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-xs text-inherit flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-emerald-400" />
                    <span>API Key</span>
                  </div>
                  <button
                    type="button"
                    onClick={checkApiStatus}
                    disabled={isCheckingKey}
                    className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-medium"
                  >
                    <RefreshCw className={`w-3 h-3 ${isCheckingKey ? 'animate-spin' : ''}`} />
                    <span>{isCheckingKey ? 'Checking...' : 'Check Status'}</span>
                  </button>
                </div>

                <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
                  The API key is managed on the server and shared across all visitors — no setup needed.
                </p>

                {keyStatus ? (
                  keyStatus.valid ? (
                    <div className="flex items-start gap-2 text-xs text-emerald-400">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold">Connected & Working</div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">
                          Server key active ({keyStatus.keyPreview})
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 text-xs text-amber-400">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold">Server Key Not Available</div>
                        <div className="text-[11px] text-zinc-300 mt-1 bg-amber-950/40 border border-amber-800/50 p-2 rounded-lg font-mono break-all">
                          {keyStatus.error || 'No OpenRouter API key is configured on the server.'}
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="text-[11px] text-zinc-400">Click "Check Status" to verify the server API key.</div>
                )}
              </div>

              {/* Danger Zone: Clear History */}
              <div className="pt-4 border-t border-inherit">
                <div className="text-xs font-semibold uppercase text-zinc-400 tracking-wider mb-2">
                  Data Management
                </div>
                {showClearConfirm ? (
                  <div className="p-3 rounded-xl bg-red-950/30 border border-red-800/60 space-y-2">
                    <p className="text-xs text-red-300">
                      Are you sure you want to delete all chat history? This cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          onClearAllChats();
                          setShowClearConfirm(false);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium"
                      >
                        Yes, Delete All
                      </button>
                      <button
                        onClick={() => setShowClearConfirm(false)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-700 text-zinc-200 text-xs font-medium hover:bg-zinc-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Clear all chat history
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'instructions' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-inherit">
                  Custom System Instructions
                </label>
                <p className="text-xs text-zinc-400 mb-2 leading-relaxed">
                  Provide persistent instructions you want OmniChat to remember across every conversation (e.g., your job title, preferred programming languages, or output formats).
                </p>
                <textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="e.g. I am a full-stack engineer. Always format code using clean TypeScript. When asked for explanations, be concise and provide practical examples."
                  rows={6}
                  className={`w-full p-3 rounded-xl text-xs leading-relaxed border focus:outline-hidden ${
                    isDark
                      ? 'bg-zinc-800/60 border-zinc-700 text-zinc-100 focus:ring-1 focus:ring-emerald-500'
                      : 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:ring-1 focus:ring-emerald-500'
                  }`}
                />
              </div>

              <div className="flex items-center justify-between">
                {savedSuccess && (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                    <Check className="w-4 h-4" /> Custom instructions saved!
                  </span>
                )}
                <button
                  onClick={handleSaveInstructions}
                  className="ml-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors shadow-xs"
                >
                  Save Instructions
                </button>
              </div>
            </div>
          )}

          {activeTab === 'shortcuts' && (
            <div className="space-y-2">
              <div className="text-xs text-zinc-400 mb-3">
                Keyboard shortcuts designed for quick workflow navigation:
              </div>

              {[
                { label: 'Send message', keys: ['Enter'] },
                { label: 'New line in input', keys: ['Shift', 'Enter'] },
                { label: 'New conversation', keys: ['⌘', 'O'] },
                { label: 'Toggle sidebar', keys: ['⌘', 'S'] },
                { label: 'Cancel generation', keys: ['Esc'] },
              ].map((shortcut, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between py-2 px-3 rounded-xl border ${
                    isDark ? 'bg-zinc-800/30 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                  }`}
                >
                  <span className="text-xs text-inherit">{shortcut.label}</span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((k, i) => (
                      <kbd
                        key={i}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
                          isDark
                            ? 'bg-zinc-800 border-zinc-700 text-zinc-300'
                            : 'bg-white border-zinc-300 text-zinc-700 shadow-xs'
                        }`}
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
