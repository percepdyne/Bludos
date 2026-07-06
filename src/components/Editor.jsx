import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';

const invoke = (...a) => window.bludos.invoke(...a);

export default function Editor({ rel, onRenamed }) {
  const [meta, setMeta] = useState({});
  const [title, setTitle] = useState('');
  const [saved, setSaved] = useState(true);
  const loaded = useRef(false);
  const dirty = useRef(false);
  const saveTimer = useRef();
  const editorRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: false }),
      Image,
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
      Placeholder.configure({ placeholder: 'Write, or insert a template from the sidebar…' }),
      Markdown.configure({ html: false, linkify: true }),
    ],
    onUpdate({ editor }) {
      if (!loaded.current) return;
      dirty.current = true;
      setSaved(false);
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        await invoke('page:write', rel, editor.storage.markdown.getMarkdown());
        dirty.current = false;
        setSaved(true);
      }, 700);
    },
  });
  editorRef.current = editor;

  useEffect(() => {
    if (!editor) return;
    let cancelled = false;
    (async () => {
      const page = await invoke('page:read', rel);
      if (cancelled) return;
      setMeta(page.meta || {});
      setTitle(page.title);
      editor.commands.setContent(page.markdown || '');
      loaded.current = true;
    })();
    return () => { cancelled = true; };
  }, [editor, rel]);

  // Flush unsaved edits when the page unmounts (component is keyed by rel)
  useEffect(() => {
    return () => {
      clearTimeout(saveTimer.current);
      const ed = editorRef.current;
      if (dirty.current && ed && !ed.isDestroyed) {
        invoke('page:write', rel, ed.storage.markdown.getMarkdown());
      }
    };
  }, [rel]);

  const commitTitle = async () => {
    const t = title.trim();
    if (!t || t === rel.split('/').pop().replace(/\.md$/i, '')) return;
    const newRel = await invoke('page:rename', rel, t);
    onRenamed(newRel);
  };

  if (!editor) return null;

  const B = ({ action, active, label, children }) => (
    <button
      className={'tb' + (active ? ' on' : '')}
      title={label}
      onMouseDown={(e) => { e.preventDefault(); action(); }}
    >{children}</button>
  );
  const c = () => editor.chain().focus();

  return (
    <div className="editor">
      <div className="editor-head">
        <input
          className="editor-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
        <div className="editor-meta">
          <span className={'status s-' + String(meta.status || 'Draft').toLowerCase().replace(/\s/g, '-')}>
            {meta.status || 'Draft'}
          </span>
          <span className="save-state">{saved ? 'Saved' : 'Saving…'}</span>
        </div>
      </div>
      <div className="toolbar">
        <B label="Heading 1" active={editor.isActive('heading', { level: 1 })} action={() => c().toggleHeading({ level: 1 }).run()}>H1</B>
        <B label="Heading 2" active={editor.isActive('heading', { level: 2 })} action={() => c().toggleHeading({ level: 2 }).run()}>H2</B>
        <B label="Heading 3" active={editor.isActive('heading', { level: 3 })} action={() => c().toggleHeading({ level: 3 }).run()}>H3</B>
        <span className="tb-sep" />
        <B label="Bold" active={editor.isActive('bold')} action={() => c().toggleBold().run()}><b>B</b></B>
        <B label="Italic" active={editor.isActive('italic')} action={() => c().toggleItalic().run()}><i>I</i></B>
        <B label="Strike" active={editor.isActive('strike')} action={() => c().toggleStrike().run()}><s>S</s></B>
        <span className="tb-sep" />
        <B label="Checklist" active={editor.isActive('taskList')} action={() => c().toggleTaskList().run()}>☑</B>
        <B label="Bullet list" active={editor.isActive('bulletList')} action={() => c().toggleBulletList().run()}>•≡</B>
        <B label="Numbered list" active={editor.isActive('orderedList')} action={() => c().toggleOrderedList().run()}>1≡</B>
        <span className="tb-sep" />
        <B label="Quote" active={editor.isActive('blockquote')} action={() => c().toggleBlockquote().run()}>❝</B>
        <B label="Code block" active={editor.isActive('codeBlock')} action={() => c().toggleCodeBlock().run()}>{'</>'}</B>
        <B label="Insert table" action={() => c().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>⊞</B>
        <B label="Divider" action={() => c().setHorizontalRule().run()}>—</B>
      </div>
      <EditorContent editor={editor} className="editor-body" />
    </div>
  );
}
