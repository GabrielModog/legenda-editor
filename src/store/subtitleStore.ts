import { create } from 'zustand';
import type { SubtitleEntry, AIConfig, Language } from '../types';
import { saveProject, loadProject, deleteProject, listProjects, generateProjectName } from '../lib/db';

interface ProjectSummary {
  id: string;
  name: string;
  updatedAt: number;
}

interface AppState {
  subtitles: SubtitleEntry[];
  originalSubtitles: SubtitleEntry[] | null;
  aiConfig: AIConfig;
  isTranslating: boolean;
  showDiff: boolean;
  selectedLanguage: Language;
  currentProjectId: string | null;
  savedProjects: ProjectSummary[];

  setSubtitles: (subs: SubtitleEntry[]) => void;
  setOriginalSubtitles: (subs: SubtitleEntry[] | null) => void;
  updateEntry: (id: string, field: keyof SubtitleEntry, value: string) => void;
  addEntry: () => void;
  removeEntry: (id: string) => void;
  setAIConfig: (config: AIConfig) => void;
  setIsTranslating: (v: boolean) => void;
  setShowDiff: (v: boolean) => void;
  setSelectedLanguage: (lang: Language) => void;
  resetOriginal: () => void;

  newProject: () => void;
  saveProject: () => Promise<void>;
  loadProject: (id: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  refreshProjects: () => Promise<void>;
  setCurrentProjectId: (id: string | null) => void;
}

const DEFAULT_AI: AIConfig = {
  apiUrl: 'http://localhost:11434',
  apiKey: '',
  model: 'llama3',
  provider: 'openai',
};

export const useStore = create<AppState>((set, get) => ({
  subtitles: [],
  originalSubtitles: null,
  aiConfig: DEFAULT_AI,
  isTranslating: false,
  showDiff: false,
  selectedLanguage: 'en',
  currentProjectId: null,
  savedProjects: [],

  setSubtitles: (subs) => set({ subtitles: subs }),
  setOriginalSubtitles: (subs) => set({ originalSubtitles: subs }),
  updateEntry: (id, field, value) =>
    set((state) => ({
      subtitles: state.subtitles.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    })),
  addEntry: () =>
    set((state) => {
      const newEntry: SubtitleEntry = {
        id: crypto.randomUUID(),
        index: state.subtitles.length + 1,
        startTime: '00:00:00,000',
        endTime: '00:00:02,000',
        text: '',
      };
      return { subtitles: [...state.subtitles, newEntry] };
    }),
  removeEntry: (id) =>
    set((state) => ({
      subtitles: state.subtitles
        .filter((e) => e.id !== id)
        .map((e, i) => ({ ...e, index: i + 1 })),
    })),
  setAIConfig: (config) => set({ aiConfig: config }),
  setIsTranslating: (v) => set({ isTranslating: v }),
  setShowDiff: (v) => set({ showDiff: v }),
  setSelectedLanguage: (lang) => set({ selectedLanguage: lang }),
  resetOriginal: () => set({ originalSubtitles: null }),

  newProject: () => {
    const id = crypto.randomUUID();
    const name = generateProjectName();
    set({
      currentProjectId: id,
      subtitles: [],
      originalSubtitles: null,
      showDiff: false,
    });
    saveProject({
      id,
      name,
      subtitles: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }).then(() => get().refreshProjects());
  },

  saveProject: async () => {
    const state = get();
    if (!state.currentProjectId) {
      get().newProject();
      return;
    }
    const existing = await loadProject(state.currentProjectId);
    await saveProject({
      id: state.currentProjectId,
      name: existing?.name ?? generateProjectName(),
      subtitles: state.subtitles,
      createdAt: existing?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    });
    await get().refreshProjects();
  },

  loadProject: async (id: string) => {
    const project = await loadProject(id);
    if (project) {
      set({
        currentProjectId: id,
        subtitles: project.subtitles,
        originalSubtitles: project.subtitles.map((s) => ({ ...s })),
        showDiff: false,
      });
    }
  },

  deleteProject: async (id: string) => {
    await deleteProject(id);
    const state = get();
    if (state.currentProjectId === id) {
      set({
        currentProjectId: null,
        subtitles: [],
        originalSubtitles: null,
        showDiff: false,
      });
    }
    await get().refreshProjects();
  },

  refreshProjects: async () => {
    const projects = await listProjects();
    set({ savedProjects: projects });
  },

  setCurrentProjectId: (id: string | null) => set({ currentProjectId: id }),
}));

export const useAIConfig = () => {
  const aiConfig = useStore((s) => s.aiConfig);
  const setAIConfig = useStore((s) => s.setAIConfig);
  return { aiConfig, setAIConfig };
};
