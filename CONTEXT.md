# LegendaEditor - Project Context

## PROJECT META
- **Name:** LegendaEditor
- **Target:** Browser (PWA-ready, offline-capable)
- **Purpose:** SRT subtitle editor with AI-powered translation/editing
- **Original Prompt:** "Um aplicação capaz de importar legendas com a extensão .srt e também sendo possível cria-las, tendo uma funcionalidade diferencial que é usar alguma IA de escolha do usuário para usar para editar ou traduzir para outros idiomas."

### Requirements (Implemented)
- [x] Import SRT files
- [x] Export SRT files
- [x] AI provider configuration panel (OpenAI, Gemini, Claude, LMStudio)
- [x] Auto-translate via AI to PT-BR, EN, ES
- [x] Diff view: original vs edited subtitles
- [x] Offline-first (IndexedDB persistence, AI only available with local providers like Ollama/LMStudio)
- [x] Good UX (dark theme, side-by-side diff, auto-save, responsive)

## TECH STACK
| Package | Version | Purpose |
|---------|---------|---------|
| react | ^19.2.5 | UI framework |
| react-dom | ^19.2.5 | DOM rendering |
| zustand | ^5.0.12 | State management |
| idb-keyval | ^6.2.2 | IndexedDB wrapper (offline persistence) |
| lucide-react | ^1.14.0 | Icon library |
| tailwindcss | 3.4.19 | CSS utility framework |
| @tailwindcss/vite | ^4.2.4 | Vite integration |
| postcss | 8.5.13 | CSS post-processing |
| autoprefixer | 10.5.0 | Vendor prefixing |
| vite | 5.4.21 | Build tool + dev server |
| typescript | ~6.0.2 | Type checking |
| @vitejs/plugin-react | 4.7.0 | React Fast Refresh |

## FILE TREE
```
src/
  types/index.ts          → Type definitions: SubtitleEntry, AIConfig, AIProvider, Language, LANGUAGE_MAP
  store/subtitleStore.ts  → Zustand store: subtitles, AI config, projects, all actions
  lib/
    srt-parser.ts         → parseSRT(content: string): SubtitleEntry[], serializeSRT(entries): string
    db.ts                 → IndexedDB CRUD: saveProject, loadProject, deleteProject, listProjects, generateProjectName
    ai-client.ts          → AI integration: translateWithAI(), testAIConnection(), provider-specific callers
    diff.ts               → computeDiff(original, edited): {original: DiffLine[], edited: DiffLine[]}
  components/
    App.tsx               → Root: renders <Layout />
    main.tsx              → Entry point: createRoot + <StrictMode><App /></StrictMode>
    index.css             → Tailwind imports + base styles (dark bg #121218, font system-ui)
    Layout.tsx            → Main layout: header (ProjectDropdown, Toolbar, AIPanel) + main (SubtitleEditor | DiffViewer)
    Toolbar.tsx           → Import/Export SRT, Add Entry, Show/Hide Diff toggle
    SubtitleEditor.tsx    → Scrollable list of SubtitleEntryRow components
    SubtitleEntry.tsx     → Single entry row: startTime, endTime, text inputs, delete button
    AIPanel.tsx           → AI settings panel: provider picker, API URL/key/model, test connection, translate button
    DiffViewer.tsx        → Side-by-side diff view with synced scrolling
    ProjectDropdown.tsx   → Project management: New, Save, Load, Delete projects
    ui/button.tsx         → Reusable Button: variants (default|outline|destructive|ghost), sizes (sm|md|lg)
```

## TYPES (src/types/index.ts)
```typescript
interface SubtitleEntry { id: string; index: number; startTime: string; endTime: string; text: string }
type AIProvider = 'openai' | 'gemini' | 'claude' | 'lmstudio'
interface AIConfig { apiUrl: string; apiKey: string; model: string; provider: AIProvider }
type Language = 'pt' | 'en' | 'es'
const LANGUAGE_MAP: Record<Language, string> = { pt: 'Brazilian Portuguese (pt-BR)', en: 'English', es: 'Español' }
```

## STATE ARCHITECTURE (src/store/subtitleStore.ts)
### Store Schema (Zustand)
```
AppState {
  subtitles: SubtitleEntry[]           // Current working subtitles
  originalSubtitles: SubtitleEntry[] | null // Snapshot before AI edit (for diff)
  aiConfig: AIConfig                   // Current AI provider config (default: Ollama localhost:11434, llama3)
  isTranslating: boolean
  showDiff: boolean
  selectedLanguage: Language
  currentProjectId: string | null
  savedProjects: ProjectSummary[]      // {id, name, updatedAt}
}
```
### Actions
- `setSubtitles(subs)`, `setOriginalSubtitles(subs)`, `updateEntry(id, field, value)`
- `addEntry()` → creates entry with crypto.randomUUID(), default times 00:00:00,000 → 00:00:02,000
- `removeEntry(id)` → filters + reindexes
- `setAIConfig(config)`, `setIsTranslating(v)`, `setShowDiff(v)`, `setSelectedLanguage(lang)`, `resetOriginal()`
- `newProject()` → creates project in IndexedDB, sets as current
- `saveProject()` → persists current subtitles to IndexedDB (auto-saved on subtitle change with 2s debounce in Layout.tsx)
- `loadProject(id)` → loads from IndexedDB, clones to originalSubtitles for diff
- `deleteProject(id)` → removes from IndexedDB, clears state if current
- `refreshProjects()` → reloads project list
- `useAIConfig()` → derived selector hook for aiConfig + setAIConfig

### Auto-save Mechanism (Layout.tsx:12-19)
```typescript
useEffect(() => {
  if (currentProjectId && subtitles.length > 0) {
    const timer = setTimeout(() => saveProject(), 2000);
    return () => clearTimeout(timer);
  }
}, [subtitles, currentProjectId]);
```

## DATA FLOW
### Import SRT
1. User clicks Import in Toolbar → file input triggers
2. FileReader reads .srt as text
3. `parseSRT()` splits by blank lines → extracts index, timestamps, text
4. `setSubtitles()` + `setOriginalSubtitles()` (clone for diff)

### Export SRT
1. User clicks Export in Toolbar
2. `serializeSRT()` maps entries to "index\nstart --> end\ntext" format
3. Creates Blob → triggers download as "subtitles.srt"

### AI Translation Pipeline
1. User clicks Translate in AIPanel
2. If no original snapshot → clones current subtitles to `originalSubtitles`
3. Iterates over all entries → calls `translateWithAI(config, text, language)` per entry
4. Updates subtitles with translated text
5. Sets `showDiff: true` to display comparison
- **Error handling:** catch per-entry, console.error, continues to next entry

### Diff Pipeline
1. `computeDiff(originalText, editedText)` → line-by-line comparison
2. Returns `{original: DiffLine[], edited: DiffLine[]}` with type: 'same' | 'added' | 'removed'
3. DiffViewer renders side-by-side with synced scroll via requestAnimationFrame

## AI PROVIDERS (src/lib/ai-client.ts)
| Provider | Endpoint | Auth Header | Request Format | Response Path |
|----------|----------|-------------|----------------|---------------|
| OpenAI Compatible | `{apiUrl}/v1/chat/completions` | `Authorization: Bearer {apiKey}` | `{model, messages: [{role,content}], temperature: 0.3}` | `data.choices[0].message.content` |
| Gemini | `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent` | `x-goog-api-key: {apiKey}` | `{systemInstruction, contents, generationConfig: {temperature: 0.3}}` | `data.candidates[0].content.parts[0].text` |
| Claude | `https://api.anthropic.com/v1/messages` | `x-api-key: {apiKey}`, `anthropic-version: 2023-06-01` | `{model, system, messages: [{role,content}], max_tokens: 1024}` | `data.content[0].text` |
| LMStudio | `{apiUrl}/api/v1/chat` | None | `{model, system_prompt, input}` | `data.output[].content` (where type='message') |

### System Prompt Template
```
You are a subtitle translator. Translate the following text to {targetLanguage}. Only return the translated text, nothing else. Preserve line breaks.
```

### Connection Test
- Each provider has a `test{Provider}()` function sending minimal "Say OK" request
- Exported: `testAIConnection(config): Promise<boolean>`

## PERSISTENCE (src/lib/db.ts)
- **Storage:** IndexedDB via idb-keyval
- **Key pattern:** `project:{uuid}`
- **Project schema:** `{id: string, name: string, subtitles: SubtitleEntry[], createdAt: number, updatedAt: number}`
- **Project naming:** `YYYY-MM-DD HH:MM LEGENDA` (via `generateProjectName()`)
- **listProjects():** iterates all keys, filters `project:*` prefix, sorts by updatedAt DESC

## CONVENTIONS
### Code Style
- TypeScript strict mode, ES modules
- Functional components with hooks, no class components
- Arrow functions for all component definitions
- ForwardRef for Button component

### Naming
- PascalCase: components, types, interfaces
- camelCase: functions, variables, actions
- kebab-case: CSS classes (Tailwind utilities)

### Styling
- Tailwind utility classes exclusively (no CSS modules, no styled-components)
- Custom color palette defined in `tailwind.config.js`:
  - `brand: #8b5cf6`, `brand-hover: #7c3aed` (purple theme)
  - `surface: #1e1e2e`, `surface-hover: #2a2a3e` (dark surfaces)
  - `border-custom: #33334d` (borders)
  - `diff-add: #1a3a2a`, `diff-del: #3a1a1a`, `diff-add-text: #4ade80`, `diff-del-text: #f87171`
- Base styles in `index.css`: bg `#121218`, color `#e2e2f0`, system-ui font

### Component Patterns
- All components export named functions
- Props interfaces defined inline or imported from types
- Zustand store accessed via `useStore()` or `useStore((s) => s.field)`
- Button component: `variant` (default|outline|destructive|ghost), `size` (sm|md|lg)

## UI COMPONENT HIERARCHY
```
App → Layout
  ├── header
  │   ├── ProjectDropdown (New/Save/Load/Delete projects)
  │   ├── Toolbar (Import/Export SRT, Add Entry, Show Diff)
  │   └── AIPanel (collapsed: settings btn + lang selector + translate btn)
  │       └── (expanded: provider config form with presets)
  └── main
      ├── SubtitleEditor (when !showDiff)
      │   └── SubtitleEntryRow × N
      └── DiffViewer (when showDiff)
          ├── Left panel: Original (synced scroll)
          └── Right panel: Edited (synced scroll)
```

## KEY IMPLEMENTATION NOTES
- SRT parsing: splits by `\r?\n\r?\n`, expects format `index\ntimestamp --> timestamp\ntext`
- Diff algorithm: naive line-by-line comparison (not LCS), sufficient for subtitle text changes
- AI translation: sequential (not parallel), processes entries one-by-one
- Project auto-save: 2s debounce on subtitle changes, only when project exists and has entries
- Offline: entire app works offline except cloud AI providers (Ollama/LMStudio work locally)
- crypto.randomUUID() used for entry IDs and project IDs