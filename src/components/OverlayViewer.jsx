import React, { useEffect, useRef, useState } from 'react';

// Composition overlay viewer: golden spiral / golden sections / thirds /
// diagonal grid over any archive image. View-only (annotation lands in Wave 2).

const MODES = ['none', 'thirds', 'golden', 'spiral', 'grid'];

// Logarithmic golden spiral (r = a·φ^(2θ/π)) as a polyline, eye placed at the
// golden point (61.8% / 38.2%) — the classic composition guide position.
function spiralPath(w, h) {
  const PHI = (1 + Math.sqrt(5)) / 2;
  const b = Math.log(PHI) / (Math.PI / 2);
  const thetaMax = 3 * 2 * Math.PI;
  const rMax = Math.min(w, h) * 0.48;
  const a = rMax / Math.exp(b * thetaMax);
  const cx = w * 0.618, cy = h * 0.382;
  let d = '';
  for (let t = 0; t <= thetaMax; t += 0.05) {
    const r = a * Math.exp(b * t);
    const px = cx + r * Math.cos(t);
    const py = cy + r * Math.sin(t);
    d += (t === 0 ? 'M' : 'L') + px.toFixed(1) + ' ' + py.toFixed(1);
  }
  return d;
}

export default function OverlayViewer({ asset, onClose }) {
  const imgRef = useRef(null);
  const [mode, setMode] = useState('golden');
  const [opacity, setOpacity] = useState(0.8);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [dims, setDims] = useState(null);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const measured = () => {
    const el = imgRef.current;
    if (el) setDims({ w: el.clientWidth, h: el.clientHeight });
  };

  // keep the overlay glued to the image when the window resizes
  useEffect(() => {
    const el = imgRef.current;
    if (!el || !window.ResizeObserver) return;
    const ro = new ResizeObserver(measured);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const line = (x1, y1, x2, y2, k) => (
    <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--lime)" strokeWidth="1.25" />
  );

  const overlay = () => {
    if (!dims || mode === 'none') return null;
    const { w, h } = dims;
    const els = [];
    if (mode === 'thirds') {
      els.push(line(w / 3, 0, w / 3, h, 'v1'), line((2 * w) / 3, 0, (2 * w) / 3, h, 'v2'));
      els.push(line(0, h / 3, w, h / 3, 'h1'), line(0, (2 * h) / 3, w, (2 * h) / 3, 'h2'));
    }
    if (mode === 'golden') {
      const a = 1 / 1.618;
      els.push(line(w * (1 - a), 0, w * (1 - a), h, 'v1'), line(w * a, 0, w * a, h, 'v2'));
      els.push(line(0, h * (1 - a), w, h * (1 - a), 'h1'), line(0, h * a, w, h * a, 'h2'));
    }
    if (mode === 'spiral') {
      els.push(<path key="sp" d={spiralPath(w, h)} fill="none" stroke="var(--lime)" strokeWidth="1.5" />);
    }
    if (mode === 'grid') {
      for (let x = 0; x <= w; x += 40) els.push(line(x, 0, x, h, 'g' + x));
      for (let y = 0; y <= h; y += 40) els.push(line(0, y, w, y, 'gy' + y));
      for (let x = -h; x <= w; x += 80) els.push(line(x, 0, x + h, h, 'gd' + x));
    }
    const transform = `scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1})`;
    return (
      <svg className="overlay-svg" width={w} height={h} style={{ opacity, transform }}>
        {els}
      </svg>
    );
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="overlay-viewer" onClick={(e) => e.stopPropagation()}>
        <div className="ov-head">
          <span className="panel-tag">▮ COMPOSITION OVERLAY</span>
          <span className="panel-sub">{asset.name}</span>
          <button className="close" onClick={onClose}>✕</button>
        </div>
        <div className="ov-stage">
          <div className="ov-img-wrap">
            <img ref={imgRef} src={asset.url} alt={asset.name} onLoad={measured} />
            {overlay()}
          </div>
        </div>
        <div className="ov-controls">
          {MODES.map((m) => (
            <button key={m} className={mode === m ? 'primary' : ''} onClick={() => setMode(m)}>
              {m === 'none' ? 'OFF' : m === 'thirds' ? '⊞ THIRDS' : m === 'golden' ? 'φ SECTIONS' : m === 'spiral' ? '𝜑 SPIRAL' : '▦ GRID'}
            </button>
          ))}
          <button onClick={() => setFlipH(!flipH)} title="Mirror the overlay horizontally">⇋ FLIP H</button>
          <button onClick={() => setFlipV(!flipV)} title="Mirror the overlay vertically">⇅ FLIP V</button>
          <label className="ov-opacity">
            <span className="tf-unit">OPACITY</span>
            <input type="range" min="0.2" max="1" step="0.1" value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} />
          </label>
        </div>
      </div>
    </div>
  );
}
