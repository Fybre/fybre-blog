import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { AITask, runAITask } from '@/lib/ai';

const tasks: AITask[] = ['improve', 'summary', 'tags', 'title'];

interface AIRequestBody {
  task?: unknown;
  title?: unknown;
  content?: unknown;
  tags?: unknown;
}

function parseTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((tag): tag is string => typeof tag === 'string')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = (await req.json()) as AIRequestBody;
    if (typeof body.task !== 'string' || !tasks.includes(body.task as AITask)) {
      return NextResponse.json({ error: 'Unknown AI task' }, { status: 400 });
    }

    const result = await runAITask({
      task: body.task as AITask,
      title: typeof body.title === 'string' ? body.title : '',
      content: typeof body.content === 'string' ? body.content : '',
      tags: parseTags(body.tags),
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI request failed' },
      { status: 400 }
    );
  }
}
