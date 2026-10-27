import React from 'react';
import {
  Sparkles,
  Zap,
  Eye,
  Search,
  MessageSquare,
  Share2,
  ArrowRight,
} from 'lucide-react';

interface LandingPageProps {
  isDark: boolean;
  onLaunchChat: () => void;
}

const FEATURES = [
  {
    icon: <Zap className="w-5 h-5" />,
    title: 'Real-time Streaming',
    description: 'Watch responses stream in instantly as the model generates them — no waiting for the full answer.',
  },
  {
    icon: <Eye className="w-5 h-5" />,
    title: 'Multimodal Vision',
    description: 'Upload images and ask questions about them. OmniChat understands what it sees.',
  },
  {
    icon: <Search className="w-5 h-5" />,
    title: 'Web Search',
    description: 'Toggle live web search to get up-to-date answers with real sources.',
  },
  {
    icon: <MessageSquare className="w-5 h-5" />,
    title: 'Smart Conversations',
    description: 'Manage, pin, rename, and revisit conversations. Your history stays in your browser.',
  },
  {
    icon: <Share2 className="w-5 h-5" />,
    title: 'Share Chats',
    description: 'Export any conversation as a shareable link or markdown file in one click.',
  },
  {
    icon: <Sparkles className="w-5 h-5" />,
    title: 'Multiple Modes',
    description: 'Switch between balanced, creative, coding, and thinking personas on the fly.',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({ isDark, onLaunchChat }) => {
  return (
    <div
      className={`min-h-screen overflow-y-auto ${
        isDark
          ? 'bg-[#212121] text-zinc-100'
          : 'bg-white text-zinc-900'
      }`}
    >
      {/* Nav */}
      <nav className="sticky top-0 z-20 backdrop-blur-xl bg-[#212121]/80 border-b border-zinc-800/60">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">OmniChat</span>
          </div>
          <button
            onClick={onLaunchChat}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold transition-colors flex items-center gap-1.5"
          >
            Launch Chat <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-emerald-500/15 blur-[120px] rounded-full" />
        </div>

        <div className="relative max-w-4xl mx-auto px-5 sm:px-8 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-medium mb-7">
            <Sparkles className="w-3.5 h-3.5" />
            Powered by advanced AI
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] mb-5">
            Your intelligent
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              AI companion
            </span>
          </h1>

          <p className={`text-base sm:text-lg max-w-xl mx-auto mb-9 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Ask anything, brainstorm ideas, analyze images, write code, and explore the web —
            all in one beautifully simple interface.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={onLaunchChat}
              className="px-7 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-base transition-all hover:shadow-xl hover:shadow-emerald-500/25 flex items-center gap-2"
            >
              Start Chatting <ArrowRight className="w-5 h-5" />
            </button>
            <a
              href="#features"
              className="px-7 py-3.5 rounded-2xl border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/50 text-zinc-200 font-medium text-base transition-colors"
            >
              Explore Features
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-5xl mx-auto px-5 sm:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            Everything you need
          </h2>
          <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            A full-featured chat experience inspired by the best AI tools.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-2xl border transition-all duration-200 ${
                isDark
                  ? 'bg-zinc-800/40 border-zinc-700/60 hover:border-zinc-600 hover:bg-zinc-800/80'
                  : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300 hover:bg-white'
              }`}
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="font-semibold text-base mb-1.5">{f.title}</h3>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-5 sm:px-8 pb-20">
        <div className="relative rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-zinc-800/30 to-transparent p-10 sm:p-14 text-center overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-emerald-500/15 blur-[100px] rounded-full pointer-events-none" />
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              Ready to dive in?
            </h2>
            <p className={`text-sm mb-7 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              No signup required. Just open the chat and start asking.
            </p>
            <button
              onClick={onLaunchChat}
              className="px-7 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-base transition-all hover:shadow-xl hover:shadow-emerald-500/25 inline-flex items-center gap-2"
            >
              Launch OmniChat <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/60">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold">OmniChat</span>
          </div>
          <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
            Built with advanced AI technology.
          </p>
        </div>
      </footer>
    </div>
  );
};
