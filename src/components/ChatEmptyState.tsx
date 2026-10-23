import React from 'react';
import {
  Sparkles,
  Code,
  Compass,
  Lightbulb,
  PenTool,
  BookOpen,
  HelpCircle,
} from 'lucide-react';

interface ChatEmptyStateProps {
  onSelectPrompt: (promptText: string) => void;
  isDark: boolean;
}

const STARTER_PROMPTS = [
  {
    icon: <Code className="w-4 h-4 text-emerald-400" />,
    title: 'Code an interactive dashboard',
    prompt: 'Write a modern React component with TypeScript and Tailwind CSS for an interactive analytics dashboard with charts and summary statistics.',
    category: 'Coding',
  },
  {
    icon: <Lightbulb className="w-4 h-4 text-amber-400" />,
    title: 'Brainstorm startup ideas',
    prompt: 'Brainstorm 5 innovative micro-SaaS startup ideas for 2026 leveraging agentic AI, including target audience and monetization models.',
    category: 'Idea Generation',
  },
  {
    icon: <PenTool className="w-4 h-4 text-purple-400" />,
    title: 'Draft a compelling proposal',
    prompt: 'Help me draft a concise, high-converting partnership proposal email to a potential design client highlighting quick turnaround and measurable ROI.',
    category: 'Writing',
  },
  {
    icon: <BookOpen className="w-4 h-4 text-blue-400" />,
    title: 'Explain quantum computing simply',
    prompt: 'Explain the core principles of quantum computing (superposition and entanglement) using intuitive everyday analogies for someone with no physics background.',
    category: 'Learning',
  },
];

export const ChatEmptyState: React.FC<ChatEmptyStateProps> = ({ onSelectPrompt, isDark }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-3xl mx-auto w-full text-center select-none animate-in fade-in duration-300">
      {/* Central Icon */}
      <div className="mb-4 relative">
        <div className="w-16 h-16 rounded-3xl bg-linear-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 ring-4 ring-emerald-500/10">
          <Sparkles className="w-8 h-8" />
        </div>
      </div>

      {/* Greeting Title */}
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
        What can I help with today?
      </h1>
      <p className={`text-sm max-w-md mx-auto mb-8 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
        Ask questions, brainstorm creative ideas, analyze code and images, or craft polished documents.
      </p>

      {/* Suggestion Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
        {STARTER_PROMPTS.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onSelectPrompt(item.prompt)}
            className={`p-4 rounded-2xl border text-left transition-all duration-200 group ${
              isDark
                ? 'bg-zinc-800/40 hover:bg-zinc-800/90 border-zinc-700/60 hover:border-zinc-600 hover:shadow-lg hover:shadow-black/20'
                : 'bg-zinc-50 hover:bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-md'
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div className="p-1.5 rounded-lg bg-zinc-700/30 group-hover:bg-emerald-500/20 transition-colors">
                {item.icon}
              </div>
              <span className="text-xs font-semibold text-zinc-400 group-hover:text-emerald-400 transition-colors">
                {item.category}
              </span>
            </div>
            <div className="font-semibold text-sm mb-1 text-inherit group-hover:text-emerald-400 transition-colors">
              {item.title}
            </div>
            <div className={`text-xs line-clamp-2 leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {item.prompt}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
