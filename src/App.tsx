/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Conversation, ChatMessage, UserSettings, AppView } from './types';
import { Sidebar } from './components/Sidebar';
import { ChatHeader } from './components/ChatHeader';
import { ChatInput } from './components/ChatInput';
import { ChatEmptyState } from './components/ChatEmptyState';
import { MessageItem } from './components/MessageItem';
import { SettingsModal } from './components/SettingsModal';
import { ShareModal } from './components/ShareModal';
import { WebBrowserPage } from './components/WebBrowserPage';

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  customInstructions: '',
  webSearchDefault: false,
  systemTone: 'balanced',
  apiKey: '',
};

export default function App() {
  // Load settings from localStorage
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem('omnichat_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Save settings on update
  const handleUpdateSettings = (partial: Partial<UserSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...partial };
      localStorage.setItem('omnichat_settings', JSON.stringify(updated));
      return updated;
    });
  };

  // Load conversations from localStorage
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem('omnichat_conversations');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Ignore
    }
    return [];
  });

  // Active conversation ID
  const [activeId, setActiveId] = useState<string | null>(() => {
    try {
      const savedId = localStorage.getItem('omnichat_active_id');
      return savedId || null;
    } catch {
      return null;
    }
  });

  // Selected Model ID
  const [selectedModelId, setSelectedModelId] = useState<string>('gemini-3.6-flash');

  // Input & Streaming State
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [webSearch, setWebSearch] = useState(false);

  // Layout & Modals
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 768 : true;
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>('chat');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync conversations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('omnichat_conversations', JSON.stringify(conversations));
    } catch (e) {
      console.warn('Could not save conversations to localStorage:', e);
    }
  }, [conversations]);

  // Sync activeId to localStorage
  useEffect(() => {
    if (activeId) {
      localStorage.setItem('omnichat_active_id', activeId);
    } else {
      localStorage.removeItem('omnichat_active_id');
    }
  }, [activeId]);

  // Handle active conversation selection
  const currentConversation = conversations.find((c) => c.id === activeId) || null;

  // Auto-scroll on new messages or during streaming
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
  };

  useEffect(() => {
    scrollToBottom('smooth');
  }, [currentConversation?.messages.length, streamingMessageId]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command/Ctrl + O = New Chat
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        handleNewChat();
      }
      // Command/Ctrl + S = Toggle Sidebar
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
      }
      // Esc = Stop generation
      if (e.key === 'Escape' && isStreaming) {
        e.preventDefault();
        handleStopGeneration();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStreaming]);

  // Start a new chat
  const handleNewChat = () => {
    if (isStreaming) {
      handleStopGeneration();
    }
    setActiveId(null);
    setInput('');
    setCurrentView('chat');
  };

  // Select existing chat
  const handleSelectConversation = (id: string) => {
    if (isStreaming) {
      handleStopGeneration();
    }
    setActiveId(id);
    setCurrentView('chat');
    const conv = conversations.find((c) => c.id === id);
    if (conv?.modelId) {
      setSelectedModelId(conv.modelId);
    }
  };

  // Delete chat
  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) {
      setActiveId(null);
    }
  };

  // Rename chat
  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c))
    );
  };

  // Toggle pin
  const handleTogglePin = (id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c))
    );
  };

  // Clear all chats
  const handleClearAllChats = () => {
    if (isStreaming) {
      handleStopGeneration();
    }
    setConversations([]);
    setActiveId(null);
  };

  // Abort generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setStreamingMessageId(null);
  };

  // Send message
  const handleSendMessage = async (
    text: string,
    image?: { data: string; mimeType: string; name: string }
  ) => {
    if (isStreaming) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_u`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      image,
    };

    let targetConvId = activeId;
    let updatedConversations = [...conversations];

    // If starting a brand new conversation
    if (!targetConvId) {
      const titlePrompt = text.trim() || 'Image Analysis';
      const cleanTitle =
        titlePrompt.length > 40 ? titlePrompt.slice(0, 40) + '...' : titlePrompt;

      const newConv: Conversation = {
        id: `conv_${Date.now()}`,
        title: cleanTitle,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [userMessage],
        modelId: selectedModelId,
      };

      updatedConversations = [newConv, ...updatedConversations];
      targetConvId = newConv.id;
      setActiveId(targetConvId);
      setConversations(updatedConversations);
    } else {
      // Add message to existing conversation
      updatedConversations = updatedConversations.map((c) => {
        if (c.id === targetConvId) {
          return {
            ...c,
            updatedAt: Date.now(),
            messages: [...c.messages, userMessage],
          };
        }
        return c;
      });
      setConversations(updatedConversations);
    }

    // Now trigger the assistant stream
    await streamAssistantResponse(targetConvId, updatedConversations, selectedModelId);
  };

  // Stream assistant response
  const streamAssistantResponse = async (
    convId: string,
    currentConvs: Conversation[],
    modelId: string
  ) => {
    const conv = currentConvs.find((c) => c.id === convId);
    if (!conv) return;

    const assistantMsgId = `msg_${Date.now()}_a`;
    const newAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    // Append placeholder assistant message
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === convId) {
          return {
            ...c,
            updatedAt: Date.now(),
            messages: [...c.messages, newAssistantMsg],
          };
        }
        return c;
      })
    );

    setIsStreaming(true);
    setStreamingMessageId(assistantMsgId);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Clean messages array (remove any empty placeholders)
      const cleanMessages = conv.messages.filter(
        (m) => (m.content && m.content.trim().length > 0) || (m.image && m.image.data)
      );

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          messages: cleanMessages,
          modelId,
          apiKey: settings.apiKey,
          customInstructions: settings.customInstructions,
          webSearch,
          tone: settings.systemTone,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || `Server responded with status ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No readable response body received.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;

          const dataPayload = trimmed.replace(/^data:\s*/, '');
          if (dataPayload === '[DONE]') {
            break;
          }

          try {
            const parsed = JSON.parse(dataPayload);
            if (parsed.error) {
              throw new Error(parsed.error);
            }
            if (parsed.text) {
              setConversations((prev) =>
                prev.map((c) => {
                  if (c.id === convId) {
                    const lastIdx = c.messages.length - 1;
                    if (lastIdx >= 0 && c.messages[lastIdx].id === assistantMsgId) {
                      const updatedMessages = [...c.messages];
                      updatedMessages[lastIdx] = {
                        ...updatedMessages[lastIdx],
                        content: updatedMessages[lastIdx].content + parsed.text,
                      };
                      return { ...c, messages: updatedMessages };
                    }
                  }
                  return c;
                })
              );
            }
          } catch (jsonErr: any) {
            if (jsonErr.message && jsonErr.message !== 'Unexpected end of JSON input') {
              console.warn('Chunk parse notice:', jsonErr);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream generation aborted by user.');
      } else {
        console.error('Chat stream failed:', err);
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === convId) {
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        content:
                          m.content ||
                          (err.message?.startsWith('{')
                            ? (JSON.parse(err.message)?.error ?? err.message)
                            : err.message) ||
                          'Sorry, I ran into an issue generating a response. Please check your connection or API configuration.',
                        error: true,
                      }
                    : m
                ),
              };
            }
            return c;
          })
        );
      }
    } finally {
      setIsStreaming(false);
      setStreamingMessageId(null);
      abortControllerRef.current = null;
    }
  };

  // Regenerate last assistant response
  const handleRegenerate = async (targetMsgId: string) => {
    if (!currentConversation || isStreaming) return;

    const messages = currentConversation.messages;
    const targetIdx = messages.findIndex((m) => m.id === targetMsgId);
    if (targetIdx === -1) return;

    // Prune up to the preceding user message
    const trimmedMessages = messages.slice(0, targetIdx);
    const updatedConv = {
      ...currentConversation,
      messages: trimmedMessages,
    };

    const newConvs = conversations.map((c) => (c.id === currentConversation.id ? updatedConv : c));
    setConversations(newConvs);

    await streamAssistantResponse(currentConversation.id, newConvs, selectedModelId);
  };

  // Edit previous prompt
  const handleEditPrompt = async (targetUserMsgId: string, newContent: string) => {
    if (!currentConversation || isStreaming) return;

    const messages = currentConversation.messages;
    const targetIdx = messages.findIndex((m) => m.id === targetUserMsgId);
    if (targetIdx === -1) return;

    const editedUserMsg: ChatMessage = {
      ...messages[targetIdx],
      content: newContent,
      timestamp: Date.now(),
    };

    // Keep up to target message and replace it
    const trimmed = [...messages.slice(0, targetIdx), editedUserMsg];
    const updatedConv = {
      ...currentConversation,
      messages: trimmed,
    };

    const newConvs = conversations.map((c) => (c.id === currentConversation.id ? updatedConv : c));
    setConversations(newConvs);

    await streamAssistantResponse(currentConversation.id, newConvs, selectedModelId);
  };

  const isDark = settings.theme === 'dark';

  return (
    <div className={`flex h-screen w-screen overflow-hidden ${isDark ? 'bg-[#212121] text-zinc-100' : 'bg-white text-zinc-900'}`}>
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onTogglePin={handleTogglePin}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        currentView={currentView}
        onSwitchView={setCurrentView}
      />

      {/* Main Content Area: Chat or Web Browser */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header */}
        <ChatHeader
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          selectedModelId={selectedModelId}
          onSelectModel={setSelectedModelId}
          onNewChat={handleNewChat}
          onOpenShare={() => setIsShareOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          isDark={isDark}
          currentView={currentView}
          onSwitchView={setCurrentView}
        />

        {currentView === 'browser' ? (
          <WebBrowserPage
            isDark={isDark}
            onSendToChat={(prompt) => {
              setCurrentView('chat');
              handleNewChat();
              setInput(prompt);
              handleSendMessage(prompt);
            }}
          />
        ) : (
          <>
            {/* Message Thread or Empty Welcome State */}
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto scrollbar-thin flex flex-col"
            >
              {!currentConversation || currentConversation.messages.length === 0 ? (
                <ChatEmptyState
                  onSelectPrompt={(prompt) => {
                    setInput(prompt);
                    handleSendMessage(prompt);
                  }}
                  isDark={isDark}
                />
              ) : (
                <div className="flex-1 pb-4">
                  {currentConversation.messages.map((msg) => (
                    <MessageItem
                      key={msg.id}
                      message={msg}
                      isStreamingThis={isStreaming && streamingMessageId === msg.id}
                      onRegenerate={
                        msg.role === 'assistant' ? () => handleRegenerate(msg.id) : undefined
                      }
                      onEditPrompt={
                        msg.role === 'user' ? (newText) => handleEditPrompt(msg.id, newText) : undefined
                      }
                      isDark={isDark}
                    />
                  ))}
                  <div ref={messagesEndRef} className="h-4" />
                </div>
              )}
            </div>

            {/* Bottom Input Section */}
            <ChatInput
              input={input}
              setInput={setInput}
              onSend={handleSendMessage}
              isStreaming={isStreaming}
              onStop={handleStopGeneration}
              webSearch={webSearch}
              setWebSearch={setWebSearch}
              isDark={isDark}
            />
          </>
        )}
      </div>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleUpdateSettings}
        onClearAllChats={handleClearAllChats}
        isDark={isDark}
      />

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        conversation={currentConversation}
        isDark={isDark}
      />
    </div>
  );
}
