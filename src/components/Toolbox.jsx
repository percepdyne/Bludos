import React, { useEffect, useRef, useState } from 'react';
import { TOOL_PACKS } from '../tools/tools.jsx';

export default function Toolbox({ settings, operator, currentRel, onClose, onSaveSettings }) {
  const [toolId, setToolId] = useState(null);
  const [q, setQ] = useState('');
  const [collapsed, setCollapsed] = useState({});
  const [opened, setOpened] = useState({});     // lazy-mount memory — state survives back-nav
  const [resetKeys, setResetKeys] = useState({}); // bump to remount a tool at defaults
  const searchRef = useRef(null);

  const enabled = (packId) => (settings.toolPacks ? settings.toolPacks[packId] !== false : true);
  const packs = TOOL_PACKS.filter((p) => enabled(p.id));
  const allTools = packs.flatMap((p) => p.tools.map((t) => ({ ...t, packId: p.id, packTitle: p.title })));
  const active = allTools.find((t) => t.id === toolId) || null;
  const canInsert = !!currentRel;

  const pinned = settings.pinnedTools || [];
  const recent = settings.recentTools || [];

  useEffect(() => { if (!active) searchRef.current?.focus(); }, [active]);

  const open = (id) => {
    setToolId(id);
    setOpened((o) => ({ ...o, [id]: true }));
    const next = [id, ...recent.filter((x) => x !== id)].slice(0, 5);
    if (next.join() !== recent.join()) onSaveSettings({ recentTools: next });
  };

  const togglePin = (id, e) => {
    if (e) e.stopPropagation();
    onSaveSettings({
      pinnedTools: pinned.includes(id) ? pinned.filter((x) => x !== id) : [...pinned, id],
    });
  };

  const ql = q.trim().toLowerCase();
  const matches = ql
    ? allTools.filter((t) => (t.title + ' ' + t.desc + ' ' + t.packTitle).toLowerCase().includes(ql))
    : null;

  // Esc peels one layer at a time: tool → search → panel (unless a modal is up)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape' || document.querySelector('.overlay')) return;
      if (toolId) setToolId(null);
      else if (q) setQ('');
      else onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toolId, q, onClose]);

  const Row = ({ t, showPack }) => (
    <div className="tool-row" data-tid={t.id} onClick={() => open(t.id)}>
      <div className="tool-row-main">
        <div className="tool-row-title">{t.title}</div>
        <div className="tool-row-desc">{showPack ? t.packTitle + ' · ' : ''}{t.desc}</div>
      </div>
      <button
        className={'pin' + (pinned.includes(t.id) ? ' on' : '')}
        title={pinned.includes(t.id) ? 'Unpin' : 'Pin to top'}
        onClick={(e) => togglePin(t.id, e)}
      >{pinned.includes(t.id) ? '★' : '☆'}</button>
    </div>
  );

  const byId = (id) => allTools.find((t) => t.id === id);

  return (
    <aside className="toolbox">
      <div className="toolbox-head">
        {active ? (
          <>
            <button className="tb" onClick={() => setToolId(null)}>◂ BACK</button>
            <span className="panel-sub">{active.packTitle} ▸ {active.title.toUpperCase()}</span>
            <button
              className="tb"
              title="Reset this tool to defaults"
              onClick={() => setResetKeys((r) => ({ ...r, [active.id]: (r[active.id] || 0) + 1 }))}
            >↺</button>
            <button className="tb" title={pinned.includes(active.id) ? 'Unpin' : 'Pin to top'} onClick={() => togglePin(active.id)}>
              {pinned.includes(active.id) ? '★' : '☆'}
            </button>
          </>
        ) : (
          <>
            <span className="panel-tag">▮ TOOLBOX</span>
            <span className="panel-sub">{allTools.length} TOOLS · INSERT-AS-BLOCK</span>
          </>
        )}
        <button className="close" onClick={onClose}>✕</button>
      </div>
      {!active && (
        <input
          ref={searchRef}
          className="toolbox-search"
          placeholder={`⌕ SEARCH ${allTools.length} TOOLS…  (ESC CLEARS)`}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && matches && matches[0]) open(matches[0].id); }}
        />
      )}
      {!canInsert && (
        <div className="toolbox-note">No document open — tools work, but ⤓ INSERT needs an open page.</div>
      )}
      <div className="toolbox-body">
        <div style={{ display: active ? 'none' : 'block' }}>
          {matches ? (
            <>
              <div className="col-label">RESULTS ▮ {String(matches.length).padStart(2, '0')} — ENTER OPENS FIRST</div>
              {matches.map((t) => <Row key={'s' + t.id} t={t} showPack />)}
              {matches.length === 0 && <div className="muted pad">NO TOOLS MATCH "{q}"</div>}
            </>
          ) : (
            <>
              {pinned.length > 0 && (
                <>
                  <div className="col-label">★ PINNED</div>
                  {pinned.map(byId).filter(Boolean).map((t) => <Row key={'p' + t.id} t={t} showPack />)}
                </>
              )}
              {recent.length > 0 && (
                <>
                  <div className="col-label">RECENT</div>
                  {recent.map(byId).filter(Boolean).map((t) => <Row key={'r' + t.id} t={t} showPack />)}
                </>
              )}
              {packs.map((p) => (
                <div key={p.id}>
                  <div className="col-label pack-head" onClick={() => setCollapsed((c) => ({ ...c, [p.id]: !c[p.id] }))}>
                    <span className="chev">{collapsed[p.id] ? '▸' : '▾'}</span> {p.title} · {String(p.tools.length).padStart(2, '0')}
                  </div>
                  {!collapsed[p.id] && p.tools.map((t) => (
                    <Row key={t.id} t={{ ...t, packId: p.id, packTitle: p.title }} />
                  ))}
                </div>
              ))}
              {packs.length === 0 && <div className="muted pad">All tool packs disabled — enable them in Settings ▸ Toolbox.</div>}
            </>
          )}
        </div>
        {/* only tools that have been opened get mounted; they then stay mounted
            so entered values survive back-navigation. Reset = remount via key. */}
        {allTools.filter((t) => opened[t.id]).map((t) => (
          <div
            key={t.id + ':' + (resetKeys[t.id] || 0)}
            data-tool={t.id}
            style={{ display: active && active.id === t.id ? 'block' : 'none' }}
          >
            <t.component canInsert={canInsert} operator={operator} />
          </div>
        ))}
      </div>
    </aside>
  );
}
