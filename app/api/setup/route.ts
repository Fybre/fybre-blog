import { NextRequest, NextResponse } from 'next/server';
import { hasUsers, createUser } from '@/lib/auth';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '';
}

export async function POST(req: NextRequest) {
  try {
    if (await hasUsers()) {
      return NextResponse.json({ error: 'Setup already completed' }, { status: 400 });
    }

    const { username, password } = await req.json();

    if (!username || typeof username !== 'string' || username.length < 2) {
      return NextResponse.json({ error: 'Username must be at least 2 characters' }, { status: 400 });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    await createUser(username.trim(), password);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (getErrorMessage(error).includes('UNIQUE')) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
