'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function LogoutButton() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (!res.ok) throw new Error('Logout failed');
      toast.success('Logged out');
      router.push('/');
      router.refresh();
    } catch {
      toast.error('Could not log out. Please try again.');
      setLoggingOut(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loggingOut}
      className="px-3 py-1.5 text-[var(--muted)] hover:text-[var(--fg)] hover:bg-[var(--bg)] rounded-md transition-colors"
    >
      {loggingOut ? 'Logging out...' : 'Logout'}
    </button>
  );
}
