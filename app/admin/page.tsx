import Header from '@/components/Header';
import { getSetting, setSetting } from '@/lib/db';
import { Theme, Typography } from '@/lib/types';
import { deleteTag, getTagsWithCounts, renameTag } from '@/lib/posts';
import { redirect } from 'next/navigation';
import AdminActions from './AdminActions';
import ThemePicker from './ThemePicker';
import SettingsSavedToast from './SettingsSavedToast';
import SocialLinksEditor from './SocialLinksEditor';
import { getSocialLinks, setSocialLinks } from '@/lib/socialLinks';
import TypographyPicker from './TypographyPicker';
import { getSession } from '@/lib/auth';
import AISettings from './AISettings';

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();
  if (!session) redirect('/login');

  const currentTheme = (getSetting('theme') || 'system') as Theme;
  const currentTypography = (getSetting('typography') || 'system') as Typography;
  const defaultVisibility = (getSetting('default_visibility') || 'public') as 'public' | 'private';
  const siteTitle = getSetting('site_title') || 'Fybre Blog';
  const heroTitle = getSetting('hero_title') || 'The Notebook';
  const heroSubtitle = getSetting('hero_subtitle') || 'Thoughts, notes, and stories exploring technology, design, and life.';
  const newPostButtonText = getSetting('new_post_button_text') || 'Write a story';
  const socialLinks = getSocialLinks();
  const aiEnabled = getSetting('ai_enabled') === 'true';
  const aiBaseUrl = getSetting('ai_base_url') || '';
  const aiModel = getSetting('ai_model') || '';
  const aiHasApiKey = Boolean(getSetting('ai_api_key'));
  const tags = getTagsWithCounts(true);

  async function saveSettings(formData: FormData) {
    'use server';
    if (!(await getSession())) redirect('/login');

    const theme = formData.get('theme') as Theme;
    const typography = formData.get('typography') as Typography;
    const visibility = formData.get('default_visibility') as 'public' | 'private';
    const title = (formData.get('site_title') as string) || 'Fybre Blog';
    const hTitle = (formData.get('hero_title') as string) || 'The Notebook';
    const hSubtitle = (formData.get('hero_subtitle') as string) || 'Thoughts, notes, and stories exploring technology, design, and life.';
    const newPostText = (formData.get('new_post_button_text') as string) || 'Write a story';
    const linkTitles = formData.getAll('link_title').map((value) => String(value));
    const linkUrls = formData.getAll('link_url').map((value) => String(value));
    const aiApiKey = (formData.get('ai_api_key') as string) || '';

    setSetting('theme', theme);
    setSetting('typography', typography);
    setSetting('default_visibility', visibility);
    setSetting('site_title', title.trim());
    setSetting('hero_title', hTitle.trim());
    setSetting('hero_subtitle', hSubtitle.trim());
    setSetting('new_post_button_text', newPostText.trim());
    setSocialLinks(linkTitles.map((title, index) => ({ title, url: linkUrls[index] || '' })));
    setSetting('ai_enabled', formData.get('ai_enabled') === 'on' ? 'true' : 'false');
    setSetting('ai_base_url', ((formData.get('ai_base_url') as string) || '').trim());
    setSetting('ai_model', ((formData.get('ai_model') as string) || '').trim());
    if (aiApiKey.trim()) {
      setSetting('ai_api_key', aiApiKey.trim());
    }

    redirect('/admin?saved=1');
  }

  async function renameTagAction(formData: FormData) {
    'use server';
    if (!(await getSession())) redirect('/login');

    renameTag((formData.get('old_name') as string) || '', (formData.get('new_name') as string) || '');
    redirect('/admin?saved=1');
  }

  async function deleteTagAction(formData: FormData) {
    'use server';
    if (!(await getSession())) redirect('/login');

    deleteTag((formData.get('tag_name') as string) || '');
    redirect('/admin?saved=1');
  }

  return (
    <>
      <Header />
      <SettingsSavedToast saved={!!params.saved} />
      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tighter">Admin</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Site settings and publishing controls. Edit or delete posts from the main page while logged in.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <AdminActions />
          </div>
        </div>

        {params.saved && (
          <div className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--card)]/70 px-4 py-3 text-sm text-[var(--muted)]">
            Settings saved.
          </div>
        )}

        <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)]/60 p-6 md:p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Tune the public site defaults and appearance.</p>
          </div>

          <form action={saveSettings} className="space-y-8">
            <div>
              <label className="block text-sm mb-2 text-[var(--muted)]">Site title</label>
              <input name="site_title" defaultValue={siteTitle} className="input" />
            </div>

            <div>
              <label className="block text-sm mb-2 text-[var(--muted)]">Main page title</label>
              <input name="hero_title" defaultValue={heroTitle} className="input" />
            </div>

            <div>
              <label className="block text-sm mb-2 text-[var(--muted)]">Main page subtitle</label>
              <input name="hero_subtitle" defaultValue={heroSubtitle} className="input" />
            </div>

            <div>
              <label className="block text-sm mb-2 text-[var(--muted)]">New post button text</label>
              <input name="new_post_button_text" defaultValue={newPostButtonText} className="input" />
              <p className="text-xs text-[var(--muted)] mt-1.5">
                Controls the button shown on the main page when logged in.
              </p>
            </div>

            <SocialLinksEditor initialLinks={socialLinks} />

            <AISettings enabled={aiEnabled} baseUrl={aiBaseUrl} model={aiModel} hasApiKey={aiHasApiKey} />

            <div>
              <label className="block text-sm mb-2 text-[var(--muted)]">Default post visibility</label>
              <select name="default_visibility" defaultValue={defaultVisibility} className="input">
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
              <p className="text-xs text-[var(--muted)] mt-1.5">
                The Public checkbox on new posts starts with this value.
              </p>
            </div>

            <div>
              <div className="mb-3">
                <label className="block text-sm text-[var(--muted)]">Theme</label>
                <p className="text-xs text-[var(--muted)] mt-1">Click a preview card to choose the site-wide theme.</p>
              </div>
              <ThemePicker currentTheme={currentTheme} />
            </div>

            <div>
              <div className="mb-3">
                <label className="block text-sm text-[var(--muted)]">Typography</label>
                <p className="text-xs text-[var(--muted)] mt-1">Pick the font voice for headings, body text, and UI details.</p>
              </div>
              <TypographyPicker currentTypography={currentTypography} />
            </div>

            <div className="flex items-center gap-4 pt-2">
              <button type="submit" className="btn btn-primary">Save settings</button>
              <p className="text-xs text-[var(--muted)]">Theme and typography changes preview immediately here.</p>
            </div>
          </form>
        </section>

        <section className="mt-8 rounded-3xl border border-[var(--border)] bg-[var(--card)]/60 p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight">Tags</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Rename, merge, or remove tags across posts.</p>
          </div>

          {tags.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No tags yet.</p>
          ) : (
            <div className="space-y-3">
              {tags.map((tag) => (
                <div key={tag.name} className="rounded-2xl border border-[var(--border)] bg-[var(--bg)]/35 p-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">{tag.name}</div>
                      <div className="text-xs text-[var(--muted)]">{tag.count} {tag.count === 1 ? 'post' : 'posts'}</div>
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                    <form action={renameTagAction} className="flex gap-2">
                      <input type="hidden" name="old_name" value={tag.name} />
                      <input name="new_name" defaultValue={tag.name} className="input" aria-label={`Rename ${tag.name}`} />
                      <button type="submit" className="btn btn-secondary shrink-0">Rename</button>
                    </form>
                    <form action={deleteTagAction}>
                      <input type="hidden" name="tag_name" value={tag.name} />
                      <button type="submit" className="btn btn-danger w-full sm:w-auto">Delete</button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
