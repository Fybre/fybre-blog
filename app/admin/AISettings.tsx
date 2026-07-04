'use client';

import { RefreshCcw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function AISettings({
  enabled,
  baseUrl,
  model,
  hasApiKey,
}: {
  enabled: boolean;
  baseUrl: string;
  model: string;
  hasApiKey: boolean;
}) {
  const [currentBaseUrl, setCurrentBaseUrl] = useState(baseUrl);
  const [currentModel, setCurrentModel] = useState(model);
  const [apiKey, setApiKey] = useState('');
  const [models, setModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  const loadModels = async () => {
    setLoadingModels(true);
    try {
      const res = await fetch('/api/admin/ai/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl: currentBaseUrl,
          apiKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load models');

      setModels(data.models || []);
      if (data.models?.length && !data.models.includes(currentModel)) {
        setCurrentModel(data.models[0]);
      }
      toast.success(`Loaded ${data.models?.length || 0} models`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load models');
    } finally {
      setLoadingModels(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)]/40 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-medium">AI writer assist</h3>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Optional OpenAI-compatible endpoint for improving drafts, summaries, titles, and tags.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input name="ai_enabled" type="checkbox" defaultChecked={enabled} className="accent-[var(--accent)]" />
          Enabled
        </label>
      </div>
      <div className="mt-4 grid gap-4">
        <label className="block text-sm text-[var(--muted)]">
          Base URL
          <input
            name="ai_base_url"
            value={currentBaseUrl}
            onChange={(event) => setCurrentBaseUrl(event.target.value)}
            className="input mt-1.5"
            placeholder="https://api.openai.com/v1"
          />
        </label>
        <label className="block text-sm text-[var(--muted)]">
          API key
          <input
            name="ai_api_key"
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            className="input mt-1.5"
            placeholder={hasApiKey ? 'Saved — leave blank to keep existing key' : 'Optional for local endpoints'}
          />
        </label>
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <label className="block text-sm text-[var(--muted)]">Model</label>
            <button type="button" onClick={loadModels} disabled={loadingModels} className="btn btn-secondary py-1.5 text-xs">
              <RefreshCcw size={13} />
              {loadingModels ? 'Loading...' : 'Load models'}
            </button>
          </div>
          {models.length > 0 ? (
            <select
              name="ai_model"
              value={currentModel}
              onChange={(event) => setCurrentModel(event.target.value)}
              className="input"
            >
              {models.map((modelId) => (
                <option key={modelId} value={modelId}>
                  {modelId}
                </option>
              ))}
            </select>
          ) : (
            <input
              name="ai_model"
              value={currentModel}
              onChange={(event) => setCurrentModel(event.target.value)}
              className="input"
              placeholder="gpt-4o-mini"
            />
          )}
          <p className="mt-1.5 text-xs text-[var(--muted)]">
            Uses the saved key if this field is blank; local servers often accept no key or a dummy key.
          </p>
        </div>
      </div>
    </div>
  );
}
