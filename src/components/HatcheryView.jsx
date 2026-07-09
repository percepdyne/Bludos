import React, { useEffect, useState } from 'react';
import { PetArt, speciesName } from '../tools/pets.jsx';

const invoke = (...a) => window.bludos.invoke(...a);

const NEXT_AT = { 1: 15, 2: 45, 3: 75, 4: 100 };

export default function HatcheryView({ onChanged }) {
  const [pets, setPets] = useState([]);
  const [complete, setComplete] = useState(null); // pet being completed
  const [msg, setMsg] = useState('');
  const refresh = () => invoke('pets:summary').then(setPets);
  useEffect(() => { refresh(); }, []);

  const active = pets.filter((p) => p.status === 'active');
  const kept = pets.filter((p) => p.status === 'kept');

  const doComplete = async (project, keep) => {
    const r = await invoke('pets:complete', project, keep);
    if (!r.ok && r.keptFull) { setMsg('Display is full (3). Retire a kept companion to a card first.'); return; }
    setComplete(null);
    setMsg(keep ? 'Companion kept on display.' : 'Minted as an achievement card in your Deck.');
    setTimeout(() => setMsg(''), 3000);
    await refresh();
    onChanged && onChanged();
  };

  const retire = async (project) => { await invoke('pets:retire', project); await refresh(); onChanged && onChanged(); };

  const Card = ({ p, keptSlot }) => {
    const next = NEXT_AT[p.stage];
    return (
      <div className={'pet-card' + (p.prime ? ' prime' : '') + (p.rare ? ' rare' : '')}>
        <div className="pet-portrait">
          <PetArt species={p.species} stage={p.stage} hue={p.colorway} prime={p.prime} rare={p.rare} size={120} />
        </div>
        <div className="pet-name">{speciesName(p.species)}{p.rare ? ' ✦' : ''}</div>
        <div className="pet-project">{p.project}</div>
        <div className="pet-stage">{p.stageName}{p.prime ? ' · PRIME' : ''} · stage {Math.min(p.stage, 4)}/4</div>
        <div className="pet-bar"><div className="pet-bar-fill" style={{ width: p.completion + '%' }} /></div>
        <div className="pet-meta">
          <span>{p.completion}% · {p.docs} docs</span>
          <span>{p.stage >= 4 ? (p.prime ? 'MAX' : 'grown') : `next at ${next}%`}</span>
        </div>
        {keptSlot
          ? <button className="mini-full" onClick={() => retire(p.project)}>⬢ Retire to card</button>
          : <button className="mini-full" onClick={() => setComplete(p)}>✓ Complete project…</button>}
      </div>
    );
  };

  return (
    <div className="hatchery">
      <h2><span className="panel-tag">▮ HATCHERY</span> <span className="panel-sub">{active.length} INCUBATING · {kept.length}/3 ON DISPLAY</span></h2>
      {msg && <div className="hatchery-msg">{msg}</div>}

      {kept.length > 0 && <div className="col-label">★ ON DISPLAY</div>}
      <div className="pet-grid">{kept.map((p) => <Card key={p.project} p={p} keptSlot />)}</div>

      <div className="col-label" style={{ marginTop: 14 }}>INCUBATING — GROWS WITH PROJECT PROGRESS</div>
      <div className="pet-grid">{active.map((p) => <Card key={p.project} p={p} />)}</div>
      {active.length === 0 && kept.length === 0 && (
        <div className="muted pad">No companions yet — create a project and one hatches. (Disable this in Settings ▸ Companion.)</div>
      )}

      {complete && (
        <div className="overlay" onClick={() => setComplete(null)}>
          <div className="modal complete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ov-head">
              <span className="panel-tag">▮ PROJECT COMPLETE</span>
              <button className="close" onClick={() => setComplete(null)}>✕</button>
            </div>
            <div className="complete-body">
              <PetArt species={complete.species} stage={complete.stage} hue={complete.colorway} prime={complete.prime} rare={complete.rare} size={140} />
              <div className="complete-info">
                <div className="pet-name">{speciesName(complete.species)}</div>
                <div className="pet-project">{complete.project}</div>
                <div className="pet-stage">{complete.stageName}{complete.prime ? ' · PRIME' : ''} · {complete.completion}% · {complete.docs} docs · {complete.daysActive}d</div>
                <p className="set-hint">Choose this companion's fate:</p>
                <div className="complete-actions">
                  <button className="primary" onClick={() => doComplete(complete.project, true)}>★ Keep on display ({kept.length}/3)</button>
                  <button onClick={() => doComplete(complete.project, false)}>⬢ Mint achievement card</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
