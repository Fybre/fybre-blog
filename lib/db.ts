import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.join(/*turbopackIgnore: true*/ process.cwd(), 'data');
const uploadsDir = path.join(/*turbopackIgnore: true*/ process.cwd(), 'public', 'uploads');
const attachmentsDir = path.join(/*turbopackIgnore: true*/ dataDir, 'attachments');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(attachmentsDir)) {
  fs.mkdirSync(attachmentsDir, { recursive: true });
}

const dbPath = path.join(/*turbopackIgnore: true*/ dataDir, 'blog.db');
const db = new Database(dbPath);

db.pragma('journal_mode = DELETE'); // Use DELETE instead of WAL to prevent hangs on Docker Mac volume mounts
db.pragma('foreign_keys = ON');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    is_public INTEGER NOT NULL DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS post_tags (
    post_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (post_id, tag_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS post_attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    stored_name TEXT UNIQUE NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
  );
`);

// Ensure some defaults
const getSetting = (key: string): string | null => {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row?.value ?? null;
};

const setSetting = (key: string, value: string) => {
  db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  ).run(key, value);
};

// Seed default settings if not present
if (!getSetting('default_visibility')) {
  setSetting('default_visibility', 'public');
}
if (!getSetting('theme')) {
  setSetting('theme', 'system');
}
if (!getSetting('typography')) {
  setSetting('typography', 'system');
}
if (!getSetting('site_title')) {
  setSetting('site_title', 'Fybre Blog');
}
if (!getSetting('hero_title')) {
  setSetting('hero_title', 'The Notebook');
}
if (!getSetting('hero_subtitle')) {
  setSetting('hero_subtitle', 'Thoughts, notes, and stories exploring technology, design, and life.');
}
if (!getSetting('new_post_button_text')) {
  setSetting('new_post_button_text', 'Write a story');
}
if (getSetting('ai_enabled') === null) {
  setSetting('ai_enabled', 'false');
}
if (getSetting('ai_base_url') === null) {
  setSetting('ai_base_url', 'https://api.openai.com/v1');
}
if (getSetting('ai_model') === null) {
  setSetting('ai_model', 'gpt-4o-mini');
}
if (getSetting('ai_api_key') === null) {
  setSetting('ai_api_key', '');
}
if (getSetting('profile_links') === null) {
  const migratedLinks = [
    { title: 'GitHub', url: getSetting('social_github') || '' },
    { title: 'LinkedIn', url: getSetting('social_linkedin') || '' },
    { title: 'Mastodon', url: getSetting('social_mastodon') || '' },
    { title: 'Bluesky', url: getSetting('social_bluesky') || '' },
    { title: 'Website', url: getSetting('social_website') || '' },
  ].filter((link) => link.url.trim());

  setSetting('profile_links', JSON.stringify(migratedLinks));
}
if (!getSetting('social_github')) {
  setSetting('social_github', '');
}
if (!getSetting('social_linkedin')) {
  setSetting('social_linkedin', '');
}
if (!getSetting('social_mastodon')) {
  setSetting('social_mastodon', '');
}
if (!getSetting('social_bluesky')) {
  setSetting('social_bluesky', '');
}
if (!getSetting('social_website')) {
  setSetting('social_website', '');
}

export { db, getSetting, setSetting, uploadsDir, attachmentsDir };
