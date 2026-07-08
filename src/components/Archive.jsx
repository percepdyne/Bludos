import React, { useEffect, useRef, useState } from 'react';
import OverlayViewer from './OverlayViewer.jsx';
import { extractPalette, paletteMatches } from '../tools/palette.js';

const invoke = (...a) => window.bludos.invoke(...a);

const GLYPHS = { pdf: 'PDF', cad: 'CAD', doc: 'DOC', link: '🔗', file: '⬚' };

export default function Archive() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [dragging, setDragging] = useState(false);
  const [viewer, setViewer] = useState(null);
  const [colorQuery, setColorQuery] = useState(''); // hex to match, '' = off
  const palettes = useRef({}); // id -> [hex]

  useEffect(() => { invoke('archive:list').then(setItems); }, []);

  // Extract dominant palettes for image assets once (needs base64 from disk —
  // file:// URLs taint the canvas, so we read bytes through IPC).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const a of items) {
        if (a.kind !== 'image' || palettes.current[a.id]) continue;
        const data = await invoke('archive:read-b64', a.id);
        if (cancelled || !data) continue;
        palettes.current[a.id] = await extractPalette(`data:${data.mime};base64,${data.b64}`);
      }
      if (!cancelled) setItems((x) => [...x]); // repaint swatches
    })();
    return () => { cancelled = true; };
  }, [items.length]);

  const pickColor = async () => {
    if (!window.EyeDropper) return;
    try { const r = await new window.EyeDropper().open(); setColorQuery(r.sRGBHex.toUpperCase()); } catch { /* cancelled */ }
  };

  const onDrop = async (e) => {
    e.preventDefault();
    setDragging(false);
    const paths = [...e.dataTransfer.files].map((f) => window.bludos.filePath(f)).filter(Boolean);
    if (paths.length) setItems(await invoke('archive:add-files', paths, {}));
  };

  const addUrl = async () => {
    const u = urlInput.trim();
    if (!u) return;
    setItems(await invoke('archive:add-url', /^https?:\/\//i.test(u) ? u : 'https://' + u, {}));
    setUrlInput('');
  };

  const setTags = async (id, str) =>
    setItems(await invoke('archive:update', id, {
      tags: str.split(',').map((s) => s.trim()).filter(Boolean),
    }));

  const remove = async (id) => {
    if (window.confirm('☢ Nuke this asset? It sinks to the Trench and is salvageable for 30 days.')) {
      setItems(await invoke('archive:remove', id));
    }
  };

  const f = filter.trim().toLowerCase();
  const shown = items.filter((a) => {
    if (f && !(a.name + ' ' + (a.tags || []).join(' ')).toLowerCase().includes(f)) return false;
    if (colorQuery && !paletteMatches(palettes.current[a.id], colorQuery)) return false;
    return true;
  });

  return (
    <div
      className={'archive' + (dragging ? ' dragging' : '')}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <header className="archive-head">
        <h2><span className="panel-tag">▮ ARCHIVE_LOG</span> <span className="panel-sub">{String(items.length).padStart(3, '0')} ASSETS</span></h2>
        <input
          className="archive-filter"
          placeholder="Filter by name or tag…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <div className="color-search">
          {window.EyeDropper && <button onClick={pickColor} title="Search archive by color (pick from screen)">⊙ COLOR</button>}
          <input
            className="color-hex"
            placeholder="#hex"
            value={colorQuery}
            onChange={(e) => setColorQuery(e.target.value)}
            style={colorQuery ? { borderColor: colorQuery, color: colorQuery } : null}
          />
          {colorQuery && <button className="mini-inline" title="Clear color filter" onClick={() => setColorQuery('')}>✕</button>}
        </div>
        <div className="archive-url">
          <input
            placeholder="Paste an inspiration URL…"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addUrl()}
          />
          <button onClick={addUrl}>+ Link</button>
        </div>
        <button
          title="Export the assets currently shown as a printable contact sheet"
          onClick={() => shown.length && invoke('archive:contact-sheet', shown.map((a) => a.id))}
        >⎙ SHEET</button>
      </header>
      <p className="archive-hint">Drop images, PDFs, CAD files — anything — anywhere on this view to archive it.</p>
      <div className="grid">
        {shown.map((a, i) => (
          <div className="card" key={a.id}>
            <div className="card-code">
              <span>{String(shown.length - i).padStart(4, '0')}</span>
              <span>{(a.kind || 'file').toUpperCase()}</span>
            </div>
            <div className="thumb" onClick={() => invoke('archive:open', a.id)} title="Open">
              {a.kind === 'image'
                ? <img src={a.url} alt={a.name} loading="lazy" />
                : <span className={'glyph g-' + a.kind}>{GLYPHS[a.kind] || GLYPHS.file}</span>}
            </div>
            <div className="card-barcode" />
            {(palettes.current[a.id] || []).length > 0 && (
              <div className="card-palette">
                {palettes.current[a.id].map((h, k) => (
                  <span key={k} className="pal-sw" style={{ background: h }} title={h}
                    onClick={(e) => { e.stopPropagation(); setColorQuery(h); }} />
                ))}
              </div>
            )}
            <div className="card-name" title={a.name}>{a.name}</div>
            <TagInput initial={(a.tags || []).join(', ')} onCommit={(v) => setTags(a.id, v)} />
            {a.kind === 'image' && (
              <button className="card-ov" title="Composition overlays (thirds, golden, spiral)" onClick={() => setViewer(a)}>◫</button>
            )}
            <button className="card-del" title="Nuke — sinks to the Trench for 30 days" onClick={() => remove(a.id)}>☢</button>
          </div>
        ))}
        {shown.length === 0 && (
          <div className="muted pad">
            {items.length === 0 ? 'Nothing archived yet — drop a file here to start your dossier.' : 'No assets match the filter.'}
          </div>
        )}
      </div>
      {viewer && <OverlayViewer asset={viewer} onClose={() => setViewer(null)} />}
    </div>
  );
}

function TagInput({ initial, onCommit }) {
  const [val, setVal] = useState(initial);
  useEffect(() => setVal(initial), [initial]);
  return (
    <input
      className="tags"
      placeholder="tags, comma, separated"
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => val !== initial && onCommit(val)}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
    />
  );
}
