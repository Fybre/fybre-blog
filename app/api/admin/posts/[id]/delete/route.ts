import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { deletePost } from '@/lib/posts';

function isAllowedRedirect(path: string) {
  return path === '/' || path === '/admin' || path.startsWith('/admin/') || path.startsWith('/admin?');
}

function redirectTo(path: string) {
  return new Response(null, {
    status: 303,
    headers: { Location: path },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return redirectTo('/login');
  }

  const { id } = await params;

  let returnPath = '/admin';
  try {
    const formData = await req.formData();
    const rt = formData.get('redirectTo');
    if (typeof rt === 'string' && isAllowedRedirect(rt)) {
      returnPath = rt;
    }
  } catch {}

  deletePost(parseInt(id, 10));

  return redirectTo(returnPath);
}
