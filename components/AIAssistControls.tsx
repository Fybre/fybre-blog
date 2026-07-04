'use client';

import { Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type AITask = 'improve' | 'summary' | 'tags' | 'title';

interface AIAssistControlsProps {
  title: string;
  content: string;
  tags: string;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onTagsChange: (tags: string) => void;
}

function parseTags(tags: string) {
  return tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export default function AIAssistControls({
  title,
  content,
  tags,
  onTitleChange,
  onContentChange,
  onTagsChange,
}: AIAssistControlsProps) {
  const [runningTask, setRunningTask] = useState<AITask | null>(null);
  const [summary, setSummary] = useState('');
  const [configLoading, setConfigLoading] = useState(true);
  const [aiReady, setAiReady] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/admin/settings');
        if (!res.ok) {
          setAiReady(false);
          return;
        }

        const data = await res.json();
        setAiReady(Boolean(data.ai_ready));
      } finally {
        setConfigLoading(false);
      }
    }

    loadSettings();
  }, []);

  const runTask = async (task: AITask) => {
    setRunningTask(task);
    try {
      const res = await fetch('/api/admin/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task,
          title,
          content,
          tags: parseTags(tags),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI request failed');

      if (task === 'improve') {
        if (typeof data.result !== 'string') throw new Error('AI returned an invalid draft');
        if (window.confirm('Replace the current post body with the improved draft?')) {
          onContentChange(data.result);
          toast.success('Draft improved');
        }
      }

      if (task === 'summary') {
        if (typeof data.result !== 'string') throw new Error('AI returned an invalid summary');
        setSummary(data.result);
        await navigator.clipboard?.writeText(data.result).catch(() => undefined);
        toast.success('Summary generated and copied');
      }

      if (task === 'tags') {
        if (!Array.isArray(data.result)) throw new Error('AI returned invalid tags');
        onTagsChange(data.result.join(', '));
        toast.success('Tags suggested');
      }

      if (task === 'title') {
        if (typeof data.result !== 'string') throw new Error('AI returned an invalid title');
        onTitleChange(data.result.replace(/^["']|["']$/g, ''));
        toast.success('Title suggested');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'AI request failed');
    } finally {
      setRunningTask(null);
    }
  };

  const disabled = Boolean(runningTask) || configLoading || !aiReady;

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/55 p-4">
      <div className="mb-3">
        <h2 className="flex items-center gap-2 font-medium">
          <Sparkles size={16} />
          AI assist
        </h2>
        <p className="mt-1 text-xs text-[var(--muted)]">
          {aiReady
            ? 'Uses the OpenAI-compatible endpoint configured in Admin.'
            : 'Configure and enable AI in Admin to use writing assist.'}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => runTask('improve')} disabled={disabled} className="btn btn-secondary">
          {runningTask === 'improve' ? 'Improving...' : 'Improve draft'}
        </button>
        <button type="button" onClick={() => runTask('summary')} disabled={disabled} className="btn btn-secondary">
          {runningTask === 'summary' ? 'Summarizing...' : 'Summarize'}
        </button>
        <button type="button" onClick={() => runTask('title')} disabled={disabled} className="btn btn-secondary">
          {runningTask === 'title' ? 'Thinking...' : 'Suggest title'}
        </button>
        <button type="button" onClick={() => runTask('tags')} disabled={disabled} className="btn btn-secondary">
          {runningTask === 'tags' ? 'Tagging...' : 'Suggest tags'}
        </button>
      </div>
      {summary && (
        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg)]/45 p-3 text-sm text-[var(--muted)]">
          {summary}
        </div>
      )}
    </section>
  );
}
