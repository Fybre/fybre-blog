import { getSetting } from './db';
import { stripHtml } from './utils';

export type AITask = 'improve' | 'summary' | 'tags' | 'title';

interface AIRequest {
  task: AITask;
  title: string;
  content: string;
  tags: string[];
}

const taskPrompts: Record<AITask, string> = {
  improve:
    'Improve the draft for clarity, grammar, flow, and readability. Preserve the meaning and return only a clean HTML fragment suitable for a TipTap editor. Do not wrap it in markdown fences.',
  summary:
    'Write one concise plain-text summary/excerpt for this blog post. Return only the summary, no labels.',
  tags:
    'Suggest 3 to 7 concise tags for this blog post. Return only a JSON array of strings.',
  title:
    'Suggest one strong, concise title for this blog post. Return only the title, no quotes.',
};

function endpointFor(baseUrl: string) {
  const clean = baseUrl.trim().replace(/\/+$/, '');
  return `${clean}/chat/completions`;
}

function modelsEndpointFor(baseUrl: string) {
  const clean = baseUrl.trim().replace(/\/+$/, '');
  return `${clean}/models`;
}

function authHeaders(apiKey: string): Record<string, string> {
  return apiKey.trim() ? { Authorization: `Bearer ${apiKey.trim()}` } : {};
}

export function getAISettings() {
  return {
    enabled: getSetting('ai_enabled') === 'true',
    baseUrl: getSetting('ai_base_url') || '',
    model: getSetting('ai_model') || '',
    apiKey: getSetting('ai_api_key') || '',
  };
}

function parseTags(text: string): string[] {
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed.filter((tag): tag is string => typeof tag === 'string').map((tag) => tag.trim()).filter(Boolean);
    }
  } catch {}

  return text
    .replace(/^[\s"'`[]+|[\s"'`\]]+$/g, '')
    .split(',')
    .map((tag) => tag.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean);
}

export async function runAITask(request: AIRequest) {
  const settings = getAISettings();
  if (!settings.enabled) throw new Error('AI is not enabled');
  if (!settings.baseUrl.trim()) throw new Error('AI base URL is not configured');
  if (!settings.model.trim()) throw new Error('AI model is not configured');

  const plainText = stripHtml(request.content).slice(0, 12000);
  const existingTags = request.tags.length > 0 ? request.tags.join(', ') : 'none';

  const response = await fetch(endpointFor(settings.baseUrl), {
    method: 'POST',
    headers: {
      ...authHeaders(settings.apiKey),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: settings.model.trim(),
      temperature: request.task === 'tags' ? 0.2 : 0.4,
      messages: [
        {
          role: 'system',
          content:
            'You are a careful writing assistant for a personal blog CMS. Be concise, preserve the author voice, and avoid inventing facts.',
        },
        {
          role: 'user',
          content: [
            taskPrompts[request.task],
            '',
            `Current title: ${request.title || 'Untitled'}`,
            `Existing tags: ${existingTags}`,
            '',
            'HTML content:',
            request.content.slice(0, 30000),
            '',
            'Plain text content:',
            plainText,
          ].join('\n'),
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(errorText || `AI request failed with HTTP ${response.status}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('AI returned an empty response');

  if (request.task === 'tags') {
    return { result: parseTags(text).slice(0, 7) };
  }

  return { result: text };
}

export async function listAIModels(input?: { baseUrl?: string; apiKey?: string }) {
  const settings = getAISettings();
  const baseUrl = input?.baseUrl?.trim() || settings.baseUrl;
  const apiKey = input?.apiKey?.trim() || settings.apiKey;
  if (!baseUrl.trim()) throw new Error('AI base URL is not configured');

  const response = await fetch(modelsEndpointFor(baseUrl), {
    headers: {
      ...authHeaders(apiKey),
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(errorText || `Model list request failed with HTTP ${response.status}`);
  }

  const data = (await response.json()) as {
    data?: Array<{ id?: unknown; object?: unknown }>;
  };

  return (data.data || [])
    .map((model) => (typeof model.id === 'string' ? model.id : ''))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}
