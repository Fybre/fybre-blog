import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { db } from './db';
import bcrypt from 'bcryptjs';

const insecureFallbackSecret = 'change-this-in-production-use-env-var';
const jwtSecretValue = process.env.JWT_SECRET;

if (!jwtSecretValue) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'JWT_SECRET environment variable must be set in production. Refusing to start with an insecure default.'
    );
  }
  console.warn('[auth] JWT_SECRET is not set — using an insecure default for local development only.');
}

const JWT_SECRET = new TextEncoder().encode(jwtSecretValue || insecureFallbackSecret);

export interface SessionUser {
  id: number;
  username: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(user: SessionUser): Promise<string> {
  const token = await new SignJWT({ id: user.id, username: user.username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET);
  return token;
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (typeof payload.id !== 'number' || typeof payload.username !== 'string') {
      return null;
    }
    return { id: payload.id, username: payload.username };
  } catch {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

export function getUserByUsername(username: string) {
  return db
    .prepare('SELECT * FROM users WHERE lower(username) = lower(?)')
    .get(username.trim()) as { id: number; username: string; password_hash: string } | undefined;
}

export async function createUser(username: string, password: string) {
  const hash = await hashPassword(password);
  const result = db
    .prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')
    .run(username, hash);
  return { id: result.lastInsertRowid as number, username };
}

export async function hasUsers(): Promise<boolean> {
  const row = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  return row.count > 0;
}
