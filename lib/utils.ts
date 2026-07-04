export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function stripHtml(html: string): string {
  // Unescape entities first (TipTap stores text with &lt; etc for < >)
  let text = html
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'");

  // Now strip any tags
  text = text.replace(/<[^>]*>/g, ' ');

  // Remove any remaining < or > chars (from unescaped or user input) for clean preview
  text = text.replace(/[<>]/g, ' ');

  // Collapse whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

export function getExcerpt(content: string, length = 200): string {
  let text = stripHtml(content);
  if (text.length <= length) return text;
  // cut at last space before length for nicer break
  text = text.slice(0, length);
  const lastSpace = text.lastIndexOf(' ');
  if (lastSpace > length / 2) {
    text = text.slice(0, lastSpace);
  }
  return text.trim() + '...';
}

export function getReadingTime(content: string): string {
  const words = stripHtml(content).split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 225));
  return `${minutes} min read`;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${value >= 10 || exponent === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[exponent]}`;
}
