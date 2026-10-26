import React, { useState, useRef, useEffect } from 'react';
import {
  Globe,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Home,
  Lock,
  ExternalLink,
  BookOpen,
  Sparkles,
  Search,
  X,
  FileText,
  MessageSquare,
  Send,
  Loader2,
  ChevronRight,
  Compass,
} from 'lucide-react';
import { ExtractedWebPage } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface WebBrowserPageProps {
  isDark: boolean;
  onSendToChat?: (initialPrompt: string) => void;
}

const POPULAR_BOOKMARKS = [
  {
    name: 'Wikipedia',
    url: 'https://en.wikipedia.org/wiki/Main_Page',
    desc: 'The free encyclopedia with millions of articles',
    iconColor: 'bg-zinc-700 text-white',
    category: 'Knowledge',
  },
  {
    name: 'Hacker News',
    url: 'https://news.ycombinator.com',
    desc: 'Technology, startups, computer science discussions',
    iconColor: 'bg-amber-600 text-white',
    category: 'Tech News',
  },
  {
    name: 'TechCrunch',
    url: 'https://techcrunch.com',
    desc: 'Startup ecosystem, tech investments and innovations',
    iconColor: 'bg-emerald-600 text-white',
    category: 'Tech News',
  },
  {
    name: 'BBC News',
    url: 'https://www.bbc.com/news',
    desc: 'Global news, world reporting and breaking stories',
    iconColor: 'bg-red-700 text-white',
    category: 'News',
  },
  {
    name: 'GitHub Trending',
    url: 'https://github.com/trending',
    desc: 'Explore popular open source repositories',
    iconColor: 'bg-zinc-800 text-white',
    category: 'Developer',
  },
  {
    name: 'NPR News',
    url: 'https://www.npr.org',
    desc: 'Independent journalism, culture, and podcast stories',
    iconColor: 'bg-blue-600 text-white',
    category: 'News',
  },
];

export const WebBrowserPage: React.FC<WebBrowserPageProps> = ({ isDark, onSendToChat }) => {
  const [inputUrl, setInputUrl] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'live' | 'reader'>('live');

  // Extracted webpage data for reader & AI companion
  const [extractedData, setExtractedData] = useState<ExtractedWebPage | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  // Side-by-side AI Companion state
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponses, setAiResponses] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  const [isAiStreaming, setIsAiStreaming] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Listen for navigation messages from the proxy inside the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OMNICHAT_NAVIGATE' && event.data.url) {
        const navigatedUrl = event.data.url;
        setCurrentUrl(navigatedUrl);
        setInputUrl(navigatedUrl);
        // Add to history stack
        setHistory((prev) => {
          const next = prev.slice(0, historyIndex + 1);
          next.push(navigatedUrl);
          return next;
        });
        setHistoryIndex((prev) => prev + 1);
        fetchExtractedData(navigatedUrl);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [historyIndex]);

  // Navigate to a URL
  const navigateTo = (rawUrl: string) => {
    let target = rawUrl.trim();
    if (!target) return;

    if (!/^https?:\/\//i.test(target)) {
      // If it looks like a domain or search query
      if (target.includes('.') && !target.includes(' ')) {
        target = 'https://' + target;
      } else {
        // Fallback to searching on DuckDuckGo
        target = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(target)}`;
      }
    }

    setIsLoading(true);
    setCurrentUrl(target);
    setInputUrl(target);

    // Update history
    setHistory((prev) => {
      const next = prev.slice(0, historyIndex + 1);
      next.push(target);
      return next;
    });
    setHistoryIndex((prev) => prev + 1);

    // Fetch readable content in background
    fetchExtractedData(target);
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      const prevUrl = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setCurrentUrl(prevUrl);
      setInputUrl(prevUrl);
      setIsLoading(true);
      fetchExtractedData(prevUrl);
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      const nextUrl = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setCurrentUrl(nextUrl);
      setInputUrl(nextUrl);
      setIsLoading(true);
      fetchExtractedData(nextUrl);
    }
  };

  const handleReload = () => {
    if (currentUrl) {
      setIsLoading(true);
      if (iframeRef.current) {
        iframeRef.current.src = `/api/proxy/browse?url=${encodeURIComponent(currentUrl)}&t=${Date.now()}`;
      }
      fetchExtractedData(currentUrl);
    }
  };

  const handleHome = () => {
    setCurrentUrl('');
    setInputUrl('');
    setExtractedData(null);
  };

  const fetchExtractedData = async (url: string) => {
    setIsExtracting(true);
    try {
      const res = await fetch(`/api/proxy/extract?url=${encodeURIComponent(url)}`);
      if (res.ok) {
        const data = await res.json();
        setExtractedData(data);
      }
    } catch (err) {
      console.warn('Could not extract text:', err);
    } finally {
      setIsExtracting(false);
    }
  };

  // AI companion prompt
  const handleAskAi = async (promptText?: string) => {
    const question = promptText || aiQuery.trim();
    if (!question || !currentUrl) return;

    const userEntry = { role: 'user' as const, text: question };
    const assistantEntry = { role: 'assistant' as const, text: '' };

    setAiResponses((prev) => [...prev, userEntry, assistantEntry]);
    setAiQuery('');
    setIsAiStreaming(true);

    try {
      // Build conversation with page context
      const pageContext = extractedData?.content
        ? `Page Title: ${extractedData.title}\nPage URL: ${currentUrl}\n\nPage Text Excerpt:\n${extractedData.content.slice(0, 10000)}`
        : `Page URL: ${currentUrl}`;

      const systemPrompt = `You are OmniChat browsing companion. The user is currently reading the webpage: ${currentUrl}.
Answer the user's questions accurately based on the webpage content provided below. If the page content doesn't specify, state so.
Webpage Content:
${pageContext}`;

      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: question }],
          modelId: 'gemini-3.6-flash',
          systemInstruction: systemPrompt,
        }),
      });

      if (!res.ok) throw new Error('AI query failed');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (reader) {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const dataStr = trimmed.replace(/^data:\s*/, '');
            if (dataStr === '[DONE]') break;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                setAiResponses((prev) => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
                    updated[lastIdx] = {
                      ...updated[lastIdx],
                      text: updated[lastIdx].text + parsed.text,
                    };
                  }
                  return updated;
                });
              }
            } catch {}
          }
        }
      }
    } catch (err: any) {
      setAiResponses((prev) => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (lastIdx >= 0) {
          updated[lastIdx] = {
            ...updated[lastIdx],
            text: 'Could not generate answer for this page. Please try again.',
          };
        }
        return updated;
      });
    } finally {
      setIsAiStreaming(false);
    }
  };

  const proxyUrl = currentUrl ? `/api/proxy/browse?url=${encodeURIComponent(currentUrl)}` : '';

  return (
    <div className={`flex flex-col h-full w-full overflow-hidden select-none ${isDark ? 'bg-[#18181b] text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}>
      {/* Browser Top Navigation Bar */}
      <div
        className={`px-3 py-2.5 border-b flex items-center gap-2 select-none shrink-0 ${
          isDark ? 'bg-[#212121] border-zinc-800' : 'bg-white border-zinc-200'
        }`}
      >
        {/* Navigation Buttons: Back, Forward, Reload, Home */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleBack}
            disabled={historyIndex <= 0}
            className={`p-1.5 rounded-lg transition-colors ${
              historyIndex > 0
                ? isDark
                  ? 'text-zinc-200 hover:bg-zinc-700/60'
                  : 'text-zinc-700 hover:bg-zinc-200'
                : 'text-zinc-600 opacity-40 cursor-not-allowed'
            }`}
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <button
            onClick={handleForward}
            disabled={historyIndex >= history.length - 1}
            className={`p-1.5 rounded-lg transition-colors ${
              historyIndex < history.length - 1
                ? isDark
                  ? 'text-zinc-200 hover:bg-zinc-700/60'
                  : 'text-zinc-700 hover:bg-zinc-200'
                : 'text-zinc-600 opacity-40 cursor-not-allowed'
            }`}
            title="Go forward"
          >
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleReload}
            disabled={!currentUrl}
            className={`p-1.5 rounded-lg transition-colors ${
              currentUrl
                ? isDark
                  ? 'text-zinc-200 hover:bg-zinc-700/60'
                  : 'text-zinc-700 hover:bg-zinc-200'
                : 'text-zinc-600 opacity-40 cursor-not-allowed'
            }`}
            title="Reload webpage"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          <button
            onClick={handleHome}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/60' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
            }`}
            title="Browser home & bookmarks"
          >
            <Home className="w-4 h-4" />
          </button>
        </div>

        {/* Address / URL Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigateTo(inputUrl);
          }}
          className="flex-1 max-w-3xl flex items-center relative"
        >
          <div className="absolute left-3 flex items-center gap-1.5 pointer-events-none text-zinc-400">
            {currentUrl ? (
              <Lock className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Globe className="w-3.5 h-3.5 text-zinc-400" />
            )}
          </div>

          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Enter any website URL (e.g. wikipedia.org or news.ycombinator.com)..."
            className={`w-full pl-9 pr-20 py-2 rounded-xl text-xs sm:text-sm font-mono tracking-tight transition-all border focus:outline-hidden ${
              isDark
                ? 'bg-[#18181b] border-zinc-700/80 text-zinc-100 placeholder-zinc-500 focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/50'
                : 'bg-zinc-100 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:bg-white focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/50'
            }`}
          />

          <div className="absolute right-2 flex items-center gap-1">
            {inputUrl && (
              <button
                type="button"
                onClick={() => setInputUrl('')}
                className="p-1 text-zinc-400 hover:text-zinc-200"
                title="Clear URL"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            <button
              type="submit"
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium font-sans shadow-xs transition-colors"
            >
              Go
            </button>
          </div>
        </form>

        {/* Right Tools: View Mode Toggle, AI Companion Toggle, External Link */}
        <div className="flex items-center gap-1.5">
          {currentUrl && (
            <div className={`flex rounded-lg p-0.5 border ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-100 border-zinc-300'}`}>
              <button
                onClick={() => setViewMode('live')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'live'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-inherit'
                }`}
                title="Interactive Web View"
              >
                Live View
              </button>
              <button
                onClick={() => setViewMode('reader')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                  viewMode === 'reader'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-inherit'
                }`}
                title="Distraction-free Reader Mode"
              >
                <BookOpen className="w-3 h-3" />
                <span className="hidden sm:inline">Reader</span>
              </button>
            </div>
          )}

          {/* AI Page Companion Toggle */}
          {currentUrl && (
            <button
              onClick={() => setIsAiPanelOpen(!isAiPanelOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                isAiPanelOpen
                  ? 'bg-purple-600 text-white border-purple-500 shadow-xs'
                  : isDark
                  ? 'bg-zinc-800 hover:bg-zinc-700 text-purple-400 border-zinc-700'
                  : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
              }`}
              title="Chat with this webpage using AI"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AI Companion</span>
            </button>
          )}

          {/* Open in new tab fallback */}
          {currentUrl && (
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
              }`}
              title="Open external website in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* If no URL is active, show the Browser Launchpad & Bookmarks */}
        {!currentUrl ? (
          <div className="flex-1 overflow-y-auto p-6 sm:p-10 flex flex-col items-center justify-center max-w-4xl mx-auto w-full text-center">
            <div className="w-16 h-16 rounded-3xl bg-linear-to-tr from-emerald-600 via-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-xl shadow-teal-500/10 mb-4 ring-4 ring-emerald-500/20">
              <Globe className="w-8 h-8" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
              In-App Web Browser
            </h1>
            <p className={`text-sm max-w-lg mx-auto mb-8 leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Enter any link above to browse websites directly inside OmniChat. Links and pages stay in this app so you never get taken away.
            </p>

            {/* Quick URL Input on Launchpad */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                navigateTo(inputUrl);
              }}
              className="w-full max-w-xl mb-10 flex gap-2"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-400" />
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="Paste any link (e.g. en.wikipedia.org or techcrunch.com)..."
                  className={`w-full pl-10 pr-4 py-3 rounded-2xl text-sm border focus:outline-hidden transition-all ${
                    isDark
                      ? 'bg-zinc-800/80 border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:border-emerald-500'
                      : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 shadow-sm'
                  }`}
                />
              </div>
              <button
                type="submit"
                className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors shadow-md"
              >
                Browse Now
              </button>
            </form>

            {/* Popular Launch Bookmarks */}
            <div className="w-full text-left">
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                Featured Websites & Bookmarks
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {POPULAR_BOOKMARKS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => navigateTo(item.url)}
                    className={`p-3.5 rounded-2xl border text-left transition-all duration-200 group flex items-start gap-3 ${
                      isDark
                        ? 'bg-zinc-800/40 hover:bg-zinc-800 border-zinc-700/60 hover:border-zinc-600'
                        : 'bg-white hover:bg-zinc-50 border-zinc-200 hover:border-zinc-300 shadow-xs'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${item.iconColor}`}>
                      {item.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm truncate group-hover:text-emerald-400 transition-colors">
                        {item.name}
                      </div>
                      <div className={`text-xs truncate ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        {item.desc}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Webpage Loaded Content */
          <div className="flex-1 flex overflow-hidden relative">
            {/* Live Web View via Proxy */}
            {viewMode === 'live' ? (
              <div className="flex-1 w-full h-full relative bg-white">
                {isLoading && (
                  <div className="absolute inset-0 z-10 bg-zinc-900/60 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-zinc-200">
                    <Loader2 className="w-7 h-7 text-emerald-400 animate-spin" />
                    <span className="text-xs font-medium">Loading {currentUrl}...</span>
                  </div>
                )}
                <iframe
                  ref={iframeRef}
                  src={proxyUrl}
                  title="Web Browser"
                  onLoad={() => setIsLoading(false)}
                  className="w-full h-full border-none"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                />
              </div>
            ) : (
              /* Reader Mode Clean Text View */
              <div className="flex-1 overflow-y-auto p-6 sm:p-12 max-w-3xl mx-auto">
                {isExtracting ? (
                  <div className="py-20 text-center flex flex-col items-center justify-center gap-3 text-zinc-400">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                    <span className="text-sm">Extracting reader content...</span>
                  </div>
                ) : extractedData ? (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div>
                      <div className="text-xs text-emerald-400 font-mono uppercase tracking-wider mb-1">
                        Reader Mode • {extractedData.wordCount} words
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                        {extractedData.title}
                      </h1>
                      <div className="text-xs text-zinc-400 mt-1 truncate">
                        {extractedData.url}
                      </div>
                    </div>

                    {extractedData.description && (
                      <div className={`p-4 rounded-xl border text-sm italic ${isDark ? 'bg-zinc-800/60 border-zinc-700/80 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-700'}`}>
                        {extractedData.description}
                      </div>
                    )}

                    {/* Quick AI Prompts Bar */}
                    <div className="flex flex-wrap gap-2 pt-2 pb-4 border-b border-inherit">
                      <button
                        onClick={() => {
                          setIsAiPanelOpen(true);
                          handleAskAi('Summarize this article in 5 bullet points with key takeaways.');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Summarize Page
                      </button>
                      <button
                        onClick={() => {
                          setIsAiPanelOpen(true);
                          handleAskAi('What are the main arguments and conclusions presented on this page?');
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors border ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700' : 'bg-zinc-100 border-zinc-300 text-zinc-800 hover:bg-zinc-200'
                        }`}
                      >
                        Extract Key Arguments
                      </button>
                      {onSendToChat && (
                        <button
                          onClick={() => {
                            onSendToChat(`Here is an article I am reading: "${extractedData.title}" (${extractedData.url})\n\nContent:\n${extractedData.content.slice(0, 3000)}\n\nPlease provide an in-depth analysis of this topic.`);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors border ${
                            isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700' : 'bg-zinc-100 border-zinc-300 text-zinc-800 hover:bg-zinc-200'
                          }`}
                        >
                          Send to Full Chat
                        </button>
                      )}
                    </div>

                    {/* Article Content */}
                    <div className="text-[15px] leading-relaxed whitespace-pre-wrap select-text font-serif">
                      {extractedData.content}
                    </div>
                  </div>
                ) : (
                  <div className="py-20 text-center text-zinc-400">
                    Could not parse text for this page. Switch to <strong>Live View</strong> to see the original website.
                  </div>
                )}
              </div>
            )}

            {/* Split Screen AI Companion Panel */}
            {isAiPanelOpen && (
              <div
                className={`w-80 sm:w-96 border-l flex flex-col h-full shrink-0 z-20 shadow-2xl transition-all animate-in slide-in-from-right duration-200 ${
                  isDark ? 'bg-[#1c1c1f] border-zinc-800' : 'bg-white border-zinc-200'
                }`}
              >
                {/* Header */}
                <div className="p-3 border-b border-inherit flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold">AI Page Assistant</div>
                      <div className="text-[10px] text-zinc-400 truncate max-w-[180px]">
                        {extractedData?.title || currentUrl}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsAiPanelOpen(false)}
                    className="p-1 rounded-md text-zinc-400 hover:text-zinc-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Conversation Body */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin text-xs">
                  {aiResponses.length === 0 ? (
                    <div className="py-8 text-center space-y-3">
                      <div className="text-zinc-400 text-xs">
                        Ask questions about the website you're viewing:
                      </div>
                      <div className="space-y-1.5 text-left">
                        {[
                          'Summarize this page in 3 sentences',
                          'What is the key takeaway?',
                          'Extract the author, dates, and entities',
                          'Explain this like I am 5 years old',
                        ].map((prompt, i) => (
                          <button
                            key={i}
                            onClick={() => handleAskAi(prompt)}
                            className={`w-full text-left p-2 rounded-lg border transition-colors ${
                              isDark
                                ? 'bg-zinc-800/40 hover:bg-zinc-800 border-zinc-700/60 text-zinc-300'
                                : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-800'
                            }`}
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    aiResponses.map((res, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-xl ${
                          res.role === 'user'
                            ? isDark
                              ? 'bg-zinc-800 text-zinc-100 ml-4'
                              : 'bg-zinc-200 text-zinc-900 ml-4'
                            : isDark
                            ? 'bg-[#26262a] text-zinc-200 mr-2 border border-zinc-700/50'
                            : 'bg-purple-50/80 text-zinc-900 mr-2 border border-purple-100'
                        }`}
                      >
                        <div className="font-semibold text-[10px] uppercase text-zinc-400 mb-1">
                          {res.role === 'user' ? 'You' : 'OmniChat AI'}
                        </div>
                        {res.role === 'user' ? (
                          <div className="text-xs leading-relaxed">{res.text}</div>
                        ) : (
                          <MarkdownRenderer content={res.text} isDark={isDark} />
                        )}
                      </div>
                    ))
                  )}
                  {isAiStreaming && (
                    <div className="flex items-center gap-1.5 text-xs text-purple-400 p-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Analyzing webpage...</span>
                    </div>
                  )}
                </div>

                {/* Question Input */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAskAi();
                  }}
                  className="p-3 border-t border-inherit flex gap-2"
                >
                  <input
                    type="text"
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    placeholder="Ask about this page..."
                    className={`flex-1 px-3 py-2 rounded-xl text-xs border focus:outline-hidden ${
                      isDark
                        ? 'bg-zinc-800 border-zinc-700 text-zinc-100 focus:border-purple-500'
                        : 'bg-zinc-100 border-zinc-300 text-zinc-900 focus:border-purple-500'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={!aiQuery.trim() || isAiStreaming}
                    className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50 transition-colors shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
