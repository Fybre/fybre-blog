import { db } from './db';
import { Post, PostSortMode, PostWithTags } from './types';
import { slugify } from './utils';
import { deleteAttachmentsForPost } from './attachments';

function getOrderBy(sort: PostSortMode = 'newest', prefix = '') {
  const column = (name: string) => `${prefix}${name}`;
  switch (sort) {
    case 'oldest':
      return `${column('created_at')} ASC`;
    case 'title':
      return `LOWER(${column('title')}) ASC, ${column('created_at')} DESC`;
    case 'updated':
      return `${column('updated_at')} DESC`;
    case 'newest':
    default:
      return `${column('created_at')} DESC`;
  }
}

export function getAllPosts(includePrivate = false, sort: PostSortMode = 'newest'): PostWithTags[] {
  const where = includePrivate ? '' : 'WHERE is_public = 1';
  const posts = db
    .prepare(
      `SELECT id, title, slug, content, is_public, created_at, updated_at 
       FROM posts ${where} ORDER BY ${getOrderBy(sort)}`
    )
    .all() as Post[];

  return posts.map((post) => ({
    ...post,
    tags: getTagsForPost(post.id),
  }));
}

export function getPostBySlug(slug: string, includePrivate = false): PostWithTags | null {
  const post = db
    .prepare(
      `SELECT id, title, slug, content, is_public, created_at, updated_at 
       FROM posts WHERE slug = ? ${includePrivate ? '' : 'AND is_public = 1'}`
    )
    .get(slug) as Post | undefined;

  if (!post) return null;

  return {
    ...post,
    tags: getTagsForPost(post.id),
  };
}

export function getPostById(id: number): PostWithTags | null {
  const post = db
    .prepare(
      'SELECT id, title, slug, content, is_public, created_at, updated_at FROM posts WHERE id = ?'
    )
    .get(id) as Post | undefined;

  if (!post) return null;

  return {
    ...post,
    tags: getTagsForPost(post.id),
  };
}

export function searchPosts(query: string, tag?: string, includePrivate = false, sort: PostSortMode = 'newest'): PostWithTags[] {
  let sql = `
    SELECT DISTINCT p.id, p.title, p.slug, p.content, p.is_public, p.created_at, p.updated_at
    FROM posts p
    LEFT JOIN post_tags pt ON p.id = pt.post_id
    LEFT JOIN tags t ON pt.tag_id = t.id
    WHERE 1=1
  `;
  const params: string[] = [];

  if (!includePrivate) {
    sql += ' AND p.is_public = 1';
  }

  if (query.trim()) {
    const q = `%${query.trim().toLowerCase()}%`;
    sql += ' AND (LOWER(p.title) LIKE ? OR LOWER(p.content) LIKE ?)';
    params.push(q, q);
  }

  if (tag) {
    sql += ' AND LOWER(t.name) = ?';
    params.push(tag.toLowerCase());
  }

  sql += ` ORDER BY ${getOrderBy(sort, 'p.')}`;

  const posts = db.prepare(sql).all(...params) as Post[];

  return posts.map((post) => ({
    ...post,
    tags: getTagsForPost(post.id),
  }));
}

export function getAllTags(): string[] {
  const rows = db.prepare('SELECT name FROM tags ORDER BY name').all() as { name: string }[];
  return rows.map((r) => r.name);
}

export function getTagsWithCounts(includePrivate = true): Array<{ name: string; count: number }> {
  const visibilityClause = includePrivate ? '' : 'WHERE p.is_public = 1';
  return db
    .prepare(
      `SELECT t.name, COUNT(pt.post_id) as count
       FROM tags t
       LEFT JOIN post_tags pt ON t.id = pt.tag_id
       LEFT JOIN posts p ON p.id = pt.post_id
       ${visibilityClause}
       GROUP BY t.id, t.name
       ORDER BY LOWER(t.name)`
    )
    .all() as Array<{ name: string; count: number }>;
}

export function renameTag(oldName: string, newName: string) {
  const oldClean = oldName.trim();
  const newClean = newName.trim();
  if (!oldClean || !newClean) throw new Error('Tag name is required');
  if (oldClean.toLowerCase() === newClean.toLowerCase()) return;

  const oldTag = db.prepare('SELECT id FROM tags WHERE lower(name) = lower(?)').get(oldClean) as { id: number } | undefined;
  if (!oldTag) throw new Error('Tag not found');

  const existing = db.prepare('SELECT id FROM tags WHERE lower(name) = lower(?)').get(newClean) as { id: number } | undefined;
  if (existing) {
    db.prepare('UPDATE OR IGNORE post_tags SET tag_id = ? WHERE tag_id = ?').run(existing.id, oldTag.id);
    db.prepare('DELETE FROM post_tags WHERE tag_id = ?').run(oldTag.id);
    db.prepare('DELETE FROM tags WHERE id = ?').run(oldTag.id);
    return;
  }

  db.prepare('UPDATE tags SET name = ? WHERE id = ?').run(newClean, oldTag.id);
}

export function deleteTag(name: string) {
  const clean = name.trim();
  if (!clean) return;
  const tag = db.prepare('SELECT id FROM tags WHERE lower(name) = lower(?)').get(clean) as { id: number } | undefined;
  if (!tag) return;
  db.prepare('DELETE FROM post_tags WHERE tag_id = ?').run(tag.id);
  db.prepare('DELETE FROM tags WHERE id = ?').run(tag.id);
}

function getTagsForPost(postId: number): string[] {
  const rows = db
    .prepare(
      `SELECT t.name FROM tags t 
       JOIN post_tags pt ON t.id = pt.tag_id 
       WHERE pt.post_id = ? ORDER BY t.name`
    )
    .all(postId) as { name: string }[];
  return rows.map((r) => r.name);
}

export function createPost(data: {
  title: string;
  content: string;
  is_public: boolean;
  tags: string[];
}) {
  const slugBase = slugify(data.title);
  let slug = slugBase;
  let counter = 1;

  // Ensure unique slug
  while (db.prepare('SELECT id FROM posts WHERE slug = ?').get(slug)) {
    slug = `${slugBase}-${counter++}`;
  }

  const result = db
    .prepare(
      `INSERT INTO posts (title, slug, content, is_public, updated_at) 
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`
    )
    .run(data.title, slug, data.content, data.is_public ? 1 : 0);

  const postId = result.lastInsertRowid as number;

  setTagsForPost(postId, data.tags);

  return getPostById(postId)!;
}

export function updatePost(
  id: number,
  data: {
    title: string;
    content: string;
    is_public: boolean;
    tags: string[];
  }
) {
  const current = db.prepare('SELECT slug FROM posts WHERE id = ?').get(id) as { slug: string } | undefined;
  if (!current) throw new Error('Post not found');

  // Only update slug if title changed significantly? For simplicity keep existing slug or re-slugify on request.
  // Keep slug stable on edit for now.
  db.prepare(
    `UPDATE posts 
     SET title = ?, content = ?, is_public = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE id = ?`
  ).run(data.title, data.content, data.is_public ? 1 : 0, id);

  setTagsForPost(id, data.tags);

  return getPostById(id)!;
}

export function deletePost(id: number) {
  deleteAttachmentsForPost(id);
  db.prepare('DELETE FROM posts WHERE id = ?').run(id);
}

function setTagsForPost(postId: number, tagNames: string[]) {
  // Remove existing
  db.prepare('DELETE FROM post_tags WHERE post_id = ?').run(postId);

  if (tagNames.length === 0) return;

  const insertTag = db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)');
  const getTag = db.prepare('SELECT id FROM tags WHERE name = ?');

  for (const name of tagNames) {
    const clean = name.trim();
    if (!clean) continue;
    insertTag.run(clean);
    const tag = getTag.get(clean) as { id: number };
    if (tag) {
      db.prepare('INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)').run(postId, tag.id);
    }
  }
}

export function getPostsForExport() {
  const posts = db
    .prepare('SELECT id, title, slug, content, is_public, created_at FROM posts ORDER BY created_at DESC')
    .all() as Post[];

  return posts.map((post) => ({
    ...post,
    tags: getTagsForPost(post.id),
  }));
}
