import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { deletePost } from '@/lib/posts';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const { id } = await params;

  let redirectTo = '/admin';
  try {
    const formData = await req.formData();
    const rt = formData.get('redirectTo');
    if (typeof rt === 'string' && (rt === '/' || rt.startsWith('/admin') || rt === '/')) {
      redirectTo = rt;
    }
  } catch {}

  deletePost(parseInt(id, 10));

  return NextResponse.redirect(new URL(redirectTo, req.url));
}
