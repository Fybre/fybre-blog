import { NextResponse } from 'next/server';
import { getSetting } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { getSocialLinks } from '@/lib/socialLinks';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const aiEnabled = getSetting('ai_enabled') === 'true';
  const aiBaseUrl = getSetting('ai_base_url') || 'https://api.openai.com/v1';
  const aiModel = getSetting('ai_model') || 'gpt-4o-mini';

  return NextResponse.json({
    default_visibility: getSetting('default_visibility') || 'public',
    theme: getSetting('theme') || 'system',
    typography: getSetting('typography') || 'system',
    site_title: getSetting('site_title') || 'Fybre Blog',
    hero_title: getSetting('hero_title') || 'The Notebook',
    hero_subtitle: getSetting('hero_subtitle') || 'Thoughts, notes, and stories exploring technology, design, and life.',
    new_post_button_text: getSetting('new_post_button_text') || 'Write a story',
    ai_enabled: aiEnabled,
    ai_base_url: aiBaseUrl,
    ai_model: aiModel,
    ai_has_api_key: Boolean(getSetting('ai_api_key')),
    ai_ready: aiEnabled && Boolean(aiBaseUrl.trim()) && Boolean(aiModel.trim()),
    profile_links: getSocialLinks(),
  });
}
