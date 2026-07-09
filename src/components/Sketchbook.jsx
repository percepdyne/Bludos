import React, { useEffect, useRef, useState } from 'react';

const invoke = (...a) => window.bludos.invoke(...a);
const COLORS = ['#191b16', '#c8f31d', '#67e8f9', '#e5484d', '#2271b3', '#f6a950', '#ffffff'];

// Pressure-aware sketch canvas. Best with a stylus on a tablet; falls back to
// mouse. Saves a PNG into the Archive.
export default function Sketchbook({ projects }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const last = useRef(null);
  const [tool, setTool] = useState('pen'); // pen | marker | eraser
  const [color, setColor] = useState('#191b16');
  const [project, setProject] = useState(projects[0] || '');
  const [saved, setSaved] = useState('');
  const strokes = useRef(false);

  useEffect(() => {
    const cv = canvasRef.current;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#f1f0ea';
    ctx.fillRect(0, 0, cv.width, cv.height);
  }, []);

  const pos = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (canvasRef.current.width / r.width),
      y: (e.clientY - r.top) * (canvasRef.current.height / r.height),
      p: e.pressure && e.pressure > 0 ? e.pressure : 0.5,
    };
  };

  const down = (e) => { drawing.current = true; last.current = pos(e); canvasRef.current.setPointerCapture(e.pointerId); };
  const move = (e) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current.getContext('2d');
    const cur = pos(e);
    const base = tool === 'marker' ? 10 : tool === 'eraser' ? 22 : 3;
    ctx.strokeStyle = tool === 'eraser' ? '#f1f0ea' : color;
    ctx.globalAlpha = tool === 'marker' ? 0.4 : 1;
    ctx.lineWidth = base * (0.4 + cur.p);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(cur.x, cur.y);
    ctx.stroke();
    ctx.globalAlpha = 1;
    last.current = cur;
    strokes.current = true;
  };
  const up = () => { drawing.current = false; };

  const clear = () => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.fillStyle = '#f1f0ea';
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    strokes.current = false;
  };

  const save = async () => {
    const b64 = canvasRef.current.toDataURL('image/png').split(',')[1];
    const name = 'Sketch ' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-') + '.png';
    await invoke('sketch:save', name, b64, { project, tags: ['sketch'] });
    setSaved('Saved to Archive ✓');
    setTimeout(() => setSaved(''), 2500);
  };

  return (
    <div className="sketchbook">
      <div className="sketch-bar">
        <span className="panel-tag">▮ SKETCHBOOK</span>
        <span className="panel-sub">STYLUS-READY</span>
        <span className="sketch-tools">
          {['pen', 'marker', 'eraser'].map((t) => (
            <button key={t} className={'tb' + (tool === t ? ' on' : '')} onClick={() => setTool(t)}>
              {t === 'pen' ? '✒' : t === 'marker' ? '🖊' : '⌫'} {t}
            </button>
          ))}
        </span>
        <span className="sketch-colors">
          {COLORS.map((c) => (
            <button key={c} className={'sw' + (color === c ? ' on' : '')} style={{ background: c }} onClick={() => setColor(c)} />
          ))}
        </span>
        <button onClick={clear}>Clear</button>
        <select value={project} onChange={(e) => setProject(e.target.value)}>
          {projects.length === 0 && <option value="">(no project)</option>}
          {projects.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <button className="primary" onClick={save}>⤓ SAVE TO ARCHIVE</button>
        {saved && <span className="save-state" style={{ color: 'var(--lime)' }}>{saved}</span>}
      </div>
      <div className="sketch-stage">
        <canvas
          ref={canvasRef}
          width={1200}
          height={820}
          className="sketch-canvas"
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerLeave={up}
        />
      </div>
      <p className="sketch-hint">Draw with a stylus (pressure-sensitive) or mouse. Best on a tablet — open Bludos on a pen-enabled screen.</p>
    </div>
  );
}
