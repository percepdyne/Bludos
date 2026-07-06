import React, { useRef, useState } from 'react';

const invoke = (...a) => window.bludos.invoke(...a);

export default function Sidebar({
  tree, activeRel,
  onOpenPage, onNewPage, onTrashPage, onNewProject,
  onShowTemplates, onShowArchive, onShowTrash, onHome,
}) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const [open, setOpen] = useState({});
  const timer = useRef();

  const onSearch = (val) => {
    setQ(val);
    clearTimeout(timer.current);
    if (val.trim().length < 2) { setResults(null); return; }
    timer.current = setTimeout(async () => setResults(await invoke('search:query', val)), 250);
  };

  const toggle = (key) => setOpen((o) => ({ ...o, [key]: !o[key] }));

  return (
    <aside className="sidebar">
      <div className="brand" onClick={onHome} title="Home">
        <span className="brand-mark">◆</span> BLUDOS <span className="brand-sub">blue dossier</span>
      </div>
      <input
        className="search"
        placeholder="Search everything…  (min 2 chars)"
        value={q}
        onChange={(e) => onSearch(e.target.value)}
      />

      {results ? (
        <div className="results">
          {results.length === 0 && <div className="muted pad">No matches.</div>}
          {results.map((r, i) => (
            <div
              key={i}
              className="result"
              onClick={() => {
                if (r.type === 'page') onOpenPage(r.rel);
                else onShowArchive();
                setResults(null);
                setQ('');
              }}
            >
              <div className="result-title">{r.type === 'asset' ? '🗃 ' : '📄 '}{r.title}</div>
              <div className="result-meta">{r.project}{r.folder ? ' · ' + r.folder : ''}</div>
              {r.snippet && <div className="result-snippet">…{r.snippet}…</div>}
            </div>
          ))}
        </div>
      ) : (
        <div className="tree">
          {tree.projects.map((proj) => (
            <div key={proj.name}>
              <div className="tree-project" onClick={() => toggle(proj.name)}>
                <span className="chev">{open[proj.name] ? '▾' : '▸'}</span> {proj.name}
              </div>
              {open[proj.name] &&
                proj.folders.map((folder) => {
                  const fkey = proj.name + '/' + folder.name;
                  return (
                    <div key={fkey}>
                      <div className="tree-folder" onClick={() => toggle(fkey)}>
                        <span className="chev">{open[fkey] ? '▾' : '▸'}</span>
                        <span className="tree-folder-name">{folder.name}</span>
                        <span className="count">{folder.pages.length || ''}</span>
                        <button
                          className="mini"
                          title="New page here"
                          onClick={(e) => { e.stopPropagation(); onNewPage(proj.name, folder.name); }}
                        >+</button>
                      </div>
                      {open[fkey] &&
                        folder.pages.map((pg) => (
                          <div
                            key={pg.rel}
                            className={'tree-page' + (pg.rel === activeRel ? ' active' : '')}
                            onClick={() => onOpenPage(pg.rel)}
                          >
                            <span className="tree-page-title">{pg.title}</span>
                            <button
                              className="mini danger"
                              title="Move to trash"
                              onClick={(e) => { e.stopPropagation(); onTrashPage(pg.rel); }}
                            >✕</button>
                          </div>
                        ))}
                    </div>
                  );
                })}
            </div>
          ))}
          {tree.projects.length === 0 && (
            <div className="muted pad">No projects yet.<br />Create one below.</div>
          )}
        </div>
      )}

      <div className="sidebar-actions">
        <button onClick={onShowTemplates}>▤ Templates</button>
        <button onClick={onShowArchive}>🗃 Archive</button>
        <button onClick={onShowTrash}>♻ Trash</button>
        <button className="primary" onClick={onNewProject}>+ New Project</button>
      </div>
    </aside>
  );
}
