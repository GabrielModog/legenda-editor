export interface SubtitleEntry {
  id: string;
  index: number;
  startTime: string;
  endTime: string;
  text: string;
}

export type AIProvider = 'openai' | 'gemini' | 'claude' | 'lmstudio';

export interface AIConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
  provider: AIProvider;
}

export type Language = 'pt' | 'en' | 'es';

export const LANGUAGE_MAP: Record<Language, string> = {
  pt: 'Brazilian Portuguese (pt-BR)',
  en: 'English',
  es: 'Español',
};
