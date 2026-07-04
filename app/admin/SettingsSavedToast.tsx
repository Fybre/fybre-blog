'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

export default function SettingsSavedToast({ saved }: { saved: boolean }) {
  useEffect(() => {
    if (saved) {
      toast.success('Settings saved');
    }
  }, [saved]);

  return null;
}
