import { NextRequest, NextResponse } from 'next/server';
import { PostViewMode } from '@/lib/types';

const viewModes: PostViewMode[] = ['grid', 'column', 'list'];

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { mode?: unknown } | null;
  const mode = typeof body?.mode === 'string' && viewModes.includes(body.mode as PostViewMode)
    ? body.mode
    : 'grid';

  const response = NextResponse.json({ mode });
  response.cookies.set('fybre_post_view', mode, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });

  return response;
}
