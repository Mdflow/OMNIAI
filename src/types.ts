export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  image?: {
    data: string; // base64 or object url
    mimeType: string;
    name: string;
  };
  error?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  modelId: string;
  pinned?: boolean;
}

export interface ModelOption {
  id: string;
  displayName: string;
  description: string;
  badge?: string;
  contextLimit: string;
  supportsVision: boolean;
}

export interface UserSettings {
  theme: 'dark' | 'light';
  customInstructions: string;
  webSearchDefault: boolean;
  systemTone: 'balanced' | 'concise' | 'detailed' | 'academic' | 'casual';
}

export interface ExtractedWebPage {
  url: string;
  title: string;
  description: string;
  favicon?: string;
  content: string;
  wordCount: number;
}

export type AppView = 'chat' | 'browser';
