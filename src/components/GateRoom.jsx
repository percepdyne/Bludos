import React, { useEffect, useState } from 'react';

const invoke = (...a) => window.bludos.invoke(...a);

// Full-screen program dashboard: every project × every phase, checklist
// completion bars and document statuses — built for the gate-review TV.
export default function GateRoom({ onOpenPage }) {
  const [data, setData] = useState(null);

  useEffect(() => { invoke('gates:summary').then(setData); }, []);

  if (!data) return <div className="gateroom"><div className="muted pad">READING PROGRAM STATE…</div></div>;

  const pct = (ph) => (ph.done + ph.todo === 0 ? null : Math.round(ph.done / (ph.done + ph.todo) * 100));
  const health = (proj) => {
    let d = 0, t = 0;
    for (const ph of proj.phases) { d += ph.done; t += ph.done + ph.todo; }
    return t === 0 ? 0 : Math.round((d / t) * 100);
  };
  const grade = (h) => (h >= 90 ? 'A' : h >= 75 ? 'B' : h >= 55 ? 'C' : h >= 30 ? 'D' : 'E');

  return (
    <div className="gateroom">
      <header className="gate-head">
        <h2><span className="panel-tag">▮ GATE ROOM</span> <span className="panel-sub">CHECKLIST COMPLETION ACROSS ALL PHASES</span></h2>
      </header>
      {data.length === 0 && <div className="muted pad">No projects on file.</div>}
      {data.map((proj) => (
        <section key={proj.name} className="gate-proj">
          <div className="gate-proj-name">
            {proj.name}
            <span className={'health-badge g-' + grade(health(proj))}>HEALTH {health(proj)}% · {grade(health(proj))}</span>
          </div>
          <div className="gate-grid">
            {proj.phases.map((ph) => {
              const p = pct(ph);
              return (
                <div
                  key={ph.name}
                  className={'gate-cell' + (ph.pages === 0 ? ' empty' : '') + (p === 100 ? ' complete' : '')}
                  title={`${ph.name} — ${ph.pages} docs, ${ph.done}/${ph.done + ph.todo} items`}
                  onClick={() => ph.firstRel && onOpenPage(ph.firstRel)}
                >
                  <div className="gate-cell-name">{ph.name.replace(/^\d+\s*/, '')}</div>
                  <div className="gate-bar">
                    <div className="gate-bar-fill" style={{ width: (p ?? 0) + '%' }} />
                  </div>
                  <div className="gate-cell-meta">
                    <span>{ph.pages} DOC{ph.pages === 1 ? '' : 'S'}</span>
                    <span>{p === null ? '—' : p + '%'}</span>
                  </div>
                  {Object.keys(ph.statuses).length > 0 && (
                    <div className="gate-statuses">
                      {Object.entries(ph.statuses).map(([s, ct]) => (
                        <span key={s} className={'gate-st s-' + s.toLowerCase().replace(/\s/g, '-')}>{ct} {s.toUpperCase()}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
