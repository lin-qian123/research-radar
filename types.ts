export interface Paper {
  id: string;
  title: string;
  authors: string[];
  summary: string;
  publishedDate: string;
  url?: string;
  journal?: string;
  impactFactor?: string; // e.g. "IF: 32.5" or "Preprint"
  citationCount?: number; // New: From Semantic Scholar
  openAccessPdf?: string; // New: Direct PDF link
  tags: string[];
  relevanceScore: number; // 1-100
  keyTakeaway: string;
  category?: string; // Optional user-defined category
  isInLibrary?: boolean; // UI flag
}

export interface UserPreferences {
  topics: string[];
  jobRole: string; // e.g., "PhD Student", "AI Researcher" - helps tailor tone
  hasOnboarded: boolean;
  searchMode: 'broad' | 'strict';
  timeRange: '24h' | 'week' | 'month';
  lastSync?: number; // Timestamp of last database update
  customCategories?: string[]; // User defined categories like "Plasma", "ML"
  language: 'en' | 'zh'; // New: UI and Content Language
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface ApiSettings {
  provider: 'gemini' | 'openai';
  apiKey: string;
  baseUrl?: string;
  modelId: string;
}