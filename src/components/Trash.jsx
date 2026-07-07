import React, { useEffect, useState } from 'react';

const invoke = (...a) => window.bludos.invoke(...a);

export default function Trash({ onRestored }) {
  const [items, setItems] = useState([]);

  useEffect(() => { invoke('trash:list').then(setItems); }, []);

  const restore = async (id) => {
    await invoke('trash:restore', id);
    setItems(await invoke('trash:list'));
    onRestored();
  };

  return (
    <div className="trash">
      <div className="trench-depth" aria-hidden="true">≋≋≋</div>
      <h2><span className="panel-tag">▮ TRENCH_LOG</span> <span className="panel-sub">DEPTH: 30 DAYS</span></h2>
      <p className="muted">Nuked items sink to the Trench. Salvageable for 30 days — then they dissolve for good.</p>
      {items.length === 0 && <div className="muted pad">Trash is empty.</div>}
      {items.map((t) => (
        <div className="trash-row" key={t.id}>
          <div>
            <div className="trash-title">
              <span className="kind-badge">{t.kind === 'asset' ? 'ASSET' : 'PAGE'}</span> {t.title}
            </div>
            <div className="trash-meta">{t.kind === 'asset' ? 'archive asset' : t.rel} · deleted {new Date(t.when).toLocaleString()}</div>
          </div>
          <button onClick={() => restore(t.id)} title="Restore to its original place">⚓ SALVAGE</button>
        </div>
      ))}
    </div>
  );
}
