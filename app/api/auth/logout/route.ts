import { NextResponse } from 'next/server';
import { deleteSession } from '@/lib/auth';

export async function POST() {
  await deleteSession();
  const res = NextResponse.json({ success: true });
  res.cookies.delete('session');
  return res;
}
