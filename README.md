# Fybre Blog

Fybre Blog is a small, self-hosted personal blog built with Next.js, SQLite, and a rich TipTap editor. It is designed for simple publishing: write posts, upload screenshots, manage tags, choose a theme/typography style, and keep the data in plain local volumes.

## Features

- Rich text editor with headings, lists, quotes, links, images, paste/drop screenshots, and syntax-highlighted code blocks.
- Public and private posts, with a configurable default visibility.
- Main-page search, tag filtering, sorting, and user-selectable card layouts.
- Admin settings for site title, hero text, new post button text, themes, typography, and custom main-page links.
- Tag management for renaming, merging, and deleting tags.
- Markdown ZIP export, Markdown/ZIP import, uploaded image persistence, and RSS feed at `/feed.xml`.
- Docker-first deployment with SQLite stored in `data/blog.db`.

## Recommended Setup: Docker Compose

### 1. Create a production secret

Create a `.env` file next to `docker-compose.yml`:

```bash
printf 'JWT_SECRET=%s\n' "$(openssl rand -base64 48)" > .env
```

Or create it manually:

```env
JWT_SECRET=replace-with-a-long-random-secret
```

`JWT_SECRET` signs admin login sessions. Changing it logs everyone out.

### 2. Start the site

```bash
docker compose up -d --build
```

The app will be available at:

```text
http://localhost:3000
```

### 3. Complete first-run setup

On first visit, the site redirects to `/setup`.

Create the admin username and password, then sign in at `/login`.

## Docker Configuration

The default compose file runs one service:

```yaml
services:
  blog:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
      - ./public/uploads:/app/public/uploads
    environment:
      - JWT_SECRET=${JWT_SECRET:-change-this-secure-secret-in-production}
      - NODE_ENV=production
    restart: unless-stopped
```

### Persistent data

These host folders should be backed up:

- `data/blog.db` — SQLite database for users, posts, tags, and settings.
- `public/uploads/` — uploaded images and screenshots.

### Port

To expose a different host port, change the left side:

```yaml
ports:
  - "8080:3000"
```

Then open `http://localhost:8080`.

## Admin Configuration

After logging in, use `/admin` to configure:

- **Site title** — shown in the header.
- **Main page title/subtitle** — hero text on the homepage.
- **New post button text** — customises the logged-in new post button.
- **Main page links** — custom title/URL buttons shown under the intro.
- **Default post visibility** — controls the initial Public checkbox state for new posts.
- **Theme** — system, light, dark, midnight, evergreen, warm, or modern.
- **Typography** — system, editorial, modern, mono accent, or classic.
- **Tags** — rename, merge, or delete tags globally.

Posts are edited and deleted from the main page while logged in.

## Writing Posts

Go to `/admin/new` while logged in.

- Use **Save** to create the post.
- Toggle **Public** before saving if the post should be private.
- Add tags as comma-separated values.
- Paste or drag images directly into the editor, or use the image button.
- Use the `<>` code block button and language selector for highlighted code.

Private posts are visible only while logged in and are marked with a private badge.

## Import, Export, and RSS

### Export Markdown

In `/admin`, choose **Export to Markdown**.

The downloaded ZIP includes:

- `posts/*.md`
- referenced files from `uploads/`

### Import Markdown

In `/admin`, choose **Import Markdown** and select either:

- a single `.md` file
- a `.zip` containing Markdown files and optionally `uploads/*`

Supported frontmatter:

```markdown
---
title: My Post
tags: [notes, demo]
visibility: private
---

Post content here.
```

If `visibility` is omitted, imported posts are public.

### RSS

Public posts are available at:

```text
/feed.xml
```

## Updating

After pulling changes or editing source files:

```bash
docker compose up -d --build
```

If you want a clean rebuild:

```bash
docker compose build --no-cache blog
docker compose up -d blog
```

## Backups

Stop the container before copying the SQLite database for the safest backup:

```bash
docker compose stop blog
tar -czf fybre-blog-backup-$(date +%F).tar.gz data public/uploads
docker compose up -d blog
```

Restore by replacing the `data/` and `public/uploads/` folders, then starting Docker again.

## Local Development

Docker is recommended for running the site, but local development is also supported:

```bash
npm install
npm run dev
```

Useful commands:

```bash
npm run lint
npm run build
npm start
```

Local data is still stored in:

- `data/blog.db`
- `public/uploads/`

## Production Notes

- Always set a strong `JWT_SECRET`.
- Put the app behind HTTPS if exposed publicly.
- Back up both `data/` and `public/uploads/`.
- The app uses SQLite, which is ideal for a personal blog but not intended for high-concurrency multi-author publishing.
- Uploaded images are stored locally, so ensure your hosting volume is persistent.

## Troubleshooting

### Changes do not appear

Rebuild the Docker image:

```bash
docker compose up -d --build
```

Then hard-refresh the browser.

### Login sessions reset

Check that `JWT_SECRET` is stable. If it changes, existing sessions become invalid.

### Database appears empty

Check that `./data` is mounted and contains `blog.db`:

```bash
ls -lah data
```

### Uploaded images are missing

Check that `./public/uploads` is mounted and contains the uploaded files:

```bash
ls -lah public/uploads
```

### View logs

```bash
docker compose logs -f blog
```

## Tech Stack

- Next.js App Router
- React
- SQLite via `better-sqlite3`
- TipTap editor
- Tailwind CSS
- Docker / Docker Compose

## Attribution

Built collaboratively with OpenAI Codex.
