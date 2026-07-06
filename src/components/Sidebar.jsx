import React, { useRef, useState } from 'react';

const invoke = (...a) => window.bludos.invoke(...a);

export default function Sidebar({
  tree, activeRel, operator,
  onOpenPage, onNewPage, onTrashPage, onNewProject, onExportProject,
  onShowTemplates, onShowTemplatesAt, onShowArchive, onShowTrash, onHome,
  onSetOperator, onSwitchWorkspace,
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

  const pageCount = tree.projects.reduce(
    (n, pr) => n + pr.folders.reduce((m, f) => m + f.pages.length, 0), 0
  );

  return (
    <aside className="sidebar">
      <div className="brand" onClick={onHome} title="Home">
        <div className="brand-row"><span className="brand-mark">◆</span> BLUDOS</div>
        <div className="brand-sub">BLUE DOSSIER // LOCAL SYSTEM</div>
      </div>
      <input
        className="search"
        placeholder="⌕ SEARCH INDEX…  (CTRL+P TO JUMP)"
        value={q}
        onChange={(e) => onSearch(e.target.value)}
      />

      {results ? (
        <div className="results">
          <div className="col-label">RESULTS ▮ {String(results.length).padStart(3, '0')}</div>
          {results.length === 0 && <div className="muted pad">NO MATCHES</div>}
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
              <div className="result-title">{r.type === 'asset' ? '▣ ' : '▤ '}{r.title}</div>
              <div className="result-meta">{r.project}{r.folder ? ' · ' + r.folder : ''}</div>
              {r.snippet && <div className="result-snippet">…{r.snippet}…</div>}
            </div>
          ))}
        </div>
      ) : (
        <div className="tree">
          <div className="col-label">INDEX ▮ {String(tree.projects.length).padStart(2, '0')} PROJECTS</div>
          {tree.projects.map((proj) => (
            <div key={proj.name}>
              <div className="tree-project" onClick={() => toggle(proj.name)}>
                <span className="chev">{open[proj.name] ? '▾' : '▸'}</span>
                <span className="tree-project-name">{proj.name}</span>
                <button
                  className="mini"
                  title="Export project folder (Markdown + HTML + integrity manifest)"
                  onClick={(e) => { e.stopPropagation(); onExportProject(proj.name); }}
                >⤓</button>
              </div>
              {open[proj.name] &&
                proj.folders.map((folder) => {
                  const fkey = proj.name + '/' + folder.name;
                  return (
                    <div key={fkey}>
                      <div className={'tree-folder' + (folder.custom ? ' custom' : '')} onClick={() => toggle(fkey)}>
                        <span className="chev">{open[fkey] ? '▾' : '▸'}</span>
                        <span className="tree-folder-name">{folder.name}</span>
                        <span className="count">{folder.pages.length || ''}</span>
                        {!folder.virtual && (
                          <button
                            className="mini"
                            title="New page here"
                            onClick={(e) => { e.stopPropagation(); onNewPage(proj.name, folder.name); }}
                          >+</button>
                        )}
                      </div>
                      {open[fkey] && folder.pages.length === 0 && !folder.virtual && (
                        <div className="tree-empty">
                          <button className="ghost" onClick={() => onNewPage(proj.name, folder.name)}>+ PAGE</button>
                          <button className="ghost" onClick={() => onShowTemplatesAt(proj.name, folder.name)}>⊞ TEMPLATE</button>
                        </div>
                      )}
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
            <div className="muted pad">NO PROJECTS ON FILE.<br />INITIALIZE ONE BELOW.</div>
          )}
        </div>
      )}

      <div className="readout">
        <div>SYS ▮ LOCAL · OFFLINE-FIRST</div>
        <div>{String(tree.projects.length).padStart(2, '0')} PROJ · {String(pageCount).padStart(3, '0')} DOCS</div>
        <div className="readout-row">
          <span>OPERATOR: {operator || '—'}</span>
          <button className="mini-inline" title="Set your name (stamped as author)" onClick={onSetOperator}>✎</button>
        </div>
        <div className="readout-row">
          <span className="readout-dim">{(tree.root || '').replace(/\\/g, '/')}</span>
          <button className="mini-inline" title="Switch workspace folder (e.g. a shared drive)" onClick={onSwitchWorkspace}>⇄</button>
        </div>
      </div>
      <div className="sidebar-actions">
        <button onClick={onShowTemplates}>▤ TEMPLATES</button>
        <button onClick={onShowArchive}>▣ ARCHIVE</button>
        <button onClick={onShowTrash}>♻ TRASH</button>
        <button className="primary" onClick={onNewProject}>+ NEW PROJECT</button>
      </div>
    </aside>
  );
}
