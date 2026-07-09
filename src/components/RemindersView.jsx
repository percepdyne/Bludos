import React, { useEffect, useState } from 'react';

const invoke = (...a) => window.bludos.invoke(...a);

const when = (iso) => {
  const d = new Date(iso), now = Date.now();
  const diff = d.getTime() - now;
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60000), hrs = Math.round(abs / 3.6e6), days = Math.round(abs / 8.64e7);
  const rel = mins < 60 ? `${mins}m` : hrs < 48 ? `${hrs}h` : `${days}d`;
  return (diff < 0 ? 'overdue ' + rel : 'in ' + rel) + ' · ' + d.toLocaleString();
};

export default function RemindersView({ onOpenPage, onChanged }) {
  const [items, setItems] = useState([]);
  const refresh = () => invoke('reminders:list').then(setItems);
  useEffect(() => { refresh(); }, []);

  const act = async (fn) => { await fn; await refresh(); onChanged && onChanged(); };

  const pending = items.filter((r) => !r.done);
  const done = items.filter((r) => r.done);

  const Row = ({ r }) => {
    const overdue = !r.done && new Date(r.dueISO).getTime() < Date.now();
    return (
      <div className={'reminder-row' + (overdue ? ' overdue' : '') + (r.done ? ' done' : '')}>
        <button className="rem-check" title={r.done ? 'Mark not done' : 'Mark done'}
          onClick={() => act(invoke('reminders:update', r.id, { done: !r.done }))}>{r.done ? '☑' : '☐'}</button>
        <div className="rem-main">
          <div className="rem-text">{r.text}</div>
          <div className="rem-meta">
            {when(r.dueISO)}
            {r.rel && <span className="rem-link" onClick={() => onOpenPage(r.rel)}> · {r.rel.split('/').pop().replace(/\.md$/, '')}</span>}
          </div>
        </div>
        <button className="mini danger" title="Delete" onClick={() => act(invoke('reminders:remove', r.id))}>✕</button>
      </div>
    );
  };

  return (
    <div className="reminders-view">
      <h2><span className="panel-tag">▮ REMINDERS</span> <span className="panel-sub">{pending.length} PENDING</span></h2>
      {pending.length === 0 && <p className="muted">No pending reminders. Set one from any document with the 🔔 button.</p>}
      {pending.map((r) => <Row key={r.id} r={r} />)}
      {done.length > 0 && <div className="col-label" style={{ marginTop: 18 }}>DONE</div>}
      {done.map((r) => <Row key={r.id} r={r} />)}
    </div>
  );
}
