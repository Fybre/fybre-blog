import Link from 'next/link';
import LogoutButton from './LogoutButton';
import { getSession } from '@/lib/auth';
import { getSetting } from '@/lib/db';

export default async function Header() {
  const session = await getSession();
  const siteTitle = getSetting('site_title') || 'Fybre Blog';

  return (
    <header className="border-b border-[var(--border)] bg-[var(--glass)] backdrop-blur-xl sticky top-0 z-50 transition-colors animate-fade-in">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="font-bold tracking-tight text-xl hover:opacity-80 transition-opacity">
            {siteTitle}
          </Link>
          
          <nav className="flex items-center gap-3 text-sm font-medium">
            <Link href="/" className="px-4 py-2 hover:bg-[var(--fg)]/5 rounded-full transition-colors">
              Posts
            </Link>
            
            {session ? (
              <>
                <Link href="/admin" className="px-4 py-2 hover:bg-[var(--fg)]/5 rounded-full transition-colors">
                  Admin
                </Link>
                <div className="pl-2 border-l border-[var(--border)]">
                  <LogoutButton />
                </div>
              </>
            ) : (
              <Link 
                href="/login" 
                className="btn btn-primary"
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
