import { useEffect, useState } from 'react';
import { Settings, Loader2, Check, X, Languages } from 'lucide-react';
import { Button } from './ui/button';
import { useStore } from '../store/subtitleStore';
import { translateWithAI, testAIConnection } from '../lib/ai-client';
import type { Language, AIProvider } from '../types';
import { LANGUAGE_MAP } from '../types';
import { useTranslation } from '../i18n';

interface Preset {
  label: string;
  labelKey: string;
  provider: AIProvider;
  url: string;
  key: string;
  model: string;
}

const PRESETS: Preset[] = [
  { label: 'Ollama (Local)', labelKey: 'ai.preset.ollama', provider: 'openai', url: 'http://localhost:11434', key: '', model: 'llama3' },
  { label: 'OpenAI', labelKey: 'ai.preset.openai', provider: 'openai', url: 'https://api.openai.com', key: 'sk-...', model: 'gpt-4' },
  { label: 'LM Studio', labelKey: 'ai.preset.lmstudio', provider: 'lmstudio', url: 'http://localhost:1234', key: '', model: 'qwen/qwen3.5-9b' },
  { label: 'Gemini', labelKey: 'ai.preset.gemini', provider: 'gemini', url: 'https://generativelanguage.googleapis.com', key: '...', model: 'gemini-flash-latest' },
  { label: 'Claude', labelKey: 'ai.preset.claude', provider: 'claude', url: 'https://api.anthropic.com', key: '...', model: 'claude-sonnet-4-6' },
];

export function AIPanel() {
  const [open, setOpen] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);
  const { aiConfig, setAIConfig, isTranslating, setIsTranslating, subtitles, selectedLanguage, setSelectedLanguage, setOriginalSubtitles, setShowDiff } = useStore();
  const { t } = useTranslation();

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
  const apiKeyHint = localConfig.provider === 'gemini' || localConfig.provider === 'claude' || localConfig.provider === 'openai'
    ? t('ai.config.apiKeyHint.cloud')
    : t('ai.config.apiKeyHint.local');

  if (!open) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border-custom bg-surface/50">
        <Button variant="outline" onClick={() => setOpen(true)}>
          <Settings size={16} /> {t('ai.settings')}
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
          {t('ai.translate')}
        </Button>
      </div>
    );
  }

  return (
    <div className="border-b border-border-custom bg-surface px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">{t('ai.config.title')}</h3>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>{t('ai.config.close')}</Button>
      </div>
      <div className="grid gap-3 max-w-lg">
        <div>
          <label className="block text-xs text-gray-400 mb-1">{t('ai.config.provider')}</label>
          <div className="flex gap-2 flex-wrap">
            {(
              [
                { value: 'openai', labelKey: 'ai.provider.openai' },
                { value: 'lmstudio', labelKey: 'ai.provider.lmstudio' },
                { value: 'gemini', labelKey: 'ai.provider.gemini' },
                { value: 'claude', labelKey: 'ai.provider.claude' },
              ] as { value: AIProvider; labelKey: string }[]
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
                {t(p.labelKey)}
              </button>
            ))}
          </div>
        </div>
        {!isFixedUrl && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('ai.config.apiUrl')}</label>
            <input
              type="text"
              value={localConfig.apiUrl}
              onChange={(e) => setLocalConfig({ ...localConfig, apiUrl: e.target.value })}
              className="w-full rounded border border-border-custom bg-transparent px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
              placeholder="http://localhost:11434"
            />
            <p className="text-xs text-gray-500 mt-1">{t('ai.config.apiUrlHint')}</p>
          </div>
        )}
        {isFixedUrl && (
          <div className="p-2 rounded bg-surface-hover border border-border-custom">
            <p className="text-xs text-gray-400">
              {t('ai.config.endpoint')} <span className="text-gray-300 font-mono">{localConfig.apiUrl}</span>
            </p>
          </div>
        )}
        <div>
          <label className="block text-xs text-gray-400 mb-1">{t('ai.config.apiKey')}</label>
          <input
            type="password"
            value={localConfig.apiKey}
            onChange={(e) => setLocalConfig({ ...localConfig, apiKey: e.target.value })}
            className="w-full rounded border border-border-custom bg-transparent px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
            placeholder={t('ai.config.apiKeyPlaceholder')}
          />
          <p className="text-xs text-gray-500 mt-1">{apiKeyHint}</p>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">{t('ai.config.model')}</label>
          <input
            type="text"
            value={localConfig.model}
            onChange={(e) => setLocalConfig({ ...localConfig, model: e.target.value })}
            className="w-full rounded border border-border-custom bg-transparent px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
            placeholder={t('ai.config.modelPlaceholder')}
          />
        </div>
        <div className="flex gap-2 items-center">
          <Button onClick={handleSave}>{t('ai.config.save')}</Button>
          <Button variant="outline" onClick={handleTest} disabled={testing}>
            {testing ? <Loader2 size={14} className="animate-spin" /> : testResult === true ? <Check size={14} className="text-green-400" /> : testResult === false ? <X size={14} className="text-red-400" /> : t('ai.config.test')}
          </Button>
        </div>
        {testResult !== null && (
          <p className={`text-sm ${testResult ? 'text-green-400' : 'text-red-400'}`}>
            {testResult ? t('ai.config.testSuccess') : t('ai.config.testFailed')}
          </p>
        )}
        <div className="mt-2 p-3 rounded bg-surface-hover border border-border-custom">
          <p className="text-xs text-gray-400">
            <strong>{t('ai.config.presets')}</strong>
          </p>
          <div className="flex gap-2 mt-1 flex-wrap">
            {PRESETS.map((preset) => (
              <button
                key={preset.labelKey}
                type="button"
                onClick={() => setLocalConfig({
                  provider: preset.provider,
                  apiUrl: preset.url,
                  apiKey: preset.key,
                  model: preset.model,
                })}
                className="text-xs px-2 py-1 rounded border border-border-custom hover:bg-surface-hover transition-colors"
              >
                {t(preset.labelKey)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}