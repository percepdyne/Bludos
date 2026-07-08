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
import PromptModal from './PromptModal.jsx';
import { BlueprintModal, TagModal, RevisionsModal } from './DocModals.jsx';
import { csvChart, chartBlock } from '../tools/chart.js';
import { CALC_SPECS } from '../tools/calcs.js';
import { WikiLink, SLASH_COMMANDS } from '../tools/editor-ext.js';

const invoke = (...a) => window.bludos.invoke(...a);

const WEBHOOK_HINT =
  "In your Teams channel: ⋯ → Workflows → 'Post to a channel when a webhook request is received' → copy the request URL. Legacy Incoming Webhook connector URLs work too.";

const STATUSES = ['Draft', 'In Review', 'Approved', 'Released', 'Superseded', 'Obsolete'];

// The markdown model keeps portable relative paths (../_media/x.png); the DOM
// needs absolute file:// URLs. mediaBase is set per-page before content loads.
const mediaBase = { url: '' };
const toFileUrl = (winPath) => 'file:///' + encodeURI(String(winPath).replace(/\\/g, '/'));
const resolveSrc = (src) => {
  if (/^(data|file|https?):/i.test(src) || !mediaBase.url) return src;
  try { return new URL(src, mediaBase.url).href; } catch { return src; }
};
const LocalImage = Image.extend({
  renderHTML({ HTMLAttributes }) {
    return ['img', { ...HTMLAttributes, src: resolveSrc(HTMLAttributes.src || '') }];
  },
});

export default function Editor({ rel, onRenamed }) {
  const [meta, setMeta] = useState({});
  const [title, setTitle] = useState('');
  const [saved, setSaved] = useState(true);
  const [shareState, setShareState] = useState('idle'); // idle | busy | ok | err
  const [shareErr, setShareErr] = useState('');
  const [webhookModal, setWebhookModal] = useState(null); // null | { initial, thenShare }
  const [tplSaved, setTplSaved] = useState(false);
  const [docModal, setDocModal] = useState(null); // null | 'blueprint' | 'tag' | 'revs'
  const [slash, setSlash] = useState(null); // { items, index, coords }
  const [backlinks, setBacklinks] = useState([]);
  const [, setSelTick] = useState(0); // bumped on caret move so RECALC re-evaluates
  const loaded = useRef(false);
  const dirty = useRef(false);
  const saveTimer = useRef();
  const editorRef = useRef(null);

  const insertImageResult = (r) => {
    if (r && r.ok && editorRef.current) {
      editorRef.current.chain().focus().setImage({ src: r.src }).run();
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: false }),
      LocalImage,
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
      Placeholder.configure({ placeholder: 'Write, paste an image, or type / for commands…' }),
      Markdown.configure({ html: false, linkify: true }),
      WikiLink,
    ],
    editorProps: {
      handlePaste(view, event) {
        const items = [...(event.clipboardData?.items || [])];
        const img = items.find((it) => it.type.startsWith('image/'));
        if (!img) return false;
        const f = img.getAsFile();
        if (!f) return false;
        f.arrayBuffer().then(async (buf) => {
          const r = await invoke('media:save', rel, f.name || 'pasted.png', new Uint8Array(buf));
          insertImageResult(r);
        });
        return true;
      },
      handleDrop(view, event, slice, moved) {
        if (moved) return false;
        const all = [...(event.dataTransfer?.files || [])];
        const files = all.filter((f) => f.type.startsWith('image/'));
        const csvs = all.filter((f) => /\.csv$/i.test(f.name));
        if (!files.length && !csvs.length) return false;
        event.preventDefault();
        (async () => {
          for (const f of files) {
            const abs = window.bludos.filePath(f);
            const r = abs
              ? await invoke('media:import', rel, abs)
              : await invoke('media:save', rel, f.name, new Uint8Array(await f.arrayBuffer()));
            insertImageResult(r);
          }
          // CSV → SVG chart into _media + stats block into the document
          for (const f of csvs) {
            const res = csvChart(await f.text(), f.name);
            if (!res.ok) continue;
            const r = await invoke('media:save', rel, f.name.replace(/\.csv$/i, '') + '.svg', new TextEncoder().encode(res.svg));
            const ed = editorRef.current;
            if (!ed || ed.isDestroyed) continue;
            const md = `![${f.name}](${r.src})\n\n` + chartBlock(f.name, res.stats);
            ed.commands.insertContentAt(ed.state.doc.content.size, '\n\n' + md + '\n');
          }
        })();
        return true;
      },
    },
    onSelectionUpdate() {
      setSelTick((t) => (t + 1) & 0xffff); // re-render so the RECALC button tracks the caret
    },
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
      const [page, info] = await Promise.all([invoke('page:read', rel), invoke('workspace:info')]);
      if (cancelled) return;
      const dirParts = rel.split('/');
      dirParts.pop();
      mediaBase.url = toFileUrl(info.root + '/' + dirParts.join('/')) + '/';
      setMeta(page.meta || {});
      setTitle(page.title);
      editor.commands.setContent(page.markdown || '');
      loaded.current = true;
    })();
    return () => { cancelled = true; };
  }, [editor, rel]);

  // backlinks: who links to this page
  useEffect(() => { invoke('wiki:backlinks', rel).then(setBacklinks); }, [rel]);

  // click a [[wiki-link]] in the rendered doc → navigate
  useEffect(() => {
    const dom = editor?.view?.dom;
    if (!dom) return;
    const onClick = async (e) => {
      const t = e.target.closest('.wikilink');
      if (!t) return;
      e.preventDefault();
      const hit = await invoke('wiki:resolve', t.dataset.target);
      if (hit) onRenamed(hit.rel); // reuse the "navigate to rel" path
    };
    dom.addEventListener('click', onClick);
    return () => dom.removeEventListener('click', onClick);
  }, [editor, rel]);

  // Flush unsaved edits when the page unmounts. page:write refuses to write to
  // missing files, so this can never resurrect a renamed or trashed page.
  useEffect(() => {
    return () => {
      clearTimeout(saveTimer.current);
      const ed = editorRef.current;
      if (dirty.current && ed && !ed.isDestroyed) {
        invoke('page:write', rel, ed.storage.markdown.getMarkdown());
      }
    };
  }, [rel]);

  // Toolbox "insert as block": append only the block at the end of the doc —
  // no full-document rewrite, so cursor context and undo granularity survive.
  useEffect(() => {
    const h = (e) => {
      const ed = editorRef.current;
      if (!ed || ed.isDestroyed || !loaded.current) return;
      // tiptap-markdown patches insertContentAt to parse markdown strings
      const ok = ed.commands.insertContentAt(ed.state.doc.content.size, '\n\n' + e.detail + '\n');
      if (ok) {
        ed.commands.focus('end');
      } else {
        // fallback: full roundtrip append (slower but safe)
        const cur = ed.storage.markdown.getMarkdown();
        ed.commands.setContent(cur + '\n\n' + e.detail + '\n', true);
      }
    };
    window.addEventListener('bludos:insert-block', h);
    return () => window.removeEventListener('bludos:insert-block', h);
  }, []);

  const flushNow = async () => {
    clearTimeout(saveTimer.current);
    const ed = editorRef.current;
    if (dirty.current && ed && !ed.isDestroyed) {
      await invoke('page:write', rel, ed.storage.markdown.getMarkdown());
      dirty.current = false;
      setSaved(true);
    }
  };

  const commitTitle = async () => {
    const t = title.trim();
    if (!t || t === rel.split('/').pop().replace(/\.md$/i, '')) return;
    await flushNow(); // save edits to the CURRENT path before it changes
    const newRel = await invoke('page:rename', rel, t);
    onRenamed(newRel);
  };

  const setStatus = async (status) => {
    const data = await invoke('page:set-status', rel, status);
    setMeta(data || { ...meta, status });
  };

  const saveAsTemplate = async () => {
    await flushNow();
    const r = await invoke('template:save-user', rel);
    if (r.ok) { setTplSaved(true); setTimeout(() => setTplSaved(false), 3000); }
  };

  const doShare = async () => {
    setShareState('busy');
    await flushNow();
    const r = await invoke('teams:share', rel);
    if (r.ok) {
      setShareState('ok');
      setTimeout(() => setShareState('idle'), 3000);
    } else {
      setShareErr(r.error || 'Unknown error');
      setShareState('err');
      setTimeout(() => setShareState('idle'), 6000);
    }
  };

  const share = async () => {
    const s = await invoke('settings:get');
    if (!s.teamsWebhookUrl) setWebhookModal({ initial: '', thenShare: true });
    else doShare();
  };

  const openWebhookSettings = async () => {
    const s = await invoke('settings:get');
    setWebhookModal({ initial: s.teamsWebhookUrl || '', thenShare: false });
  };

  if (!editor) return null;
  window.__bludosEditor = editor; // test hook

  // Live CALC blocks: when the caret sits inside a `CALC ▮ <tool-id>` block
  // whose tool is declarative, offer to reopen the tool with those inputs.
  const getCalcCtx = () => {
    const { doc, selection } = editor.state;
    // Snapshot every top-level node with its range and role.
    const nodes = [];
    doc.forEach((node, pos) => {
      const m = node.type.name === 'paragraph' && node.textContent.match(/^CALC ▮ ([a-z0-9-]+)/);
      nodes.push({ node, from: pos, to: pos + node.nodeSize, header: m ? m[1] : null, empty: node.textContent.trim() === '' });
    });
    const caret = selection.from;
    const idx = nodes.findIndex((n) => caret >= n.from && caret <= n.to);
    if (idx < 0) return null;
    // A CALC block = a header paragraph + the next table (skipping blanks).
    // Fire if the caret is in the header, in that table, or in a blank between.
    for (let h = 0; h < nodes.length; h++) {
      if (!nodes[h].header) continue;
      let t = h + 1;
      while (t < nodes.length && nodes[t].empty) t++;
      if (t >= nodes.length || nodes[t].node.type.name !== 'table') continue;
      if (idx < h || idx > t) continue;
      const rows = [];
      nodes[t].node.forEach((rowNode) => {
        const cells = [];
        rowNode.forEach((c) => cells.push(c.textContent.trim()));
        if (cells.length >= 2) rows.push(cells);
      });
      return { id: nodes[h].header, rows };
    }
    return null;
  };
  const calcCtx = getCalcCtx();
  const recalcSpec = calcCtx && CALC_SPECS.find((s) => calcCtx.id === s.id.split(' ')[0] || calcCtx.id === s.id);

  const doRecalc = () => {
    const vals = {};
    for (const inp of recalcSpec.inputs) {
      const row = calcCtx.rows.find((r) => r[0] === inp.label);
      if (!row) continue;
      let v = row[1];
      if (inp.unit && v.endsWith(' ' + inp.unit)) v = v.slice(0, -(inp.unit.length + 1));
      vals[inp.k] = v;
    }
    window.dispatchEvent(new CustomEvent('bludos:open-tool', { detail: { id: recalcSpec.id, vals } }));
  };

  // Slash menu: detect "/query" ending at the caret; filter commands.
  const updateSlash = () => {
    const { state } = editor;
    const { from } = state.selection;
    const before = state.doc.textBetween(Math.max(0, from - 24), from, '\n', '\n');
    const m = before.match(/(?:^|\s)\/([a-z]*)$/i);
    if (!m) { setSlash(null); return; }
    const q = m[1].toLowerCase();
    const items = SLASH_COMMANDS.filter((c) => (c.key + ' ' + c.title + ' ' + c.desc).toLowerCase().includes(q));
    if (!items.length) { setSlash(null); return; }
    const coords = editor.view.coordsAtPos(from);
    setSlash({ items, index: 0, coords: { left: coords.left, top: coords.bottom }, qlen: m[1].length });
  };

  const runSlash = (cmd) => {
    // delete the "/query" the user typed
    const { from } = editor.state.selection;
    editor.chain().focus().deleteRange({ from: from - (slash.qlen + 1), to: from }).run();
    setSlash(null);
    if (cmd.action === 'table') editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    else if (cmd.action === 'toolbox') window.dispatchEvent(new CustomEvent('bludos:open-tool', { detail: { open: true } }));
    else {
      const md = typeof cmd.md === 'function' ? cmd.md() : cmd.md;
      editor.commands.insertContent(md);
      if (cmd.key === 'link') editor.commands.setTextSelection(editor.state.selection.from - 2); // caret inside [[|]]
    }
  };

  const B = ({ action, active, label, children }) => (
    <button
      className={'tb' + (active ? ' on' : '')}
      title={label}
      onMouseDown={(e) => { e.preventDefault(); action(); }}
    >{children}</button>
  );
  const c = () => editor.chain().focus();
  const inTable = editor.isActive('table');

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
          {meta.doc && <span className="doc-chip">{meta.doc}</span>}
          <select
            className={'status s-' + String(meta.status || 'Draft').toLowerCase().replace(/\s/g, '-')}
            value={STATUSES.includes(meta.status) ? meta.status : 'Draft'}
            onChange={(e) => setStatus(e.target.value)}
            title="Document status (FM.D lifecycle)"
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <span className="save-state">{saved ? 'Saved' : 'Saving…'}</span>
          {shareState === 'err' && <span className="share-err" title={shareErr}>Share failed: {shareErr}</span>}
          <button className="tb" title="Blueprint mode — cyanotype render + PDF" onClick={async () => { await flushNow(); setDocModal('blueprint'); }}>▦</button>
          <button className="tb" title="Print a QR sample tag for the physical thing" onClick={() => setDocModal('tag')}>▩</button>
          <button className="tb" title="Revision vault (snapshots on status change)" onClick={() => setDocModal('revs')}>☰</button>
          <button className="share-btn" onClick={saveAsTemplate} title="Save this page as a reusable template">
            {tplSaved ? 'Template ✓' : '▤+ Template'}
          </button>
          <button className="share-btn" onClick={share} disabled={shareState === 'busy'}>
            {shareState === 'busy' ? 'Sharing…' : shareState === 'ok' ? 'Shared ✓' : '⇗ Share to Teams'}
          </button>
          <button className="tb" title="Teams webhook settings" onClick={openWebhookSettings}>⚙</button>
        </div>
      </div>
      {docModal === 'blueprint' && <BlueprintModal rel={rel} onClose={() => setDocModal(null)} />}
      {docModal === 'tag' && <TagModal rel={rel} meta={meta} title={title} onClose={() => setDocModal(null)} />}
      {docModal === 'revs' && (
        <RevisionsModal rel={rel} onClose={() => setDocModal(null)} onRestored={(r) => { setDocModal(null); onRenamed(r); }} />
      )}
      {webhookModal && (
        <PromptModal
          title="Microsoft Teams webhook"
          placeholder="https://… (webhook request URL)"
          hint={WEBHOOK_HINT}
          initial={webhookModal.initial}
          submitLabel="Save"
          onSubmit={async (v) => {
            const thenShare = webhookModal.thenShare;
            setWebhookModal(null);
            await invoke('settings:set', { teamsWebhookUrl: v.trim() });
            if (v.trim() && thenShare) doShare();
          }}
          onCancel={() => setWebhookModal(null)}
        />
      )}
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
        <B label="Insert image (or just paste / drop one)" action={async () => insertImageResult(await invoke('media:pick', rel))}>🖼</B>
        <B label="Insert table" action={() => c().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>⊞</B>
        <B label="Divider" action={() => c().setHorizontalRule().run()}>—</B>
        {recalcSpec && (
          <>
            <span className="tb-sep" />
            <button className="tb on" title={`Reopen ${recalcSpec.title} with this block's inputs`} onMouseDown={(e) => { e.preventDefault(); doRecalc(); }}>↻ RECALC</button>
          </>
        )}
        {inTable && (
          <>
            <span className="tb-sep" />
            <span className="tb-hint">TABLE</span>
            <B label="Add row below" action={() => c().addRowAfter().run()}>+R</B>
            <B label="Delete row" action={() => c().deleteRow().run()}>−R</B>
            <B label="Add column right" action={() => c().addColumnAfter().run()}>+C</B>
            <B label="Delete column" action={() => c().deleteColumn().run()}>−C</B>
            <B label="Delete table" action={() => c().deleteTable().run()}>✕⊞</B>
          </>
        )}
      </div>
      <EditorContent
        editor={editor}
        className="editor-body"
        onKeyUp={updateSlash}
        onKeyDownCapture={(e) => {
          if (!slash) return;
          if (e.key === 'ArrowDown') { e.preventDefault(); setSlash((s) => ({ ...s, index: (s.index + 1) % s.items.length })); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setSlash((s) => ({ ...s, index: (s.index - 1 + s.items.length) % s.items.length })); }
          else if (e.key === 'Enter') { e.preventDefault(); runSlash(slash.items[slash.index]); }
          else if (e.key === 'Escape') { e.preventDefault(); setSlash(null); }
        }}
      />
      {slash && (
        <div className="slash-menu" style={{ left: slash.coords.left, top: slash.coords.top }}>
          {slash.items.map((c, i) => (
            <div
              key={c.key}
              className={'slash-item' + (i === slash.index ? ' active' : '')}
              onMouseEnter={() => setSlash((s) => ({ ...s, index: i }))}
              onMouseDown={(e) => { e.preventDefault(); runSlash(c); }}
            >
              <span className="slash-item-key">/{c.key}</span>
              <span className="slash-item-title">{c.title}</span>
              <span className="slash-item-desc">{c.desc}</span>
            </div>
          ))}
        </div>
      )}
      {backlinks.length > 0 && (
        <div className="backlinks">
          <div className="backlinks-label">◂ LINKED FROM ({backlinks.length})</div>
          {backlinks.map((b) => (
            <span key={b.rel} className="backlink" onClick={() => onRenamed(b.rel)}>
              {b.title} <span className="muted">· {b.project}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
