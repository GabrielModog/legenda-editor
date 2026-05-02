import type { AIConfig, Language } from '../types';
import { LANGUAGE_MAP } from '../types';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta';
const CLAUDE_URL = 'https://api.anthropic.com/v1';
const CLAUDE_VERSION = '2023-06-01';

function getSystemPrompt(targetName: string): string {
  return `You are a subtitle translator. Translate the following text to ${targetName}. Only return the translated text, nothing else. Preserve line breaks.`;
}

async function callOpenAI(config: AIConfig, text: string, targetLang: Language, signal?: AbortSignal): Promise<string> {
  const targetName = LANGUAGE_MAP[targetLang];
  const response = await fetch(`${config.apiUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: getSystemPrompt(targetName) },
        { role: 'user', content: text },
      ],
      temperature: 0.3,
    }),
    signal,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content?.trim() ?? text;
}

async function callGemini(config: AIConfig, text: string, targetLang: Language, signal?: AbortSignal): Promise<string> {
  const targetName = LANGUAGE_MAP[targetLang];
  const response = await fetch(`${GEMINI_URL}/models/${config.model}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': config.apiKey,
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: getSystemPrompt(targetName) }],
      },
      contents: [
        { parts: [{ text }] },
      ],
      generationConfig: {
        temperature: 0.3,
      },
    }),
    signal,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.candidates[0]?.content?.parts[0]?.text?.trim() ?? text;
}

async function callClaude(config: AIConfig, text: string, targetLang: Language, signal?: AbortSignal): Promise<string> {
  const targetName = LANGUAGE_MAP[targetLang];
  const response = await fetch(`${CLAUDE_URL}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': CLAUDE_VERSION,
    },
    body: JSON.stringify({
      model: config.model,
      system: getSystemPrompt(targetName),
      messages: [{ role: 'user', content: text }],
      max_tokens: 1024,
    }),
    signal,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.content[0]?.text?.trim() ?? text;
}

async function callLMStudio(config: AIConfig, text: string, targetLang: Language, signal?: AbortSignal): Promise<string> {
  const targetName = LANGUAGE_MAP[targetLang];
  const response = await fetch(`${config.apiUrl}/api/v1/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      system_prompt: getSystemPrompt(targetName),
      input: text,
    }),
    signal,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LM Studio API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  const output = data.output;
  if (Array.isArray(output)) {
    for (const item of output) {
      if (item.type === 'message' && item.content) {
        return item.content.trim();
      }
    }
  }
  return text;
}

export async function translateWithAI(
  config: AIConfig,
  text: string,
  targetLang: Language,
  signal?: AbortSignal,
): Promise<string> {
  switch (config.provider) {
    case 'gemini':
      return callGemini(config, text, targetLang, signal);
    case 'claude':
      return callClaude(config, text, targetLang, signal);
    case 'lmstudio':
      return callLMStudio(config, text, targetLang, signal);
    default:
      return callOpenAI(config, text, targetLang, signal);
  }
}

async function testOpenAI(config: AIConfig): Promise<boolean> {
  try {
    const response = await fetch(`${config.apiUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: 'Say "OK"' }],
        max_tokens: 10,
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function testGemini(config: AIConfig): Promise<boolean> {
  try {
    const response = await fetch(`${GEMINI_URL}/models/${config.model}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': config.apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Say OK' }] }],
        generationConfig: { maxOutputTokens: 10 },
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function testClaude(config: AIConfig): Promise<boolean> {
  try {
    const response = await fetch(`${CLAUDE_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': CLAUDE_VERSION,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: 'Say OK' }],
        max_tokens: 10,
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function testLMStudio(config: AIConfig): Promise<boolean> {
  try {
    const response = await fetch(`${config.apiUrl}/api/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        system_prompt: 'You are a helpful assistant.',
        input: 'Say OK',
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function testAIConnection(config: AIConfig): Promise<boolean> {
  switch (config.provider) {
    case 'gemini':
      return testGemini(config);
    case 'claude':
      return testClaude(config);
    case 'lmstudio':
      return testLMStudio(config);
    default:
      return testOpenAI(config);
  }
}
