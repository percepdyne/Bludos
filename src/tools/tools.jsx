import React, { useState } from 'react';
import { hexToRgb, rgbToHex, rgbToHsl, rgbToCmyk, rgbToLab, deltaE76, deltaE2000, nearestRal, RAL } from './color.js';
import { CALC_SPECS } from './calcs.js';

// ---------- shared: the insert-as-block mechanic ----------
// Every tool can stamp its inputs + results into the open document as a
// traceable CALC block. Calculations become documentation.

export const calcBlock = (toolId, operator, rows) => {
  const date = new Date().toISOString().slice(0, 10);
  const cell = (s) => String(s).replace(/\|/g, '¦'); // pipes would break the table
  const head = '`CALC ▮ ' + toolId + ' · ' + date + (operator ? ' · ' + operator : '') + '`';
  const table = [
    '| Parameter | Value |',
    '| --- | --- |',
    ...rows.map(([k, v, strong]) => `| ${cell(k)} | ${strong ? '**' + cell(v) + '**' : cell(v)} |`),
  ].join('\n');
  return head + '\n\n' + table;
};

const insertBlock = (md) => window.dispatchEvent(new CustomEvent('bludos:insert-block', { detail: md }));

const fmt = (v, d = 2) => (Number.isFinite(v) ? Number(v.toFixed(d)).toString() : '—');

function Field({ label, value, onChange, unit, width }) {
  return (
    <label className="tf">
      <span className="tf-label">{label}</span>
      <span className="tf-wrap">
        <input style={width ? { width } : null} value={value} onChange={(e) => onChange(e.target.value)} />
        {unit && <span className="tf-unit">{unit}</span>}
      </span>
    </label>
  );
}

function InsertBtn({ canInsert, getBlock }) {
  const [copied, setCopied] = useState(false);
  const md = () => { try { return getBlock() || ''; } catch { return ''; } };
  return (
    <div className="insert-row">
      <button
        className="primary insert-block"
        disabled={!canInsert}
        title={canInsert ? 'Insert inputs + results into the open document' : 'Open a document first'}
        onClick={() => { const m = md(); if (m) insertBlock(m); }}
      >⤓ INSERT AS BLOCK</button>
      <button
        className="copy-block"
        title="Copy block as markdown (for chat, email, anywhere)"
        onClick={async () => {
          const m = md();
          if (m) { await navigator.clipboard.writeText(m); setCopied(true); setTimeout(() => setCopied(false), 1500); }
        }}
      >{copied ? '✓ COPIED' : '⧉ COPY'}</button>
    </div>
  );
}

const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : NaN; };

// ---------- CORE: Color Lab ----------

function ColorLab({ canInsert, operator }) {
  const [hex, setHex] = useState('#C8F31D');
  const [hexA, setHexA] = useState('#C8F31D');
  const [hexB, setHexB] = useState('#D7D7D7');

  const rgb = hexToRgb(hex);
  const rals = rgb ? nearestRal(hex, 3) : [];
  const labA = hexToRgb(hexA) && rgbToLab(...hexToRgb(hexA));
  const labB = hexToRgb(hexB) && rgbToLab(...hexToRgb(hexB));
  const dE00 = labA && labB ? deltaE2000(labA, labB) : NaN;
  const dE76v = labA && labB ? deltaE76(labA, labB) : NaN;

  const pick = async (set) => {
    if (!window.EyeDropper) return;
    try { const r = await new window.EyeDropper().open(); set(r.sRGBHex.toUpperCase()); } catch { /* cancelled */ }
  };

  const getBlock = () => {
    if (!rgb) return '';
    const [h, s, l] = rgbToHsl(...rgb);
    const [c, m, y, k] = rgbToCmyk(...rgb);
    const lab = rgbToLab(...rgb);
    return calcBlock('color-lab v1', operator, [
      ['Color', hex.toUpperCase() + ' ▮', true],
      ['RGB', rgb.join(', ')],
      ['HSL', `${h}°, ${s}%, ${l}%`],
      ['CMYK (approx)', `${c}, ${m}, ${y}, ${k}`],
      ['CIELab', lab.map((v) => fmt(v, 1)).join(', ')],
      ...rals.map((r, i) => [`Nearest RAL ${i + 1}`, `${r.code} ${r.name} (${r.hex}, ΔE00 ${fmt(r.dE, 1)})`]),
      ['Note', `Nearest of ${RAL.length} common RAL Classic shades; screen approximation — verify on a physical fan deck`],
    ]);
  };

  return (
    <div className="tool">
      <div className="tool-sec">CONVERT</div>
      <div className="color-row">
        <span className="swatch" style={{ background: rgb ? hex : '#000' }} />
        <input value={hex} onChange={(e) => setHex(e.target.value)} style={{ width: 90 }} />
        {window.EyeDropper && <button onClick={() => pick(setHex)} title="Pick a color from the screen">⊙ PICK</button>}
      </div>
      {rgb && (
        <div className="tool-out">
          <div>RGB {rgb.join(', ')} · HSL {rgbToHsl(...rgb).join(', ')} · CMYK {rgbToCmyk(...rgb).join(', ')}</div>
          <div>Lab {rgbToLab(...rgb).map((v) => fmt(v, 1)).join(', ')}</div>
          {rals.map((r) => (
            <div key={r.code} className="ral-row">
              <span className="swatch sm" style={{ background: r.hex }} />
              {r.code} {r.name} <span className="muted">ΔE00 {fmt(r.dE, 1)}</span>
            </div>
          ))}
          <div className="tool-note">Nearest of {RAL.length} common RAL Classic shades (screen approximation). Pantone is licensed — bring your own library.</div>
        </div>
      )}
      <div className="tool-sec">ΔE — COLOR DIFFERENCE</div>
      <div className="color-row">
        <span className="swatch" style={{ background: hexA }} />
        <input value={hexA} onChange={(e) => setHexA(e.target.value)} style={{ width: 84 }} />
        {window.EyeDropper && <button onClick={() => pick(setHexA)}>⊙</button>}
        <span className="swatch" style={{ background: hexB }} />
        <input value={hexB} onChange={(e) => setHexB(e.target.value)} style={{ width: 84 }} />
        {window.EyeDropper && <button onClick={() => pick(setHexB)}>⊙</button>}
      </div>
      <div className="tool-out">
        <div className="res">ΔE2000 = <b>{fmt(dE00, 2)}</b> · ΔE76 = {fmt(dE76v, 2)}</div>
        <div className="tool-note">{dE00 < 1 ? 'Not perceptible by eye' : dE00 < 2 ? 'Perceptible on close inspection' : dE00 < 10 ? 'Perceptible at a glance' : 'Different colors'}</div>
      </div>
      <InsertBtn canInsert={canInsert} getBlock={getBlock} />
    </div>
  );
}

// ---------- CORE: Units ----------

const UNITS = {
  Length: { mm: 1, cm: 10, m: 1000, in: 25.4, mil: 0.0254, ft: 304.8 },
  Mass: { g: 1, kg: 1000, oz: 28.3495, lb: 453.592 },
  Force: { N: 1, kgf: 9.80665, lbf: 4.44822 },
  Torque: { 'N·m': 1, 'kgf·cm': 0.0980665, 'in·lb': 0.112985, 'ft·lb': 1.35582 },
  Pressure: { MPa: 1, bar: 0.1, psi: 0.00689476, kPa: 0.001 },
  Area: { 'mm²': 1, 'cm²': 100, 'in²': 645.16 },
};

function Units({ canInsert, operator }) {
  const [cat, setCat] = useState('Length');
  const [val, setVal] = useState('25.4');
  const [from, setFrom] = useState('mm');
  const [to, setTo] = useState('in');
  const [tC, setTC] = useState('25');

  const keys = Object.keys(UNITS[cat] || {});
  const f = UNITS[cat]?.[keys.includes(from) ? from : keys[0]];
  const t = UNITS[cat]?.[keys.includes(to) ? to : keys[1] || keys[0]];
  const out = num(val) * f / t;
  const c = num(tC);

  const pickCat = (c2) => {
    setCat(c2);
    const k = Object.keys(UNITS[c2]);
    setFrom(k[0]); setTo(k[1] || k[0]);
  };

  return (
    <div className="tool">
      <div className="tool-sec">CONVERT</div>
      <div className="color-row">
        <select value={cat} onChange={(e) => pickCat(e.target.value)}>
          {Object.keys(UNITS).map((k) => <option key={k}>{k}</option>)}
        </select>
        <input value={val} onChange={(e) => setVal(e.target.value)} style={{ width: 80 }} />
        <select value={keys.includes(from) ? from : keys[0]} onChange={(e) => setFrom(e.target.value)}>
          {keys.map((k) => <option key={k}>{k}</option>)}
        </select>
        <span>→</span>
        <select value={keys.includes(to) ? to : keys[1] || keys[0]} onChange={(e) => setTo(e.target.value)}>
          {keys.map((k) => <option key={k}>{k}</option>)}
        </select>
      </div>
      <div className="tool-out"><div className="res">= <b>{fmt(out, 5)}</b> {to}</div></div>
      <div className="tool-sec">TEMPERATURE</div>
      <Field label="Celsius" value={tC} onChange={setTC} unit="°C" width={80} />
      <div className="tool-out"><div className="res"><b>{fmt(c * 9 / 5 + 32, 1)}</b> °F · <b>{fmt(c + 273.15, 2)}</b> K</div></div>
      <InsertBtn canInsert={canInsert} getBlock={() =>
        calcBlock('unit-convert v1', operator, [
          ['Conversion', `${val} ${from} = ${fmt(out, 5)} ${to}`, true],
          ['Category', cat],
        ])} />
    </div>
  );
}

// ---------- CORE: Ratio & Scale ----------

const PHI = (1 + Math.sqrt(5)) / 2;

function RatioScale({ canInsert, operator }) {
  const [a, setA] = useState('100');
  const [fromS, setFromS] = useState('250');
  const [toS, setToS] = useState('100');
  const [dim, setDim] = useState('50');
  const [shrink, setShrink] = useState('2.0');

  const av = num(a);
  const scale = num(toS) / num(fromS);
  const comp = num(dim) / (1 - num(shrink) / 100);

  return (
    <div className="tool">
      <div className="tool-sec">GOLDEN RATIO (φ ≈ {fmt(PHI, 4)})</div>
      <Field label="Segment a" value={a} onChange={setA} unit="mm" width={80} />
      <div className="tool-out"><div className="res">a·φ = <b>{fmt(av * PHI)}</b> · a/φ = <b>{fmt(av / PHI)}</b> · a/φ² = {fmt(av / PHI / PHI)}</div></div>
      <div className="tool-sec">SCALE FACTOR</div>
      <div className="color-row">
        <Field label="From" value={fromS} onChange={setFromS} width={70} />
        <Field label="To" value={toS} onChange={setToS} width={70} />
      </div>
      <div className="tool-out"><div className="res">Scale = <b>{fmt(scale * 100, 2)}%</b> ({fmt(scale, 4)}×) · Area ×{fmt(scale * scale, 3)} · Volume ×{fmt(scale ** 3, 3)}</div></div>
      <div className="tool-sec">3D-PRINT SHRINKAGE COMPENSATION</div>
      <div className="color-row">
        <Field label="Target dim" value={dim} onChange={setDim} unit="mm" width={70} />
        <Field label="Shrinkage" value={shrink} onChange={setShrink} unit="%" width={56} />
      </div>
      <div className="tool-out"><div className="res">Model at <b>{fmt(comp, 3)} mm</b> (scale {fmt(100 / (1 - num(shrink) / 100), 2)}%)</div></div>
      <InsertBtn canInsert={canInsert} getBlock={() =>
        calcBlock('ratio-scale v1', operator, [
          ['Golden section of ' + a, `${fmt(av / PHI)} / ${fmt(av - av / PHI)}`],
          ['Scale factor', `${fromS} → ${toS} = ${fmt(scale * 100, 2)}%`, true],
          ['Shrinkage comp', `${dim} mm @ ${shrink}% → model ${fmt(comp, 3)} mm`],
        ])} />
    </div>
  );
}

// ---------- EV/ROBOTICS: Battery Runtime ----------

function Battery({ canInsert, operator }) {
  const [mah, setMah] = useState('5000');
  const [volt, setVolt] = useState('14.8');
  const [eff, setEff] = useState('90');
  const [reserve, setReserve] = useState('20');
  const [rows, setRows] = useState([
    { mode: 'Active', watts: '12', minutes: '20' },
    { mode: 'Idle', watts: '2', minutes: '40' },
  ]);

  const packWh = num(mah) / 1000 * num(volt);
  const usable = packWh * num(eff) / 100 * (1 - num(reserve) / 100);
  const totMin = rows.reduce((s, r) => s + num(r.minutes), 0);
  const cycleWh = rows.reduce((s, r) => s + num(r.watts) * num(r.minutes) / 60, 0);
  const avgW = totMin ? rows.reduce((s, r) => s + num(r.watts) * num(r.minutes), 0) / totMin : NaN;
  const runtimeH = usable / avgW;
  const cycles = usable / cycleWh;
  const peakW = Math.max(...rows.map((r) => num(r.watts)));
  const cRate = (peakW / num(volt)) / (num(mah) / 1000);

  const upd = (i, k, v) => setRows(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));

  return (
    <div className="tool">
      <div className="tool-sec">PACK</div>
      <div className="color-row">
        <Field label="Capacity" value={mah} onChange={setMah} unit="mAh" width={66} />
        <Field label="Voltage" value={volt} onChange={setVolt} unit="V" width={50} />
      </div>
      <div className="color-row">
        <Field label="Efficiency" value={eff} onChange={setEff} unit="%" width={46} />
        <Field label="Reserve SoC" value={reserve} onChange={setReserve} unit="%" width={46} />
      </div>
      <div className="tool-sec">DUTY CYCLE</div>
      {rows.map((r, i) => (
        <div className="color-row" key={i}>
          <input value={r.mode} onChange={(e) => upd(i, 'mode', e.target.value)} style={{ width: 86 }} />
          <input value={r.watts} onChange={(e) => upd(i, 'watts', e.target.value)} style={{ width: 52 }} title="Average power in this mode (W)" />
          <span className="tf-unit">W ×</span>
          <input value={r.minutes} onChange={(e) => upd(i, 'minutes', e.target.value)} style={{ width: 46 }} title="Minutes per cycle" />
          <span className="tf-unit">min</span>
          <button className="mini-inline" onClick={() => setRows(rows.filter((_, j) => j !== i))}>✕</button>
        </div>
      ))}
      <button className="ghost" onClick={() => setRows([...rows, { mode: 'Mode', watts: '1', minutes: '10' }])}>+ MODE</button>
      <div className="tool-out">
        <div>Pack {fmt(packWh, 1)} Wh · usable {fmt(usable, 1)} Wh · avg draw {fmt(avgW, 2)} W</div>
        <div className="res">Runtime ≈ <b>{fmt(runtimeH, 2)} h</b> · <b>{fmt(cycles, 1)}</b> duty cycles/charge</div>
        <div className="tool-note">Peak C-rate ≈ {fmt(cRate, 2)}C {cRate > 2 ? '⚠ check cell spec' : ''}</div>
      </div>
      <InsertBtn canInsert={canInsert} getBlock={() =>
        calcBlock('battery-runtime v1', operator, [
          ['Pack', `${mah} mAh @ ${volt} V = ${fmt(packWh, 1)} Wh`],
          [`Usable (η ${eff}%, reserve ${reserve}%)`, `${fmt(usable, 1)} Wh`],
          ...rows.map((r) => [`Duty — ${r.mode}`, `${r.watts} W × ${r.minutes} min`]),
          ['Average draw', `${fmt(avgW, 2)} W`],
          ['Runtime', `${fmt(runtimeH, 2)} h`, true],
          ['Duty cycles per charge', fmt(cycles, 1), true],
          ['Peak C-rate', `${fmt(cRate, 2)}C`],
        ])} />
    </div>
  );
}

// ---------- EV/ROBOTICS: Motor Load ----------

function Motor({ canInsert, operator }) {
  const [torque, setTorque] = useState('2.0');
  const [speed, setSpeed] = useState('60');
  const [ratio, setRatio] = useState('20');
  const [gEff, setGEff] = useState('85');
  const [stall, setStall] = useState('1.2');
  const [noload, setNoload] = useState('4000');
  const [kt, setKt] = useState('0.05');

  const mT = num(torque) / (num(ratio) * num(gEff) / 100);
  const mN = num(speed) * num(ratio);
  const avail = num(stall) * (1 - mN / num(noload));
  const margin = (avail - mT) / mT * 100;
  const amps = num(kt) > 0 ? mT / num(kt) : NaN;
  const verdict = mN >= num(noload) ? 'FAIL — speed above no-load' : margin < 0 ? 'FAIL' : margin < 30 ? 'MARGINAL' : 'PASS';

  return (
    <div className="tool">
      <div className="tool-sec">LOAD (AT OUTPUT)</div>
      <div className="color-row">
        <Field label="Torque" value={torque} onChange={setTorque} unit="N·m" width={56} />
        <Field label="Speed" value={speed} onChange={setSpeed} unit="rpm" width={56} />
      </div>
      <div className="color-row">
        <Field label="Gear ratio" value={ratio} onChange={setRatio} unit=":1" width={50} />
        <Field label="Gear η" value={gEff} onChange={setGEff} unit="%" width={46} />
      </div>
      <div className="tool-sec">MOTOR (DATASHEET)</div>
      <div className="color-row">
        <Field label="Stall torque" value={stall} onChange={setStall} unit="N·m" width={56} />
        <Field label="No-load" value={noload} onChange={setNoload} unit="rpm" width={60} />
      </div>
      <Field label="Kt (optional)" value={kt} onChange={setKt} unit="N·m/A" width={60} />
      <div className="tool-out">
        <div>Motor operating point: {fmt(mT, 3)} N·m @ {fmt(mN, 0)} rpm</div>
        <div>Available torque at speed: {fmt(avail, 3)} N·m</div>
        <div className="res">Margin <b>{fmt(margin, 0)}%</b> → <b className={verdict === 'PASS' ? 'ok' : 'bad'}>{verdict}</b></div>
        {Number.isFinite(amps) && <div className="tool-note">Est. current ≈ {fmt(amps, 1)} A (linear model, ignores friction)</div>}
      </div>
      <InsertBtn canInsert={canInsert} getBlock={() =>
        calcBlock('motor-load v1', operator, [
          ['Output load', `${torque} N·m @ ${speed} rpm`],
          ['Gearbox', `${ratio}:1 @ ${gEff}%`],
          ['Motor point', `${fmt(mT, 3)} N·m @ ${fmt(mN, 0)} rpm`],
          ['Motor curve', `stall ${stall} N·m, no-load ${noload} rpm`],
          ['Available at speed', `${fmt(avail, 3)} N·m`],
          ['Torque margin', `${fmt(margin, 0)}%`, true],
          ['Verdict', verdict, true],
          ...(Number.isFinite(amps) ? [['Est. current', `${fmt(amps, 1)} A (Kt ${kt})`]] : []),
        ])} />
    </div>
  );
}

// ---------- MECHANICAL: Tolerance Stack-Up ----------

function StackUp({ canInsert, operator }) {
  const [rows, setRows] = useState([
    { name: 'Housing pocket', nom: '10.00', tol: '0.05', dir: '+' },
    { name: 'Part width', nom: '9.80', tol: '0.05', dir: '-' },
  ]);
  const [reqMin, setReqMin] = useState('0.05');
  const [reqMax, setReqMax] = useState('0.40');

  const nomGap = rows.reduce((s, r) => s + (r.dir === '+' ? 1 : -1) * num(r.nom), 0);
  const wc = rows.reduce((s, r) => s + Math.abs(num(r.tol)), 0);
  const rss = Math.sqrt(rows.reduce((s, r) => s + num(r.tol) ** 2, 0));
  const pass = (lo, hi) => lo >= num(reqMin) && hi <= num(reqMax);
  const wcPass = pass(nomGap - wc, nomGap + wc);
  const rssPass = pass(nomGap - rss, nomGap + rss);
  const upd = (i, k, v) => setRows(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));

  return (
    <div className="tool">
      <div className="tool-sec">CONTRIBUTORS</div>
      {rows.map((r, i) => (
        <div className="color-row" key={i}>
          <select value={r.dir} onChange={(e) => upd(i, 'dir', e.target.value)} style={{ width: 44 }}>
            <option>+</option><option>-</option>
          </select>
          <input value={r.name} onChange={(e) => upd(i, 'name', e.target.value)} style={{ width: 108 }} />
          <input value={r.nom} onChange={(e) => upd(i, 'nom', e.target.value)} style={{ width: 56 }} title="Nominal" />
          <span className="tf-unit">±</span>
          <input value={r.tol} onChange={(e) => upd(i, 'tol', e.target.value)} style={{ width: 46 }} title="Tolerance" />
          <button className="mini-inline" onClick={() => setRows(rows.filter((_, j) => j !== i))}>✕</button>
        </div>
      ))}
      <button className="ghost" onClick={() => setRows([...rows, { name: 'Dim', nom: '0', tol: '0.1', dir: '+' }])}>+ DIMENSION</button>
      <div className="tool-sec">REQUIREMENT (GAP)</div>
      <div className="color-row">
        <Field label="Min" value={reqMin} onChange={setReqMin} unit="mm" width={56} />
        <Field label="Max" value={reqMax} onChange={setReqMax} unit="mm" width={56} />
      </div>
      <div className="tool-out">
        <div>Nominal gap: {fmt(nomGap, 3)} mm</div>
        <div className="res">Worst case: <b>{fmt(nomGap - wc, 3)} … {fmt(nomGap + wc, 3)}</b> → <b className={wcPass ? 'ok' : 'bad'}>{wcPass ? 'PASS' : 'FAIL'}</b></div>
        <div className="res">RSS: <b>{fmt(nomGap - rss, 3)} … {fmt(nomGap + rss, 3)}</b> → <b className={rssPass ? 'ok' : 'bad'}>{rssPass ? 'PASS' : 'FAIL'}</b></div>
        <div className="tool-note">RSS assumes centered, normal processes (Cpk ≥ 1.33) — flag to supplier quality.</div>
      </div>
      <InsertBtn canInsert={canInsert} getBlock={() =>
        calcBlock('stackup v1', operator, [
          ...rows.map((r) => [`${r.dir} ${r.name}`, `${r.nom} ± ${r.tol}`]),
          ['Requirement', `${reqMin} … ${reqMax} mm`],
          ['Nominal gap', `${fmt(nomGap, 3)} mm`],
          ['Worst case', `${fmt(nomGap - wc, 3)} … ${fmt(nomGap + wc, 3)} → ${wcPass ? 'PASS' : 'FAIL'}`, true],
          ['RSS', `${fmt(nomGap - rss, 3)} … ${fmt(nomGap + rss, 3)} → ${rssPass ? 'PASS' : 'FAIL'}`, true],
        ])} />
    </div>
  );
}

// ---------- RESEARCH: SUS Scorer ----------

function Sus({ canInsert, operator }) {
  const [raw, setRaw] = useState('5 2 4 1 5 2 5 1 5 1\n4 2 4 2 4 3 4 2 4 2');

  const parts = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    .map((l) => l.split(/[\s,;]+/).map(Number).filter((n) => Number.isFinite(n)));
  const valid = parts.filter((p) => p.length === 10 && p.every((v) => v >= 1 && v <= 5));
  const scores = valid.map((p) => p.reduce((s, v, i) => s + (i % 2 === 0 ? v - 1 : 5 - v), 0) * 2.5);
  const mean = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : NaN;
  const grade = mean >= 84.1 ? 'A+' : mean >= 80.8 ? 'A' : mean >= 78.9 ? 'A-' : mean >= 77.2 ? 'B+' : mean >= 74.1 ? 'B'
    : mean >= 72.6 ? 'B-' : mean >= 71.1 ? 'C+' : mean >= 65 ? 'C' : mean >= 62.7 ? 'C-' : mean >= 51.7 ? 'D' : 'F';

  return (
    <div className="tool">
      <div className="tool-sec">RESPONSES — ONE PARTICIPANT PER LINE, 10 SCORES (1–5)</div>
      <textarea className="tool-ta" rows={5} value={raw} onChange={(e) => setRaw(e.target.value)} />
      <div className="tool-out">
        {parts.length !== valid.length && <div className="bad">⚠ {parts.length - valid.length} line(s) invalid (need exactly 10 values, 1–5)</div>}
        {scores.map((s, i) => <div key={i}>P{i + 1}: {fmt(s, 1)}</div>)}
        <div className="res">Mean SUS = <b>{fmt(mean, 1)}</b> / 100 → grade <b>{scores.length ? grade : '—'}</b></div>
        <div className="tool-note">Industry average is 68. Odd items score (v−1), even items (5−v), sum × 2.5.</div>
      </div>
      <InsertBtn canInsert={canInsert} getBlock={() =>
        calcBlock('sus-score v1', operator, [
          ...scores.map((s, i) => [`Participant ${i + 1}`, fmt(s, 1)]),
          ['Mean SUS', `${fmt(mean, 1)} / 100`, true],
          ['Grade (Sauro–Lewis)', grade, true],
          ['n', String(scores.length)],
        ])} />
    </div>
  );
}

// ---------- declarative calculator engine ----------
// Renders any spec from calcs.js: inputs (number/text/select) → live-computed
// result rows → the same insert-as-block mechanic as the hand-built tools.

function CalcTool({ spec, canInsert, operator, initialVals }) {
  const [vals, setVals] = useState(() => ({
    ...Object.fromEntries(spec.inputs.map((i) => [i.k, i.def ?? ''])),
    ...(initialVals || {}),
  }));
  const set = (k, v) => setVals((o) => ({ ...o, [k]: v }));

  let rows;
  try { rows = spec.compute(vals) || []; }
  catch { rows = [['Error', 'check inputs', { cls: 'bad' }]]; }

  return (
    <div className="tool">
      <div className="tool-sec">INPUTS</div>
      <div className="calc-grid">
        {spec.inputs.map((inp) =>
          inp.type === 'select' ? (
            <label className="tf" key={inp.k}>
              <span className="tf-label">{inp.label}</span>
              <select value={vals[inp.k]} onChange={(e) => set(inp.k, e.target.value)}>
                {inp.options.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
              </select>
            </label>
          ) : (
            <Field key={inp.k} label={inp.label} unit={inp.unit} value={vals[inp.k]} onChange={(v) => set(inp.k, v)} width={84} />
          )
        )}
      </div>
      {spec.note && <div className="tool-note">{spec.note}</div>}
      <div className="tool-sec">RESULTS</div>
      <div className="tool-out">
        {rows.map(([l, v, o = {}], i) => (
          <div key={i} className={o.strong ? 'res' : ''}>
            {l}: {o.strong ? <b className={o.cls || ''}>{v}</b> : <span className={o.cls || ''}>{v}</span>}
          </div>
        ))}
      </div>
      <InsertBtn
        canInsert={canInsert}
        getBlock={() => calcBlock(spec.id + ' v1', operator, [
          ...spec.inputs.map((i2) => [i2.label, String(vals[i2.k]) + (i2.unit ? ' ' + i2.unit : '')]),
          ...rows.map(([l, v, o = {}]) => [l, v, o.strong]),
        ])}
      />
    </div>
  );
}

const makeCalcComponent = (spec) => {
  const C = (props) => <CalcTool spec={spec} {...props} />;
  C.displayName = 'Calc_' + spec.id;
  return C;
};

// ---------- registry ----------

const PACK_META = [
  ['core', 'CORE'],
  ['electronics', 'ELECTRONICS'],
  ['robotics', 'ROBOTICS'],
  ['mech', 'MECHANICAL'],
  ['ev', 'EV / POWER'],
  ['control', 'CONTROL SYSTEMS'],
  ['comms', 'COMMUNICATION'],
  ['research', 'RESEARCH'],
];

const BUILTIN = {
  core: [
    { id: 'color-lab', title: 'Color Lab', desc: 'Picker · converter · nearest RAL · ΔE', component: ColorLab },
    { id: 'units', title: 'Unit Converter', desc: 'Length, mass, force, torque, pressure, temp', component: Units },
    { id: 'ratio', title: 'Ratio & Scale', desc: 'Golden ratio · scale factor · shrinkage', component: RatioScale },
  ],
  ev: [
    { id: 'battery', title: 'Battery Runtime', desc: 'Duty cycle → runtime, C-rate', component: Battery },
    { id: 'motor', title: 'Motor Load', desc: 'Load vs motor curve → margin verdict', component: Motor },
  ],
  mech: [
    { id: 'stackup', title: 'Tolerance Stack-Up', desc: 'Worst case + RSS vs requirement', component: StackUp },
  ],
  research: [
    { id: 'sus', title: 'SUS Scorer', desc: 'Paste scores → 0–100 + grade', component: Sus },
  ],
};

export const TOOL_PACKS = PACK_META.map(([id, title]) => ({
  id,
  title,
  tools: [
    ...(BUILTIN[id] || []),
    ...CALC_SPECS.filter((s) => s.pack === id).map((s) => ({
      id: s.id, title: s.title, desc: s.desc, component: makeCalcComponent(s),
    })),
  ],
})).filter((p) => p.tools.length > 0);
