import { getSetting, setSetting } from './db';

export interface SocialLink {
  title: string;
  url: string;
}

const settingKey = 'profile_links';

function normalizeUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function sanitizeSocialLinks(links: SocialLink[]) {
  return links
    .map((link) => ({
      title: link.title.trim(),
      url: normalizeUrl(link.url),
    }))
    .filter((link) => link.title && link.url)
    .slice(0, 12);
}

export function getSocialLinks(): SocialLink[] {
  const value = getSetting(settingKey);
  if (!value) return [];

  try {
    const links = JSON.parse(value);
    if (!Array.isArray(links)) return [];
    return sanitizeSocialLinks(
      links.map((link) => ({
        title: typeof link?.title === 'string' ? link.title : '',
        url: typeof link?.url === 'string' ? link.url : '',
      }))
    );
  } catch {
    return [];
  }
}

export function setSocialLinks(links: SocialLink[]) {
  setSetting(settingKey, JSON.stringify(sanitizeSocialLinks(links)));
}
