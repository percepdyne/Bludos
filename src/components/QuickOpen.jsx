import React, { useEffect, useMemo, useRef, useState } from 'react';

// Ctrl+P palette: instant navigation over the already-loaded tree, with
// recently-opened pages shown when the query is empty.
export default function QuickOpen({ tree, recents, onOpen, onClose }) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const ref = useRef(null);

  useEffect(() => { ref.current?.focus(); }, []);

  const allPages = useMemo(() => {
    const out = [];
    for (const proj of tree.projects) {
      for (const folder of proj.folders) {
        for (const pg of folder.pages) {
          out.push({ rel: pg.rel, title: pg.title, where: proj.name + ' ▸ ' + folder.name });
        }
      }
    }
    return out;
  }, [tree]);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) {
      return recents
        .map((rel) => allPages.find((p) => p.rel === rel))
        .filter(Boolean)
        .slice(0, 8);
    }
    const scored = [];
    for (const p of allPages) {
      const t = p.title.toLowerCase();
      const w = p.where.toLowerCase();
      let score = 0;
      if (t.startsWith(query)) score = 3;
      else if (t.includes(query)) score = 2;
      else if (w.includes(query)) score = 1;
      if (score) scored.push({ ...p, score });
    }
    return scored.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, 12);
  }, [q, allPages, recents]);

  useEffect(() => { setSel(0); }, [q]);

  const onKey = (e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && results[sel]) { onOpen(results[sel].rel); onClose(); }
  };

  return (
    <div className="overlay qo-overlay" onClick={onClose}>
      <div className="qo" onClick={(e) => e.stopPropagation()}>
        <input
          ref={ref}
          className="qo-input"
          placeholder="⌕ JUMP TO DOCUMENT…  (↑↓ + ENTER)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKey}
        />
        <div className="qo-list">
          {!q.trim() && results.length > 0 && <div className="col-label">RECENT</div>}
          {results.map((r, i) => (
            <div
              key={r.rel}
              className={'qo-row' + (i === sel ? ' active' : '')}
              onMouseEnter={() => setSel(i)}
              onClick={() => { onOpen(r.rel); onClose(); }}
            >
              <span className="qo-title">{r.title}</span>
              <span className="qo-where">{r.where}</span>
            </div>
          ))}
          {results.length === 0 && <div className="muted pad">{q.trim() ? 'NO MATCHES' : 'NO RECENT DOCUMENTS'}</div>}
        </div>
      </div>
    </div>
  );
}
