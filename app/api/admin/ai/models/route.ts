import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { listAIModels } from '@/lib/ai';

interface ModelRequestBody {
  baseUrl?: unknown;
  apiKey?: unknown;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = (await req.json().catch(() => ({}))) as ModelRequestBody;
    const models = await listAIModels({
      baseUrl: typeof body.baseUrl === 'string' ? body.baseUrl : undefined,
      apiKey: typeof body.apiKey === 'string' ? body.apiKey : undefined,
    });

    return NextResponse.json({ models });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load models' },
      { status: 400 }
    );
  }
}
