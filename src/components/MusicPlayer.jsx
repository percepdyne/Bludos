import React, { useEffect, useRef, useState } from 'react';

const invoke = (...a) => window.bludos.invoke(...a);
const ACCENT = '#c8f31d';

// Kept mounted at App level so playback continues when the panel is closed.
export default function MusicPlayer({ open, onClose }) {
  const [tracks, setTracks] = useState([]);
  const [idx, setIdx] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const [shuffle, setShuffle] = useState(false);
  const [loop, setLoop] = useState(false);
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const graph = useRef({});
  const raf = useRef(null);

  useEffect(() => { invoke('music:list').then(setTracks); }, []);
  const cur = tracks[idx] || null;

  const start = (i) => { if (i >= 0 && i < tracks.length) setIdx(i); };
  const next = () => {
    if (!tracks.length) return;
    if (shuffle) return start(Math.floor(Math.random() * tracks.length));
    start((idx + 1) % tracks.length);
  };
  const prev = () => tracks.length && start((idx - 1 + tracks.length) % tracks.length);

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !cur) return;
    a.src = cur.url;
    a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [idx]);

  // WebAudio analyser wired lazily on first playback (needs a user gesture)
  const ensureGraph = () => {
    if (graph.current.ac || !audioRef.current) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      const ac = new AC();
      const src = ac.createMediaElementSource(audioRef.current);
      const an = ac.createAnalyser();
      an.fftSize = 64;
      src.connect(an); an.connect(ac.destination);
      graph.current = { ac, an };
    } catch { /* visualizer optional */ }
  };

  const toggle = async () => {
    const a = audioRef.current;
    if (!a) return;
    ensureGraph();
    if (graph.current.ac?.state === 'suspended') graph.current.ac.resume();
    if (a.paused) { if (idx < 0 && tracks.length) return start(0); await a.play().catch(() => {}); setPlaying(true); }
    else { a.pause(); setPlaying(false); }
  };

  // visualizer draw loop (only while the panel is open + playing)
  useEffect(() => {
    const loopDraw = () => {
      raf.current = requestAnimationFrame(loopDraw);
      const an = graph.current.an, cv = canvasRef.current;
      if (!an || !cv) return;
      const n = an.frequencyBinCount;
      const data = new Uint8Array(n);
      an.getByteFrequencyData(data);
      const ctx = cv.getContext('2d');
      ctx.clearRect(0, 0, cv.width, cv.height);
      const bw = cv.width / n;
      for (let i = 0; i < n; i++) {
        const h = (data[i] / 255) * cv.height;
        ctx.fillStyle = ACCENT;
        ctx.globalAlpha = 0.35 + 0.65 * (data[i] / 255);
        ctx.fillRect(i * bw + 1, cv.height - h, bw - 2, h);
      }
      ctx.globalAlpha = 1;
    };
    if (open && playing) raf.current = requestAnimationFrame(loopDraw);
    return () => cancelAnimationFrame(raf.current);
  }, [open, playing]);

  const add = async () => setTracks(await invoke('music:pick'));
  const del = async (id, e) => { e.stopPropagation(); const t = await invoke('music:remove', id); setTracks(t); };

  // cassette reel wind: supply reel (left) empties, take-up (right) fills
  const supplyR = 9 + 9 * (1 - progress);
  const takeupR = 9 + 9 * progress;

  return (
    <aside className="music-panel" style={open ? null : { display: 'none' }}>
      <div className="toolbox-head">
        <span className="panel-tag">▮ PLAYER</span>
        <span className="panel-sub">OFFLINE · {tracks.length} TRACKS</span>
        <button className="close" onClick={onClose}>✕</button>
      </div>

      <div className="cassette-wrap">
        <svg viewBox="0 0 200 120" className="cassette">
          <rect x="6" y="6" width="188" height="108" rx="8" fill="var(--bg2)" stroke="var(--line-lit)" />
          <rect x="26" y="70" width="148" height="34" rx="4" fill="var(--paper)" opacity="0.9" />
          <text x="100" y="92" textAnchor="middle" fontFamily="var(--mono)" fontSize="9" fill="#191b16">
            {cur ? cur.name.slice(0, 26) : 'NO TAPE LOADED'}
          </text>
          {/* tape spans between reels */}
          <line x1="66" y1="40" x2="134" y2="40" stroke="var(--metal)" strokeWidth="2" opacity="0.5" />
          {[66, 134].map((cx, k) => (
            <g key={cx} className={'reel' + (playing ? ' spin' : '')} style={{ transformOrigin: `${cx}px 40px` }}>
              <circle cx={cx} cy="40" r={k === 0 ? supplyR : takeupR} fill="var(--metal)" opacity="0.35" />
              <circle cx={cx} cy="40" r="10" fill="none" stroke="var(--lime)" strokeWidth="2" />
              {[0, 60, 120, 180, 240, 300].map((a) => (
                <line key={a} x1={cx} y1="40"
                  x2={cx + 9 * Math.cos(a * Math.PI / 180)} y2={40 + 9 * Math.sin(a * Math.PI / 180)}
                  stroke="var(--lime)" strokeWidth="1.5" />
              ))}
            </g>
          ))}
        </svg>
        <canvas ref={canvasRef} width="200" height="34" className="visualizer" />
      </div>

      <div className="player-controls">
        <button className={'pc' + (shuffle ? ' on' : '')} title="Shuffle" onClick={() => setShuffle((s) => !s)}>⤮</button>
        <button className="pc" title="Previous" onClick={prev}>⏮</button>
        <button className="pc big" onClick={toggle}>{playing ? '⏸' : '▶'}</button>
        <button className="pc" title="Next" onClick={next}>⏭</button>
        <button className={'pc' + (loop ? ' on' : '')} title="Loop" onClick={() => setLoop((l) => !l)}>↻</button>
      </div>
      <input className="seek" type="range" min="0" max="1000" value={Math.round(progress * 1000)}
        onChange={(e) => { const a = audioRef.current; if (a && a.duration) a.currentTime = (e.target.value / 1000) * a.duration; }} />

      <div className="playlist">
        <div className="col-label playlist-head">
          <span>PLAYLIST</span><button className="ghost" onClick={add}>+ ADD MP3</button>
        </div>
        {tracks.map((t, i) => (
          <div key={t.id} className={'track' + (i === idx ? ' active' : '')} onClick={() => start(i)}>
            <span className="track-ic">{i === idx && playing ? '▮▮' : '▶'}</span>
            <span className="track-name">{t.name}</span>
            <button className="mini danger" onClick={(e) => del(t.id, e)}>✕</button>
          </div>
        ))}
        {tracks.length === 0 && <div className="muted pad">Add MP3s to build your offline soundtrack.</div>}
      </div>

      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setProgress(e.target.duration ? e.target.currentTime / e.target.duration : 0)}
        onEnded={() => { if (loop) { audioRef.current.currentTime = 0; audioRef.current.play(); } else next(); }}
      />
    </aside>
  );
}
