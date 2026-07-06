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
      <h2>Trash</h2>
      <p className="muted">Pages are kept for 30 days, then removed automatically.</p>
      {items.length === 0 && <div className="muted pad">Trash is empty.</div>}
      {items.map((t) => (
        <div className="trash-row" key={t.id}>
          <div>
            <div className="trash-title">{t.title}</div>
            <div className="trash-meta">{t.rel} · deleted {new Date(t.when).toLocaleString()}</div>
          </div>
          <button onClick={() => restore(t.id)}>Restore</button>
        </div>
      ))}
    </div>
  );
}
