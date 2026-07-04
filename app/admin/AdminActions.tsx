'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';

export default function AdminActions() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/admin/export');
      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.error || 'Export failed');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const disposition = res.headers.get('content-disposition') || '';
      const filename = disposition.match(/filename="([^"]+)"/)?.[1] || `fybre-blog-export-${new Date().toISOString().slice(0, 10)}.zip`;
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Export ready');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');

      toast.success(`Imported ${data.imported} ${data.imported === 1 ? 'post' : 'posts'}`);
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Import failed. Please try again.');
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button 
        onClick={handleExport} 
        disabled={exporting}
        className="btn btn-secondary"
      >
        {exporting ? 'Exporting...' : 'Export to Markdown'}
      </button>
      <button
        type="button"
        onClick={() => importInputRef.current?.click()}
        disabled={importing}
        className="btn btn-secondary"
      >
        {importing ? 'Importing...' : 'Import Markdown'}
      </button>
      <input
        ref={importInputRef}
        type="file"
        accept=".md,.zip,text/markdown,application/zip"
        onChange={handleImport}
        className="hidden"
      />
    </div>
  );
}
