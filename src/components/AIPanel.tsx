import { useEffect, useState } from 'react';
import { Settings, Loader2, Check, X, Languages } from 'lucide-react';
import { Button } from './ui/button';
import { useStore } from '../store/subtitleStore';
import { translateWithAI, testAIConnection } from '../lib/ai-client';
import type { Language, AIProvider } from '../types';
import { LANGUAGE_MAP } from '../types';

interface Preset {
  label: string;
  provider: AIProvider;
  url: string;
  key: string;
  model: string;
}

const PRESETS: Preset[] = [
  { label: 'Ollama (Local)', provider: 'openai', url: 'http://localhost:11434', key: '', model: 'llama3' },
  { label: 'OpenAI', provider: 'openai', url: 'https://api.openai.com', key: 'sk-...', model: 'gpt-4' },
  { label: 'LM Studio', provider: 'lmstudio', url: 'http://localhost:1234', key: '', model: 'qwen/qwen3.5-9b' },
  { label: 'Gemini', provider: 'gemini', url: 'https://generativelanguage.googleapis.com', key: '...', model: 'gemini-flash-latest' },
  { label: 'Claude', provider: 'claude', url: 'https://api.anthropic.com', key: '...', model: 'claude-sonnet-4-6' },
];

export function AIPanel() {
  const [open, setOpen] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);
  const { aiConfig, setAIConfig, isTranslating, setIsTranslating, subtitles, selectedLanguage, setSelectedLanguage, setOriginalSubtitles, setShowDiff } = useStore();

  const [localConfig, setLocalConfig] = useState(aiConfig);

  useEffect(() => {
    setLocalConfig(aiConfig);
  }, [aiConfig]);

  const handleSave = () => {
    setAIConfig(localConfig);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testAIConnection(localConfig);
    setTestResult(result);
    setTesting(false);
  };

  const handleTranslate = async () => {
    if (!subtitles.length) return;
    if (!useStore.getState().originalSubtitles) {
      setOriginalSubtitles(subtitles.map((s) => ({ ...s })));
    }
    setShowDiff(false);
    setIsTranslating(true);

    const updated = [...subtitles];
    for (let i = 0; i < updated.length; i++) {
      if (!updated[i].text.trim()) continue;
      try {
        const translated = await translateWithAI(localConfig, updated[i].text, selectedLanguage);
        updated[i] = { ...updated[i], text: translated };
      } catch (err) {
        console.error(`Failed to translate entry ${i + 1}:`, err);
      }
    }

    useStore.getState().setSubtitles(updated);
    setIsTranslating(false);
    setShowDiff(true);
  };

  const isFixedUrl = localConfig.provider === 'gemini' || localConfig.provider === 'claude';

  if (!open) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border-custom bg-surface/50">
        <Button variant="outline" onClick={() => setOpen(true)}>
          <Settings size={16} /> AI Settings
        </Button>
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value as Language)}
          className="rounded border border-border-custom bg-transparent px-2 py-1.5 text-sm focus:border-brand focus:outline-none"
        >
          {Object.entries(LANGUAGE_MAP).map(([code, name]) => (
            <option key={code} value={code} className="bg-surface">{name}</option>
          ))}
        </select>
        <Button onClick={handleTranslate} disabled={isTranslating || !subtitles.length}>
          {isTranslating ? <Loader2 size={16} className="animate-spin" /> : <Languages size={16} />}
          Translate
        </Button>
      </div>
    );
  }

  return (
    <div className="border-b border-border-custom bg-surface px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">AI Provider Configuration</h3>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Close</Button>
      </div>
      <div className="grid gap-3 max-w-lg">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Provider</label>
          <div className="flex gap-2 flex-wrap">
            {(
              [
                { value: 'openai', label: 'OpenAI Compatible' },
                { value: 'lmstudio', label: 'LM Studio' },
                { value: 'gemini', label: 'Gemini' },
                { value: 'claude', label: 'Claude' },
              ] as { value: AIProvider; label: string }[]
            ).map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => {
                  const preset = PRESETS.find((pr) => pr.provider === p.value);
                  setLocalConfig({
                    ...localConfig,
                    provider: p.value,
                    apiUrl: preset?.url ?? localConfig.apiUrl,
                    model: preset?.model ?? localConfig.model,
                  });
                }}
                className={`text-xs px-3 py-1.5 rounded border transition-colors ${
                  localConfig.provider === p.value
                    ? 'bg-brand border-brand text-white'
                    : 'border-border-custom hover:bg-surface-hover'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        {!isFixedUrl && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">API Base URL</label>
            <input
              type="text"
              value={localConfig.apiUrl}
              onChange={(e) => setLocalConfig({ ...localConfig, apiUrl: e.target.value })}
              className="w-full rounded border border-border-custom bg-transparent px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
              placeholder="http://localhost:11434"
            />
            <p className="text-xs text-gray-500 mt-1">For local LLMs like Ollama use: http://localhost:11434</p>
          </div>
        )}
        {isFixedUrl && (
          <div className="p-2 rounded bg-surface-hover border border-border-custom">
            <p className="text-xs text-gray-400">
              Endpoint: <span className="text-gray-300 font-mono">{localConfig.apiUrl}</span>
            </p>
          </div>
        )}
        <div>
          <label className="block text-xs text-gray-400 mb-1">API Key</label>
          <input
            type="password"
            value={localConfig.apiKey}
            onChange={(e) => setLocalConfig({ ...localConfig, apiKey: e.target.value })}
            className="w-full rounded border border-border-custom bg-transparent px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
            placeholder="your-api-key"
          />
          <p className="text-xs text-gray-500 mt-1">
            {localConfig.provider === 'openai' ? 'Leave empty for local providers' : 'Get your key from the provider console'}
          </p>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Model Name</label>
          <input
            type="text"
            value={localConfig.model}
            onChange={(e) => setLocalConfig({ ...localConfig, model: e.target.value })}
            className="w-full rounded border border-border-custom bg-transparent px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
            placeholder="llama3, gpt-4, gemini-2.0-flash, claude-sonnet-4-6"
          />
        </div>
        <div className="flex gap-2 items-center">
          <Button onClick={handleSave}>Save Config</Button>
          <Button variant="outline" onClick={handleTest} disabled={testing}>
            {testing ? <Loader2 size={14} className="animate-spin" /> : testResult === true ? <Check size={14} className="text-green-400" /> : testResult === false ? <X size={14} className="text-red-400" /> : 'Test Connection'}
          </Button>
        </div>
        {testResult !== null && (
          <p className={`text-sm ${testResult ? 'text-green-400' : 'text-red-400'}`}>
            {testResult ? 'Connection successful!' : 'Connection failed. Check your settings.'}
          </p>
        )}
        <div className="mt-2 p-3 rounded bg-surface-hover border border-border-custom">
          <p className="text-xs text-gray-400">
            <strong>Quick Presets:</strong>
          </p>
          <div className="flex gap-2 mt-1 flex-wrap">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setLocalConfig({
                  provider: preset.provider,
                  apiUrl: preset.url,
                  apiKey: preset.key,
                  model: preset.model,
                })}
                className="text-xs px-2 py-1 rounded border border-border-custom hover:bg-surface-hover transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
