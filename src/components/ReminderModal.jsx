import React, { useEffect, useState } from 'react';
import { localIso } from '../tools/notary.js';

const invoke = (...a) => window.bludos.invoke(...a);

const atHour = (daysAhead, hour) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(hour, 0, 0, 0);
  return d;
};
const inHours = (h) => new Date(Date.now() + h * 3600 * 1000);

const PRESETS = [
  ['In 1 hour', () => inHours(1)],
  ['In 3 hours', () => inHours(3)],
  ['Tomorrow 9am', () => atHour(1, 9)],
  ['In 3 days', () => atHour(3, 9)],
  ['Next week', () => atHour(7, 9)],
];

// datetime-local wants "YYYY-MM-DDTHH:mm" in local time
const toLocalInput = (d) => localIso(d).slice(0, 16);

export default function ReminderModal({ rel, project, title, onClose, onSaved }) {
  const [text, setText] = useState(title ? `Review: ${title}` : '');
  const [when, setWhen] = useState(toLocalInput(atHour(1, 9)));

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const save = async () => {
    if (!text.trim()) return;
    const dueISO = new Date(when).toISOString();
    await invoke('reminders:add', { text: text.trim(), dueISO, rel: rel || '', project: project || '' });
    onSaved && onSaved();
    onClose();
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal prompt-modal" onClick={(e) => e.stopPropagation()}>
        <h3>🔔 Set a reminder</h3>
        <input placeholder="What should you be reminded of?" value={text} onChange={(e) => setText(e.target.value)} autoFocus />
        <div className="reminder-presets">
          {PRESETS.map(([label, fn]) => (
            <button key={label} onClick={() => setWhen(toLocalInput(fn()))}>{label}</button>
          ))}
        </div>
        <label className="tf" style={{ marginTop: 10 }}>
          <span className="tf-label">WHEN</span>
          <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
        </label>
        <div className="prompt-actions">
          <button onClick={onClose}>Cancel</button>
          <button className="primary" onClick={save}>Set reminder</button>
        </div>
      </div>
    </div>
  );
}
