'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import type { Editor as TiptapEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { lowlight } from '@/lib/codeHighlight';
import { useCallback, useRef, useEffect, useState } from 'react';
import { Bold, Edit3, Eye, Italic, Underline as UnderlineIcon, List, ListOrdered, Heading2, Heading3, Image as ImageIcon, Link as LinkIcon, Code, Quote, Minus } from 'lucide-react';

interface EditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function Editor({ content, onChange, placeholder = 'Start writing...' }: EditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<TiptapEditor | null>(null);

  const [codeLanguage, setCodeLanguage] = useState('js');
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');

  const commonLanguages = [
    'plaintext', 'js', 'ts', 'jsx', 'tsx', 'python', 'bash', 'json',
    'html', 'css', 'sql', 'yaml', 'markdown', 'java', 'c', 'cpp', 'go', 'rust'
  ];

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        underline: false,
        link: false,
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'code-block',
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'underline text-[var(--link)]',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const uploadImageFile = useCallback(async (file: File) => {
    const ed = editorRef.current || editor;
    if (!ed) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        alert('Image upload failed');
        return;
      }

      const { url } = await res.json();
      ed.chain().focus().setImage({ src: url }).run();
    } catch {
      alert('Failed to upload image');
    }
  }, [editor]);

  // Robust image paste / drop using editor instance + ref
  useEffect(() => {
    if (!editor) return;

    editorRef.current = editor;

    const handlePaste: EventListener = (event) => {
      const clipboardEvent = event as ClipboardEvent;
      const items = Array.from(clipboardEvent.clipboardData?.items || []);
      const imageItem = items.find((item) => item.type.startsWith('image/'));
      if (imageItem) {
        const file = imageItem.getAsFile();
        if (file) {
          clipboardEvent.preventDefault();
          uploadImageFile(file);
        }
      }
    };

    const handleDrop: EventListener = (event) => {
      const dragEvent = event as DragEvent;
      const files = Array.from(dragEvent.dataTransfer?.files || []);
      const imageFile = files.find((file) => file.type.startsWith('image/'));
      if (imageFile) {
        dragEvent.preventDefault();
        uploadImageFile(imageFile);
      }
    };

    const dom = editor.view.dom;
    dom.addEventListener('paste', handlePaste);
    dom.addEventListener('drop', handleDrop);

    return () => {
      dom.removeEventListener('paste', handlePaste);
      dom.removeEventListener('drop', handleDrop);
    };
  }, [editor, uploadImageFile]);

  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() === content) return;
    editor.commands.setContent(content, { emitUpdate: false });
  }, [content, editor]);

  const toggleBold = useCallback(() => {
    editor?.chain().focus().toggleBold().run();
  }, [editor]);

  const toggleItalic = useCallback(() => {
    editor?.chain().focus().toggleItalic().run();
  }, [editor]);

  const toggleUnderline = useCallback(() => {
    editor?.chain().focus().toggleUnderline().run();
  }, [editor]);

  const toggleHeading2 = useCallback(() => {
    editor?.chain().focus().toggleHeading({ level: 2 }).run();
  }, [editor]);

  const toggleHeading3 = useCallback(() => {
    editor?.chain().focus().toggleHeading({ level: 3 }).run();
  }, [editor]);

  const toggleBulletList = useCallback(() => {
    editor?.chain().focus().toggleBulletList().run();
  }, [editor]);

  const toggleOrderedList = useCallback(() => {
    editor?.chain().focus().toggleOrderedList().run();
  }, [editor]);

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl || 'https://');

    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(async () => {
    if (!editor) return;

    fileInputRef.current?.click();
  }, [editor]);

  const insertCodeBlock = useCallback(() => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .toggleCodeBlock({ language: codeLanguage })
      .run();
  }, [editor, codeLanguage]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await uploadImageFile(file);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!editor) {
    return <div className="editor-container h-[320px] flex items-center justify-center text-[var(--muted)]">Loading editor...</div>;
  }

  const isActive = (name: string, attrs?: Record<string, unknown>) => editor.isActive(name, attrs);

  return (
    <div className="editor-container">
      <div className="editor-toolbar">
        <button
          type="button"
          onClick={toggleBold}
          className={isActive('bold') ? 'is-active' : ''}
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={toggleItalic}
          className={isActive('italic') ? 'is-active' : ''}
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          onClick={toggleUnderline}
          className={isActive('underline') ? 'is-active' : ''}
          title="Underline"
        >
          <UnderlineIcon size={16} />
        </button>

        <div className="w-px h-5 bg-[var(--border)] mx-1" />

        <button
          type="button"
          onClick={toggleHeading2}
          className={isActive('heading', { level: 2 }) ? 'is-active' : ''}
          title="Heading 2"
        >
          <Heading2 size={16} />
        </button>
        <button
          type="button"
          onClick={toggleHeading3}
          className={isActive('heading', { level: 3 }) ? 'is-active' : ''}
          title="Heading 3"
        >
          <Heading3 size={16} />
        </button>

        <div className="w-px h-5 bg-[var(--border)] mx-1" />

        <button
          type="button"
          onClick={toggleBulletList}
          className={isActive('bulletList') ? 'is-active' : ''}
          title="Bullet list"
        >
          <List size={16} />
        </button>
        <button
          type="button"
          onClick={toggleOrderedList}
          className={isActive('orderedList') ? 'is-active' : ''}
          title="Numbered list"
        >
          <ListOrdered size={16} />
        </button>

        <div className="w-px h-5 bg-[var(--border)] mx-1" />

        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          className={isActive('blockquote') ? 'is-active' : ''}
          title="Blockquote"
        >
          <Quote size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().setHorizontalRule().run()}
          title="Horizontal rule"
        >
          <Minus size={16} />
        </button>

        <div className="w-px h-5 bg-[var(--border)] mx-1" />

        <button
          type="button"
          onClick={insertCodeBlock}
          className={isActive('codeBlock') ? 'is-active' : ''}
          title="Code block"
        >
          <Code size={16} />
        </button>

        <select
          value={isActive('codeBlock') ? (editor.getAttributes('codeBlock').language || codeLanguage) : codeLanguage}
          onChange={(e) => {
            const lang = e.target.value;
            setCodeLanguage(lang);
            if (isActive('codeBlock')) {
              editor.chain().focus().setCodeBlock({ language: lang }).run();
            }
          }}
          className="mr-1 h-8 min-w-24 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1 text-sm text-[var(--fg)]"
          title="Code language"
        >
          {commonLanguages.map((lang) => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>

        <div className="w-px h-5 bg-[var(--border)] mx-1" />

        <button type="button" onClick={setLink} className={isActive('link') ? 'is-active' : ''} title="Link">
          <LinkIcon size={16} />
        </button>
        <button type="button" onClick={addImage} title="Insert image">
          <ImageIcon size={16} />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        <div className="ml-auto flex rounded-lg border border-[var(--border)] bg-[var(--card)] p-1">
          <button
            type="button"
            onClick={() => setMode('edit')}
            className={mode === 'edit' ? 'is-active' : ''}
            title="Edit"
          >
            <Edit3 size={15} />
          </button>
          <button
            type="button"
            onClick={() => setMode('preview')}
            className={mode === 'preview' ? 'is-active' : ''}
            title="Preview"
          >
            <Eye size={15} />
          </button>
        </div>
      </div>

      {mode === 'edit' ? (
        <EditorContent editor={editor} className="min-h-[340px] p-1" />
      ) : (
        <div className="min-h-[340px] p-6">
          <div className="prose" dangerouslySetInnerHTML={{ __html: content || '<p></p>' }} />
        </div>
      )}
      <div className="px-3 py-2 text-xs text-[var(--muted)] border-t border-[var(--border)]">
        Paste or drop images/screenshots. Use the Code button + language selector for fenced code blocks (language saved for export & display).
      </div>
    </div>
  );
}
