import React, { useEffect, useRef, useState } from 'react';
import { fb } from '../tools/feedback.js';

const invoke = (...a) => window.bludos.invoke(...a);

const STAMPS = [
  { kind: 'APPROVED', color: '#1f8a4c' },
  { kind: 'DRAFT', color: '#8a6d1f' },
  { kind: 'CONFIDENTIAL', color: '#b3271e' },
  { kind: 'REVISED', color: '#2166a8' },
  { kind: '⚠ HOLD', color: '#c2334d' },
];

// Overlay of rubber stamps, redaction bars, and freehand doodles on a page.
// Coords are fractions (0..1) of the sheet so they survive resize. When
// `active` is false the layer is inert (visible but not editable).
export default function MarkupLayer({ rel, active, operator }) {
  const [ov, setOv] = useState({ stamps: [], redactions: [], doodles: [] });
  const [tool, setTool] = useState('stamp'); // stamp | redact | draw
  const [stampKind, setStampKind] = useState(0);
  const wrap = useRef(null);
  const drag = useRef(null);
  const drawing = useRef(null);
  const saveTimer = useRef(null);

  useEffect(() => { invoke('overlay:read', rel).then((o) => setOv({ stamps: [], redactions: [], doodles: [], ...o })); }, [rel]);

  const persist = (next) => {
    setOv(next);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => invoke('overlay:write', rel, next), 400);
  };

  const frac = (e) => {
    const r = wrap.current.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };

  const addStamp = () => {
    const s = STAMPS[stampKind];
    const text = s.dated ? `✔ ${operator || 'APPROVED'} · ${new Date().toISOString().slice(0, 10)}` : s.kind;
    persist({ ...ov, stamps: [...ov.stamps, { id: Date.now() + '', kind: s.kind, text, color: s.color, x: 0.5, y: 0.28, rot: -8 + Math.random() * 16 }] });
    fb.thunk();
  };
  const addDatedStamp = () => {
    persist({ ...ov, stamps: [...ov.stamps, { id: Date.now() + '', kind: 'APPROVAL', text: `✔ ${operator || 'APPROVED'} · ${new Date().toISOString().slice(0, 10)}`, color: '#1f8a4c', x: 0.5, y: 0.28, rot: -6 } ] });
    fb.thunk();
  };

  // dragging a stamp
  const onStampDown = (e, id) => {
    if (!active) return;
    e.stopPropagation();
    drag.current = { id };
  };
  const onMove = (e) => {
    if (drag.current) {
      const f = frac(e);
      setOv((o) => ({ ...o, stamps: o.stamps.map((s) => (s.id === drag.current.id ? { ...s, x: f.x, y: f.y } : s)) }));
    } else if (drawing.current) {
      const f = frac(e);
      if (tool === 'redact') {
        drawing.current.cur = f;
        setOv((o) => ({ ...o, _preview: rect(drawing.current.start, f) }));
      } else if (tool === 'draw') {
        drawing.current.pts.push(f);
        setOv((o) => ({ ...o, _preview: null, doodles: o.doodles }));
        setPath(pathFrom(drawing.current.pts));
      }
    }
  };
  const onUp = () => {
    if (drag.current) { persist({ ...ov }); drag.current = null; return; }
    if (drawing.current) {
      if (tool === 'redact' && drawing.current.cur) {
        const r = rect(drawing.current.start, drawing.current.cur);
        if (r.w > 0.01 && r.h > 0.01) persist({ ...ov, _preview: undefined, redactions: [...ov.redactions, { id: Date.now() + '', ...r }] });
        else setOv((o) => ({ ...o, _preview: undefined }));
      } else if (tool === 'draw' && drawing.current.pts.length > 1) {
        persist({ ...ov, doodles: [...ov.doodles, { id: Date.now() + '', path: pathFrom(drawing.current.pts, true), color: '#b3271e', width: 0.4 }] });
        setPath('');
      }
      drawing.current = null;
    }
  };
  const onDown = (e) => {
    if (!active) return;
    const f = frac(e);
    if (tool === 'redact') drawing.current = { start: f, cur: f };
    else if (tool === 'draw') drawing.current = { pts: [f] };
  };

  const [livePath, setPath] = useState('');
  const del = (arr, id, e) => { e.stopPropagation(); persist({ ...ov, [arr]: ov[arr].filter((x) => x.id !== id) }); };

  return (
    <>
      {active && (
        <div className="markup-toolbar">
          <span className="tb-hint">MARKUP</span>
          <button className={'tb' + (tool === 'stamp' ? ' on' : '')} onClick={() => setTool('stamp')}>◆ Stamp</button>
          <button className={'tb' + (tool === 'redact' ? ' on' : '')} onClick={() => setTool('redact')}>▮ Redact</button>
          <button className={'tb' + (tool === 'draw' ? ' on' : '')} onClick={() => setTool('draw')}>✎ Draw</button>
          {tool === 'stamp' && (
            <span className="stamp-palette">
              {STAMPS.map((s, i) => (
                <button key={s.kind} className={'stamp-pick' + (i === stampKind ? ' on' : '')}
                  style={{ color: s.color, borderColor: s.color }} onClick={() => setStampKind(i)}>{s.kind}</button>
              ))}
              <button className="tb on" onClick={addStamp}>+ place</button>
              <button className="tb" onClick={addDatedStamp} title="Dated approval stamp with your name">+ approval</button>
            </span>
          )}
        </div>
      )}
      <div
        ref={wrap}
        className={'markup-layer' + (active ? ' active tool-' + tool : '')}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
      >
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="markup-svg">
          {ov.doodles.map((d) => <path key={d.id} d={d.path} fill="none" stroke={d.color} strokeWidth={d.width} strokeLinecap="round" />)}
          {livePath && <path d={livePath} fill="none" stroke="#b3271e" strokeWidth="0.4" strokeLinecap="round" />}
        </svg>
        {ov.redactions.map((r) => (
          <div key={r.id} className="redaction" style={{ left: r.x * 100 + '%', top: r.y * 100 + '%', width: r.w * 100 + '%', height: r.h * 100 + '%' }}>
            {active && <button className="ov-del" onClick={(e) => del('redactions', r.id, e)}>✕</button>}
          </div>
        ))}
        {ov._preview && (
          <div className="redaction preview" style={{ left: ov._preview.x * 100 + '%', top: ov._preview.y * 100 + '%', width: ov._preview.w * 100 + '%', height: ov._preview.h * 100 + '%' }} />
        )}
        {ov.stamps.map((s) => (
          <div key={s.id} className={'stamp' + (active ? ' grab' : '')} style={{ left: s.x * 100 + '%', top: s.y * 100 + '%', transform: `translate(-50%,-50%) rotate(${s.rot}deg)`, color: s.color, borderColor: s.color }}
            onPointerDown={(e) => onStampDown(e, s.id)}>
            {s.text}
            {active && <button className="ov-del" onClick={(e) => del('stamps', s.id, e)}>✕</button>}
          </div>
        ))}
      </div>
    </>
  );
}

function rect(a, b) { return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y) }; }
function pathFrom(pts, close) {
  if (!pts.length) return '';
  const P = (p) => `${(p.x * 100).toFixed(2)} ${(p.y * 100).toFixed(2)}`;
  return 'M' + P(pts[0]) + pts.slice(1).map((p) => ' L' + P(p)).join('') + (close ? '' : '');
}
