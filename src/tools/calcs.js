// Declarative calculator specs — each entry becomes a toolbox tool rendered by
// the generic CalcTool engine in tools.jsx. Keep formulas source-commented.
// Row format: [label, valueString, { strong?, cls: 'ok'|'bad' }?]

const n = (v) => { const x = parseFloat(v); return Number.isFinite(x) ? x : NaN; };
const f = (v, d = 2) => (Number.isFinite(v) ? Number(v.toFixed(d)).toString() : '—');
const G = 9.81;

// ---------- shared data ----------

const E24 = [1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0, 3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1];
const nextE24 = (r) => {
  if (!(r > 0)) return NaN;
  const dec = Math.pow(10, Math.floor(Math.log10(r)));
  for (const m of [1, 10]) for (const e of E24) { const v = e * dec * m; if (v >= r * 0.999) return v; }
  return NaN;
};
const ohms = (r) => (r >= 1e6 ? f(r / 1e6, 2) + ' MΩ' : r >= 1e3 ? f(r / 1e3, 2) + ' kΩ' : f(r, 1) + ' Ω');

// AWG: [gauge, diameter mm]; copper ρ = 0.0172 Ω·mm²/m
const AWG = [[4, 5.189], [6, 4.115], [8, 3.264], [10, 2.588], [12, 2.053], [14, 1.628], [16, 1.291], [18, 1.024], [20, 0.812], [22, 0.644], [24, 0.511], [26, 0.405], [28, 0.321]];
const RHO_CU = 0.0172;

// E (GPa), yield (MPa), allowable dynamic snap strain (%)
const MATS = {
  'Mild steel': { E: 200, y: 250, strain: 0.3 },
  'Aluminium 6061-T6': { E: 69, y: 276, strain: 0.6 },
  'ABS': { E: 2.3, y: 40, strain: 1.8 },
  'PC': { E: 2.4, y: 62, strain: 2.5 },
  'PA66 (Nylon)': { E: 2.8, y: 80, strain: 4.0 },
  'POM': { E: 2.9, y: 65, strain: 3.0 },
  'PP': { E: 1.5, y: 33, strain: 5.0 },
};
const matOptions = Object.keys(MATS).map((k) => ({ v: k, label: k }));

// CTE µm/(m·K)
const CTE = { 'Mild steel': 12, 'Stainless 304': 17.3, 'Aluminium': 23.6, 'Brass': 19, 'ABS': 90, 'PC': 70, 'PA66': 80, 'POM': 110, 'PP': 150, 'Glass': 8.5 };

// Metric bolts: [d mm, stress area mm²]
const BOLTS = { M2: [2, 2.07], 'M2.5': [2.5, 3.39], M3: [3, 5.03], M4: [4, 8.78], M5: [5, 14.2], M6: [6, 20.1], M8: [8, 36.6], M10: [10, 58.0], M12: [12, 84.3] };
const PROOF = { '8.8': 580, '10.9': 830, 'A2-70 (stainless)': 450 };

// ISO fits — size ranges (mm) and IT6/IT7 (µm), shaft fundamental deviations (µm)
const FIT_RANGES = [[3, 6], [6, 10], [10, 18], [18, 30], [30, 50]];
const IT6 = [8, 9, 11, 13, 16];
const IT7 = [12, 15, 18, 21, 25];
const DEV = {
  'H7/g6 (sliding clearance)': { es: [-4, -5, -6, -7, -9], type: 'g' },
  'H7/k6 (transition / locational)': { ei: [1, 1, 1, 2, 2], type: 'k' },
  'H7/p6 (press fit)': { ei: [12, 15, 18, 22, 26], type: 'p' },
};

const verdict = (cond, okTxt = 'PASS', badTxt = 'FAIL') =>
  cond ? [okTxt, { strong: true, cls: 'ok' }] : [badTxt, { strong: true, cls: 'bad' }];

// =====================================================================
export const CALC_SPECS = [

  // ---------------- ELECTRONICS ----------------
  {
    id: 'ohms-law', pack: 'electronics', title: "Ohm's Law & Power", desc: 'Leave one of V / I / R blank',
    inputs: [
      { k: 'v', label: 'Voltage', unit: 'V', def: '12' },
      { k: 'i', label: 'Current', unit: 'A', def: '0.5' },
      { k: 'r', label: 'Resistance', unit: 'Ω', def: '' },
    ],
    compute: (x) => {
      let V = n(x.v), I = n(x.i), R = n(x.r);
      if (!Number.isFinite(R)) R = V / I;
      else if (!Number.isFinite(V)) V = I * R;
      else if (!Number.isFinite(I)) I = V / R;
      return [
        ['V', f(V, 3) + ' V'], ['I', f(I, 4) + ' A (' + f(I * 1000, 1) + ' mA)'],
        ['R', ohms(R), { strong: true }], ['Power', f(V * I, 3) + ' W', { strong: true }],
      ];
    },
  },
  {
    id: 'led-resistor', pack: 'electronics', title: 'LED Resistor', desc: 'Series resistor + nearest E24',
    inputs: [
      { k: 'vs', label: 'Supply', unit: 'V', def: '5' },
      { k: 'vf', label: 'LED Vf', unit: 'V', def: '2.1' },
      { k: 'ma', label: 'LED current', unit: 'mA', def: '10' },
      { k: 'nl', label: 'LEDs in series', unit: '×', def: '1' },
    ],
    compute: (x) => {
      const drop = n(x.vs) - n(x.nl) * n(x.vf);
      if (drop <= 0) return [['Error', 'supply below total Vf', { cls: 'bad' }]];
      const R = drop / (n(x.ma) / 1000);
      const e = nextE24(R);
      const iAct = drop / e * 1000;
      return [
        ['Exact R', ohms(R)],
        ['Nearest E24 ≥', ohms(e), { strong: true }],
        ['Actual current', f(iAct, 1) + ' mA'],
        ['Resistor power', f(drop * iAct / 1000, 3) + ' W (use ≥ 2× rating)'],
      ];
    },
  },
  {
    id: 'divider', pack: 'electronics', title: 'Voltage Divider', desc: 'Vout, loading current, dissipation',
    inputs: [
      { k: 'vin', label: 'Vin', unit: 'V', def: '12' },
      { k: 'r1', label: 'R1 (top)', unit: 'Ω', def: '10000' },
      { k: 'r2', label: 'R2 (bottom)', unit: 'Ω', def: '3300' },
    ],
    compute: (x) => {
      const vo = n(x.vin) * n(x.r2) / (n(x.r1) + n(x.r2));
      const i = n(x.vin) / (n(x.r1) + n(x.r2));
      return [
        ['Vout', f(vo, 3) + ' V', { strong: true }],
        ['Divider current', f(i * 1000, 3) + ' mA'],
        ['P in R1 / R2', f(i * i * n(x.r1) * 1000, 1) + ' / ' + f(i * i * n(x.r2) * 1000, 1) + ' mW'],
        ['Thévenin R (for ADC)', ohms(n(x.r1) * n(x.r2) / (n(x.r1) + n(x.r2)))],
      ];
    },
  },
  {
    id: 'resistor-code', pack: 'electronics', title: 'Resistor Color Code', desc: '4-band decode',
    inputs: [
      { k: 'b1', label: 'Band 1', type: 'select', def: '1', options: ['black,0', 'brown,1', 'red,2', 'orange,3', 'yellow,4', 'green,5', 'blue,6', 'violet,7', 'grey,8', 'white,9'].map((s) => { const [c, d] = s.split(','); return { v: d, label: c }; }) },
      { k: 'b2', label: 'Band 2', type: 'select', def: '0', options: ['black,0', 'brown,1', 'red,2', 'orange,3', 'yellow,4', 'green,5', 'blue,6', 'violet,7', 'grey,8', 'white,9'].map((s) => { const [c, d] = s.split(','); return { v: d, label: c }; }) },
      { k: 'm', label: 'Multiplier', type: 'select', def: '2', options: ['black,0', 'brown,1', 'red,2', 'orange,3', 'yellow,4', 'green,5', 'blue,6', 'gold,-1', 'silver,-2'].map((s) => { const [c, d] = s.split(','); return { v: d, label: c }; }) },
      { k: 't', label: 'Tolerance', type: 'select', def: '5', options: [{ v: '1', label: 'brown ±1%' }, { v: '2', label: 'red ±2%' }, { v: '5', label: 'gold ±5%' }, { v: '10', label: 'silver ±10%' }] },
    ],
    compute: (x) => {
      const val = (10 * n(x.b1) + n(x.b2)) * Math.pow(10, n(x.m));
      return [['Value', ohms(val) + ' ±' + x.t + '%', { strong: true }],
        ['Range', ohms(val * (1 - n(x.t) / 100)) + ' … ' + ohms(val * (1 + n(x.t) / 100))]];
    },
  },
  {
    id: 'wire-gauge', pack: 'electronics', title: 'Wire Gauge / Voltage Drop', desc: 'Copper, round trip',
    inputs: [
      { k: 'i', label: 'Current', unit: 'A', def: '10' },
      { k: 'l', label: 'Run length (one way)', unit: 'm', def: '2' },
      { k: 'v', label: 'System voltage', unit: 'V', def: '24' },
      { k: 'd', label: 'Max drop', unit: '%', def: '3' },
    ],
    compute: (x) => {
      const rMax = (n(x.v) * n(x.d) / 100) / n(x.i);
      const aMin = RHO_CU * 2 * n(x.l) / rMax;
      const pick = AWG.find(([, dia]) => Math.PI * dia * dia / 4 >= aMin);
      if (!pick) return [['Error', 'exceeds AWG 4 — use bus bar', { cls: 'bad' }]];
      const area = Math.PI * pick[1] * pick[1] / 4;
      const drop = RHO_CU * 2 * n(x.l) / area * n(x.i);
      return [
        ['Min copper area', f(aMin, 2) + ' mm²'],
        ['Choose', 'AWG ' + pick[0] + ' (' + f(area, 2) + ' mm²)', { strong: true }],
        ['Actual drop', f(drop, 2) + ' V (' + f(drop / n(x.v) * 100, 2) + '%)'],
        ['Loss in cable', f(drop * n(x.i), 2) + ' W'],
      ];
    },
    note: 'Resistive drop only; check ampacity/insulation rating separately.',
  },
  {
    id: 'rc-filter', pack: 'electronics', title: 'RC Filter', desc: 'Cutoff, time constant, rise time',
    inputs: [
      { k: 'r', label: 'R', unit: 'kΩ', def: '10' },
      { k: 'c', label: 'C', unit: 'nF', def: '100' },
    ],
    compute: (x) => {
      const tau = n(x.r) * 1e3 * n(x.c) * 1e-9;
      return [
        ['Cutoff f (−3 dB)', f(1 / (2 * Math.PI * tau), 1) + ' Hz', { strong: true }],
        ['Time constant τ', f(tau * 1000, 3) + ' ms'],
        ['Rise time (10–90%)', f(2.2 * tau * 1000, 3) + ' ms'],
        ['Settled (5τ)', f(5 * tau * 1000, 2) + ' ms'],
      ];
    },
  },
  {
    id: 'charge-time', pack: 'electronics', title: 'Battery Charge Time', desc: 'Capacity / current / efficiency',
    inputs: [
      { k: 'cap', label: 'Capacity', unit: 'mAh', def: '5000' },
      { k: 'i', label: 'Charge current', unit: 'mA', def: '2000' },
      { k: 'eff', label: 'Charge efficiency', unit: '%', def: '85' },
    ],
    compute: (x) => {
      const h = n(x.cap) / (n(x.i) * n(x.eff) / 100);
      return [
        ['Charge time', f(h, 2) + ' h (' + f(h * 60, 0) + ' min)', { strong: true }],
        ['Charge C-rate', f(n(x.i) / n(x.cap), 2) + 'C'],
      ];
    },
    note: 'CC phase estimate; CV taper adds ~20–30% for Li-ion.',
  },
  {
    id: 'cap-sizer', pack: 'electronics', title: 'Bulk Capacitor Sizer', desc: 'Ripple-based C selection',
    inputs: [
      { k: 'i', label: 'Load current', unit: 'mA', def: '500' },
      { k: 'fr', label: 'Ripple frequency', unit: 'Hz', def: '100' },
      { k: 'dv', label: 'Allowed ripple', unit: 'Vpp', def: '0.5' },
    ],
    compute: (x) => {
      const c = (n(x.i) / 1000) / (n(x.fr) * n(x.dv));
      return [['Required C', f(c * 1e6, 0) + ' µF', { strong: true }],
        ['Next standard up', f(nextE24(c * 1e6), 0) + ' µF']];
    },
    note: 'C = I / (f·ΔV). For full-wave rectified mains, f = 2× line frequency.',
  },
  {
    id: 'adc', pack: 'electronics', title: 'ADC Resolution', desc: 'LSB size and ideal SNR',
    inputs: [
      { k: 'bits', label: 'Bits', unit: 'b', def: '12' },
      { k: 'vref', label: 'Vref', unit: 'V', def: '3.3' },
    ],
    compute: (x) => {
      const counts = Math.pow(2, n(x.bits));
      return [
        ['Counts', f(counts, 0)],
        ['LSB', f(n(x.vref) / counts * 1000, 3) + ' mV', { strong: true }],
        ['Ideal SNR', f(6.02 * n(x.bits) + 1.76, 1) + ' dB'],
      ];
    },
  },
  {
    id: 'pwm', pack: 'electronics', title: 'PWM Timing', desc: 'Period, on-time, smoothing RC',
    inputs: [
      { k: 'fq', label: 'Frequency', unit: 'Hz', def: '20000' },
      { k: 'du', label: 'Duty', unit: '%', def: '35' },
    ],
    compute: (x) => {
      const T = 1 / n(x.fq);
      return [
        ['Period', f(T * 1e6, 2) + ' µs'],
        ['On-time', f(T * n(x.du) / 100 * 1e6, 2) + ' µs', { strong: true }],
        ['Smoothing RC (fc = f/100)', 'R·C ≥ ' + f(100 / (2 * Math.PI * n(x.fq)) * 1000, 3) + ' ms'],
      ];
    },
  },
  {
    id: 'trace-width', pack: 'electronics', title: 'PCB Trace Width', desc: 'IPC-2221 current capacity',
    inputs: [
      { k: 'i', label: 'Current', unit: 'A', def: '2' },
      { k: 'dt', label: 'Temp rise', unit: '°C', def: '10' },
      { k: 'oz', label: 'Copper', unit: 'oz', def: '1' },
      { k: 'layer', label: 'Layer', type: 'select', def: 'ext', options: [{ v: 'ext', label: 'external' }, { v: 'int', label: 'internal' }] },
    ],
    compute: (x) => {
      const k = x.layer === 'int' ? 0.024 : 0.048;
      const aMil2 = Math.pow(n(x.i) / (k * Math.pow(n(x.dt), 0.44)), 1 / 0.725);
      const wMil = aMil2 / (1.378 * n(x.oz));
      return [['Min trace width', f(wMil * 0.0254, 3) + ' mm (' + f(wMil, 1) + ' mil)', { strong: true }]];
    },
    note: 'IPC-2221 chart fit — conservative for short traces and polygons.',
  },
  {
    id: 'regulator', pack: 'electronics', title: 'Regulator Loss', desc: 'Linear vs buck dissipation',
    inputs: [
      { k: 'vin', label: 'Vin', unit: 'V', def: '12' },
      { k: 'vout', label: 'Vout', unit: 'V', def: '5' },
      { k: 'i', label: 'Load', unit: 'mA', def: '500' },
    ],
    compute: (x) => {
      const I = n(x.i) / 1000;
      const pl = (n(x.vin) - n(x.vout)) * I;
      const po = n(x.vout) * I;
      return [
        ['Linear loss', f(pl, 2) + ' W (η ' + f(po / (po + pl) * 100, 0) + '%)', { strong: true, cls: pl > 1 ? 'bad' : undefined }],
        ['Buck @ ~90%', f(po * (1 / 0.9 - 1), 2) + ' W loss'],
        ['Linear needs heatsink?', ...(pl > 1 ? ['YES — >1 W', { cls: 'bad' }] : ['Probably not (<1 W)', { cls: 'ok' }])],
      ];
    },
  },
  {
    id: 'junction-temp', pack: 'electronics', title: 'Junction Temp / Heatsink', desc: 'Thermal resistance chain',
    inputs: [
      { k: 'p', label: 'Dissipation', unit: 'W', def: '3' },
      { k: 'rjc', label: 'Rθ j-c', unit: 'K/W', def: '1.5' },
      { k: 'rcs', label: 'Rθ c-s', unit: 'K/W', def: '0.5' },
      { k: 'rsa', label: 'Rθ s-a (heatsink)', unit: 'K/W', def: '10' },
      { k: 'ta', label: 'Ambient', unit: '°C', def: '40' },
      { k: 'tj', label: 'Tj max', unit: '°C', def: '125' },
    ],
    compute: (x) => {
      const t = n(x.ta) + n(x.p) * (n(x.rjc) + n(x.rcs) + n(x.rsa));
      const need = (n(x.tj) - 15 - n(x.ta)) / n(x.p) - n(x.rjc) - n(x.rcs);
      return [
        ['Junction temp', f(t, 1) + ' °C', { strong: true, cls: t < n(x.tj) - 15 ? 'ok' : 'bad' }],
        ['Margin to Tj max', f(n(x.tj) - t, 1) + ' °C'],
        ['Rθ s-a for 15 °C margin', f(need, 2) + ' K/W'],
      ];
    },
  },

  // ---------------- ROBOTICS ----------------
  {
    id: 'drive-train', pack: 'robotics', title: 'Drive Performance', desc: 'Speed, push force, traction limit',
    inputs: [
      { k: 'dia', label: 'Wheel Ø', unit: 'mm', def: '120' },
      { k: 'rpm', label: 'Wheel rpm', unit: 'rpm', def: '150' },
      { k: 'tq', label: 'Torque / wheel', unit: 'N·m', def: '1.5' },
      { k: 'nw', label: 'Driven wheels', unit: '×', def: '2' },
      { k: 'm', label: 'Robot mass', unit: 'kg', def: '25' },
      { k: 'mu', label: 'Friction µ', unit: '', def: '0.6' },
    ],
    compute: (x) => {
      const v = Math.PI * n(x.dia) / 1000 * n(x.rpm) / 60;
      const fDrive = n(x.nw) * n(x.tq) / (n(x.dia) / 2000);
      const fTrac = n(x.mu) * n(x.m) * G;
      const fUse = Math.min(fDrive, fTrac);
      return [
        ['Top speed', f(v, 2) + ' m/s (' + f(v * 3.6, 1) + ' km/h)', { strong: true }],
        ['Drive force', f(fDrive, 1) + ' N · traction limit ' + f(fTrac, 1) + ' N'],
        ['Limited by', fDrive > fTrac ? 'traction (wheels slip first)' : 'motor torque'],
        ['Max acceleration', f(fUse / n(x.m), 2) + ' m/s²', { strong: true }],
        ['Max grade', f(Math.atan(fUse / (n(x.m) * G)) * 180 / Math.PI, 1) + '°'],
      ];
    },
  },
  {
    id: 'servo-torque', pack: 'robotics', title: 'Arm Joint Torque', desc: 'Static worst-case (horizontal)',
    inputs: [
      { k: 'l', label: 'Arm length', unit: 'mm', def: '300' },
      { k: 'mp', label: 'Payload', unit: 'kg', def: '0.5' },
      { k: 'ma', label: 'Arm mass', unit: 'kg', def: '0.4' },
      { k: 'sf', label: 'Safety factor', unit: '×', def: '2' },
    ],
    compute: (x) => {
      const t = G * n(x.l) / 1000 * (n(x.mp) + 0.5 * n(x.ma)) * n(x.sf);
      return [
        ['Required torque', f(t, 2) + ' N·m', { strong: true }],
        ['In kgf·cm', f(t * 10.197, 0) + ' kgf·cm'],
      ];
    },
    note: 'Arm mass assumed at mid-length; add dynamic margin for fast moves.',
  },
  {
    id: 'pack-designer', pack: 'robotics', title: 'Battery Pack S/P Designer', desc: 'Cells → pack configuration',
    inputs: [
      { k: 'vt', label: 'Target voltage', unit: 'V', def: '24' },
      { k: 'aht', label: 'Target capacity', unit: 'Ah', def: '10' },
      { k: 'vc', label: 'Cell nominal', unit: 'V', def: '3.6' },
      { k: 'ahc', label: 'Cell capacity', unit: 'Ah', def: '3.5' },
      { k: 'mc', label: 'Cell mass', unit: 'g', def: '48' },
    ],
    compute: (x) => {
      const S = Math.max(1, Math.round(n(x.vt) / n(x.vc)));
      const P = Math.max(1, Math.ceil(n(x.aht) / n(x.ahc)));
      const wh = S * n(x.vc) * P * n(x.ahc);
      return [
        ['Configuration', S + 'S' + P + 'P (' + S * P + ' cells)', { strong: true }],
        ['Pack nominal', f(S * n(x.vc), 1) + ' V · ' + f(P * n(x.ahc), 1) + ' Ah'],
        ['Energy', f(wh, 0) + ' Wh', { strong: true }],
        ['Cell mass total', f(S * P * n(x.mc) / 1000, 2) + ' kg (+15–25% pack overhead)'],
      ];
    },
  },
  {
    id: 'gear-train', pack: 'robotics', title: 'Gear Train', desc: 'Up to two stages',
    inputs: [
      { k: 'rpm', label: 'Input speed', unit: 'rpm', def: '6000' },
      { k: 'tq', label: 'Input torque', unit: 'N·m', def: '0.08' },
      { k: 'r1', label: 'Stage 1 ratio', unit: ':1', def: '5' },
      { k: 'r2', label: 'Stage 2 ratio', unit: ':1', def: '4' },
      { k: 'eff', label: 'Efficiency / stage', unit: '%', def: '95' },
    ],
    compute: (x) => {
      const stages = n(x.r2) === 1 ? 1 : 2;
      const ratio = n(x.r1) * n(x.r2);
      const eff = Math.pow(n(x.eff) / 100, stages);
      return [
        ['Total ratio', f(ratio, 2) + ':1', { strong: true }],
        ['Output speed', f(n(x.rpm) / ratio, 1) + ' rpm'],
        ['Output torque', f(n(x.tq) * ratio * eff, 2) + ' N·m', { strong: true }],
        ['Train efficiency', f(eff * 100, 1) + '%'],
      ];
    },
  },
  {
    id: 'lead-screw', pack: 'robotics', title: 'Lead Screw', desc: 'Torque → linear force & speed',
    inputs: [
      { k: 'lead', label: 'Lead', unit: 'mm/rev', def: '8' },
      { k: 'tq', label: 'Motor torque', unit: 'N·m', def: '0.4' },
      { k: 'eff', label: 'Efficiency', unit: '%', def: '35' },
      { k: 'rpm', label: 'Speed', unit: 'rpm', def: '300' },
    ],
    compute: (x) => [
      ['Linear force', f(2000 * Math.PI * n(x.tq) * (n(x.eff) / 100) / n(x.lead), 0) + ' N', { strong: true }],
      ['Linear speed', f(n(x.lead) * n(x.rpm) / 60, 1) + ' mm/s'],
    ],
    note: 'Acme screws η ≈ 20–40%, ball screws η ≈ 90%.',
  },
  {
    id: 'belt-drive', pack: 'robotics', title: 'Belt / Pulley', desc: 'Ratio and belt length',
    inputs: [
      { k: 'd1', label: 'Driver Ø (or teeth)', unit: '', def: '20' },
      { k: 'd2', label: 'Driven Ø (or teeth)', unit: '', def: '60' },
      { k: 'c', label: 'Center distance', unit: 'mm', def: '120' },
    ],
    compute: (x) => [
      ['Ratio', f(n(x.d2) / n(x.d1), 2) + ':1', { strong: true }],
      ['Belt length', f(2 * n(x.c) + 1.5708 * (n(x.d1) + n(x.d2)) + Math.pow(n(x.d2) - n(x.d1), 2) / (4 * n(x.c)), 1) + ' mm'],
    ],
    note: 'Belt length valid when Ø are in mm; for teeth, multiply by tooth pitch.',
  },
  {
    id: 'arm-reach', pack: 'robotics', title: '2-Link Arm Workspace', desc: 'Reach envelope',
    inputs: [
      { k: 'l1', label: 'Link 1', unit: 'mm', def: '250' },
      { k: 'l2', label: 'Link 2', unit: 'mm', def: '200' },
    ],
    compute: (x) => {
      const rMax = n(x.l1) + n(x.l2);
      const rMin = Math.abs(n(x.l1) - n(x.l2));
      return [
        ['Max reach', f(rMax, 0) + ' mm', { strong: true }],
        ['Min reach (dead zone)', f(rMin, 0) + ' mm'],
        ['Annular workspace', f(Math.PI * (rMax * rMax - rMin * rMin) / 1e6, 3) + ' m² (planar)'],
      ];
    },
  },
  {
    id: 'encoder', pack: 'robotics', title: 'Encoder Resolution', desc: 'Counts → linear resolution',
    inputs: [
      { k: 'cpr', label: 'Encoder CPR', unit: '', def: '1024' },
      { k: 'q', label: 'Decoding', type: 'select', def: '4', options: [{ v: '1', label: '×1' }, { v: '2', label: '×2' }, { v: '4', label: '×4 quadrature' }] },
      { k: 'gr', label: 'Gear ratio', unit: ':1', def: '20' },
      { k: 'dia', label: 'Wheel Ø', unit: 'mm', def: '120' },
    ],
    compute: (x) => {
      const cpo = n(x.cpr) * n(x.q) * n(x.gr);
      const mmc = Math.PI * n(x.dia) / cpo;
      return [
        ['Counts / output rev', f(cpo, 0)],
        ['Linear resolution', f(mmc * 1000, 1) + ' µm/count', { strong: true }],
        ['Counts per mm', f(1 / mmc, 1)],
      ];
    },
  },

  // ---------------- MECHANICAL ----------------
  {
    id: 'beam', pack: 'mech', title: 'Cantilever Beam', desc: 'Deflection, stress, FOS',
    inputs: [
      { k: 'fN', label: 'End load', unit: 'N', def: '50' },
      { k: 'l', label: 'Length', unit: 'mm', def: '100' },
      { k: 'b', label: 'Width b', unit: 'mm', def: '20' },
      { k: 'h', label: 'Height h', unit: 'mm', def: '5' },
      { k: 'mat', label: 'Material', type: 'select', def: 'Aluminium 6061-T6', options: matOptions },
    ],
    compute: (x) => {
      const { E, y } = MATS[x.mat];
      const I = n(x.b) * Math.pow(n(x.h), 3) / 12;
      const dfl = n(x.fN) * Math.pow(n(x.l), 3) / (3 * E * 1000 * I);
      const sig = n(x.fN) * n(x.l) * (n(x.h) / 2) / I;
      const fos = y / sig;
      return [
        ['Deflection', f(dfl, 3) + ' mm', { strong: true }],
        ['Max stress', f(sig, 1) + ' MPa'],
        ['Factor of safety', f(fos, 2), { strong: true, cls: fos >= 2 ? 'ok' : 'bad' }],
      ];
    },
  },
  {
    id: 'snap-fit', pack: 'mech', title: 'Snap-Fit Cantilever', desc: 'Strain check + assembly force',
    inputs: [
      { k: 'b', label: 'Width b', unit: 'mm', def: '5' },
      { k: 'h', label: 'Thickness h', unit: 'mm', def: '1.5' },
      { k: 'l', label: 'Length L', unit: 'mm', def: '12' },
      { k: 'y', label: 'Deflection y', unit: 'mm', def: '1.2' },
      { k: 'mat', label: 'Material', type: 'select', def: 'ABS', options: matOptions },
    ],
    compute: (x) => {
      const { E, strain } = MATS[x.mat];
      const eps = 1.5 * n(x.y) * n(x.h) / Math.pow(n(x.l), 2) * 100;
      const P = E * 1000 * n(x.b) * Math.pow(n(x.h), 3) * n(x.y) / (4 * Math.pow(n(x.l), 3));
      return [
        ['Strain', f(eps, 2) + '% (allowable ' + strain + '%)', { strong: true, cls: eps <= strain ? 'ok' : 'bad' }],
        ['Verdict', ...verdict(eps <= strain, 'OK', 'WILL WHITEN / CRACK')],
        ['Deflection force', f(P, 1) + ' N'],
      ];
    },
  },
  {
    id: 'bolt-torque', pack: 'mech', title: 'Fastener Torque', desc: 'Preload → tightening torque',
    inputs: [
      { k: 'sz', label: 'Size', type: 'select', def: 'M4', options: Object.keys(BOLTS).map((k) => ({ v: k, label: k })) },
      { k: 'cl', label: 'Class', type: 'select', def: '8.8', options: Object.keys(PROOF).map((k) => ({ v: k, label: k })) },
      { k: 'kf', label: 'K factor', unit: '', def: '0.2' },
    ],
    compute: (x) => {
      const [d, As] = BOLTS[x.sz];
      const F = 0.75 * As * PROOF[x.cl];
      return [
        ['Preload (75% proof)', f(F / 1000, 2) + ' kN'],
        ['Tightening torque', f(n(x.kf) * F * d / 1000, 2) + ' N·m', { strong: true }],
      ];
    },
    note: 'K ≈ 0.2 dry steel, 0.15 lubricated, 0.3 stainless dry.',
  },
  {
    id: 'spring', pack: 'mech', title: 'Compression Spring', desc: 'Rate and load',
    inputs: [
      { k: 'dw', label: 'Wire Ø', unit: 'mm', def: '1.2' },
      { k: 'dm', label: 'Mean coil Ø', unit: 'mm', def: '10' },
      { k: 'na', label: 'Active coils', unit: '', def: '8' },
      { k: 'x', label: 'Deflection', unit: 'mm', def: '5' },
    ],
    compute: (x) => {
      const Gmod = 79300; // music wire, N/mm²
      const k = Gmod * Math.pow(n(x.dw), 4) / (8 * Math.pow(n(x.dm), 3) * n(x.na));
      return [
        ['Spring rate', f(k, 3) + ' N/mm', { strong: true }],
        ['Force at deflection', f(k * n(x.x), 1) + ' N'],
        ['Spring index C', f(n(x.dm) / n(x.dw), 1) + ' (aim 4–12)'],
      ];
    },
  },
  {
    id: 'draft-angle', pack: 'mech', title: 'Draft Angle', desc: 'Wall offset + texture minimum',
    inputs: [
      { k: 'depth', label: 'Wall depth', unit: 'mm', def: '30' },
      { k: 'ang', label: 'Draft angle', unit: '°', def: '1.5' },
      { k: 'tex', label: 'Texture depth', unit: 'mm', def: '0.05' },
    ],
    compute: (x) => [
      ['Offset at base', f(n(x.depth) * Math.tan(n(x.ang) * Math.PI / 180), 3) + ' mm', { strong: true }],
      ['Min draft for texture', f(Math.max(0.5, 1.5 * n(x.tex) / 0.025), 1) + '° (rule of thumb)'],
      ['Verdict', ...verdict(n(x.ang) >= Math.max(0.5, 1.5 * n(x.tex) / 0.025), 'DRAFT OK', 'INCREASE DRAFT')],
    ],
  },
  {
    id: 'thermal-exp', pack: 'mech', title: 'Thermal Expansion', desc: 'ΔL over temperature range',
    inputs: [
      { k: 'mat', label: 'Material', type: 'select', def: 'Aluminium', options: Object.keys(CTE).map((k) => ({ v: k, label: k + ' (' + CTE[k] + ')' })) },
      { k: 'l', label: 'Length', unit: 'mm', def: '200' },
      { k: 'dt', label: 'ΔT', unit: '°C', def: '40' },
    ],
    compute: (x) => [
      ['Expansion ΔL', f(CTE[x.mat] * n(x.l) * n(x.dt) / 1000, 3) + ' mm', { strong: true }],
      ['Per 100 mm', f(CTE[x.mat] * 100 * n(x.dt) / 1000, 3) + ' mm'],
    ],
  },
  {
    id: 'iso-fit', pack: 'mech', title: 'ISO Hole/Shaft Fit', desc: 'H7 hole vs g6 / k6 / p6 shaft',
    inputs: [
      { k: 'd', label: 'Nominal Ø (3–50)', unit: 'mm', def: '10' },
      { k: 'fit', label: 'Fit', type: 'select', def: 'H7/g6 (sliding clearance)', options: Object.keys(DEV).map((k) => ({ v: k, label: k })) },
    ],
    compute: (x) => {
      const d = n(x.d);
      const i = FIT_RANGES.findIndex(([a, b]) => d > a && d <= b);
      if (i < 0) return [['Error', 'supported range 3–50 mm', { cls: 'bad' }]];
      const it6 = IT6[i], it7 = IT7[i];
      const dev = DEV[x.fit];
      let es, ei;
      if (dev.type === 'g') { es = dev.es[i]; ei = es - it6; }
      else { ei = dev.ei[i]; es = ei + it6; }
      const minC = 0 - es, maxC = it7 - ei;
      return [
        ['Hole H7', '+0 / +' + it7 + ' µm'],
        ['Shaft', (ei >= 0 ? '+' : '') + ei + ' / ' + (es >= 0 ? '+' : '') + es + ' µm'],
        ['Clearance', f(minC, 0) + ' … ' + f(maxC, 0) + ' µm', { strong: true }],
        ['Character', minC >= 0 ? 'always clearance' : maxC <= 0 ? 'always interference' : 'transition'],
      ];
    },
  },
  {
    id: 'section', pack: 'mech', title: 'Section Properties', desc: 'I and Z for common shapes',
    inputs: [
      { k: 'shape', label: 'Shape', type: 'select', def: 'rect', options: [{ v: 'rect', label: 'rectangle b×h' }, { v: 'round', label: 'solid round Ø D' }, { v: 'tube', label: 'tube ØD / Ød' }] },
      { k: 'b', label: 'b', unit: 'mm', def: '20' },
      { k: 'h', label: 'h', unit: 'mm', def: '10' },
      { k: 'D', label: 'D', unit: 'mm', def: '20' },
      { k: 'di', label: 'd (inner)', unit: 'mm', def: '16' },
    ],
    compute: (x) => {
      let I, c;
      if (x.shape === 'rect') { I = n(x.b) * Math.pow(n(x.h), 3) / 12; c = n(x.h) / 2; }
      else if (x.shape === 'round') { I = Math.PI * Math.pow(n(x.D), 4) / 64; c = n(x.D) / 2; }
      else { I = Math.PI * (Math.pow(n(x.D), 4) - Math.pow(n(x.di), 4)) / 64; c = n(x.D) / 2; }
      return [
        ['I (bending)', f(I, 1) + ' mm⁴', { strong: true }],
        ['Z = I/c', f(I / c, 1) + ' mm³'],
      ];
    },
    note: 'Only the fields for the chosen shape are used.',
  },

  // ---------------- EV / POWER ----------------
  {
    id: 'ev-range', pack: 'ev', title: 'EV / Robot Range', desc: 'Pack energy → distance',
    inputs: [
      { k: 'wh', label: 'Pack energy', unit: 'Wh', def: '1500' },
      { k: 'use', label: 'Usable', unit: '%', def: '85' },
      { k: 'cons', label: 'Consumption', unit: 'Wh/km', def: '25' },
      { k: 'v', label: 'Avg speed', unit: 'km/h', def: '15' },
    ],
    compute: (x) => {
      const km = n(x.wh) * n(x.use) / 100 / n(x.cons);
      return [
        ['Range', f(km, 1) + ' km', { strong: true }],
        ['Endurance', f(km / n(x.v), 2) + ' h at ' + x.v + ' km/h'],
      ];
    },
  },
  {
    id: 'wheel-perf', pack: 'ev', title: 'Traction Requirement', desc: 'Accel + grade + rolling → torque & power',
    inputs: [
      { k: 'm', label: 'Mass', unit: 'kg', def: '80' },
      { k: 'vt', label: 'Target speed', unit: 'km/h', def: '20' },
      { k: 't', label: 'Reach in', unit: 's', def: '5' },
      { k: 'r', label: 'Wheel radius', unit: 'mm', def: '80' },
      { k: 'gr', label: 'Grade', unit: '%', def: '10' },
      { k: 'crr', label: 'Rolling coeff', unit: '', def: '0.015' },
    ],
    compute: (x) => {
      const v = n(x.vt) / 3.6;
      const F = n(x.m) * (v / n(x.t)) + n(x.m) * G * (n(x.gr) / 100) + n(x.crr) * n(x.m) * G;
      return [
        ['Tractive force', f(F, 0) + ' N'],
        ['Total wheel torque', f(F * n(x.r) / 1000, 1) + ' N·m', { strong: true }],
        ['Power at target speed', f(F * v, 0) + ' W', { strong: true }],
      ];
    },
    note: 'Aero drag ignored — fine below ~30 km/h.',
  },
  {
    id: 'c-rate', pack: 'ev', title: 'C-Rate ↔ Current', desc: 'Discharge/charge rates',
    inputs: [
      { k: 'ah', label: 'Capacity', unit: 'Ah', def: '10' },
      { k: 'c', label: 'C-rate', unit: 'C', def: '2' },
      { k: 'v', label: 'Pack voltage', unit: 'V', def: '48' },
    ],
    compute: (x) => [
      ['Current', f(n(x.ah) * n(x.c), 1) + ' A', { strong: true }],
      ['Power', f(n(x.ah) * n(x.c) * n(x.v), 0) + ' W'],
      ['Full drain in', f(60 / n(x.c), 1) + ' min'],
    ],
  },
  {
    id: 'kv-motor', pack: 'ev', title: 'Motor from Kv', desc: 'BLDC constants from Kv and R',
    inputs: [
      { k: 'kv', label: 'Kv', unit: 'rpm/V', def: '190' },
      { k: 'v', label: 'Voltage', unit: 'V', def: '24' },
      { k: 'r', label: 'Winding R', unit: 'Ω', def: '0.12' },
    ],
    compute: (x) => {
      const kt = 9.549 / n(x.kv);
      const iStall = n(x.v) / n(x.r);
      return [
        ['No-load speed', f(n(x.kv) * n(x.v), 0) + ' rpm'],
        ['Kt', f(kt, 4) + ' N·m/A', { strong: true }],
        ['Stall torque', f(kt * iStall, 2) + ' N·m (at ' + f(iStall, 0) + ' A!)'],
        ['Max output power', f(n(x.v) * n(x.v) / (4 * n(x.r)), 0) + ' W (theoretical)'],
      ];
    },
    note: 'Stall current will demand serious wiring and cooling — check ESC limits.',
  },
  {
    id: 'regen', pack: 'ev', title: 'Regen Braking Energy', desc: 'Kinetic energy recovered per stop',
    inputs: [
      { k: 'm', label: 'Mass', unit: 'kg', def: '80' },
      { k: 'v1', label: 'From', unit: 'km/h', def: '20' },
      { k: 'v2', label: 'To', unit: 'km/h', def: '0' },
      { k: 'eff', label: 'Recovery efficiency', unit: '%', def: '55' },
    ],
    compute: (x) => {
      const e = 0.5 * n(x.m) * (Math.pow(n(x.v1) / 3.6, 2) - Math.pow(n(x.v2) / 3.6, 2)) * n(x.eff) / 100;
      return [
        ['Per stop', f(e / 3600, 2) + ' Wh', { strong: true }],
        ['Per 100 stops', f(e / 36, 1) + ' Wh'],
      ];
    },
  },
  {
    id: 'cell-balance', pack: 'ev', title: 'Pack Imbalance Check', desc: 'Cell spread health',
    inputs: [
      { k: 'vmin', label: 'Lowest cell', unit: 'V', def: '3.82' },
      { k: 'vmax', label: 'Highest cell', unit: 'V', def: '3.86' },
    ],
    compute: (x) => {
      const d = (n(x.vmax) - n(x.vmin)) * 1000;
      const cls = d < 20 ? 'ok' : d < 50 ? undefined : 'bad';
      return [
        ['Imbalance', f(d, 0) + ' mV', { strong: true, cls }],
        ['Assessment', d < 20 ? 'Excellent' : d < 50 ? 'Acceptable — monitor' : 'Balance / service required', { cls }],
      ];
    },
  },

  // ---------------- CONTROL SYSTEMS ----------------
  {
    id: 'pid-zn', pack: 'control', title: 'PID — Ziegler–Nichols (closed loop)', desc: 'From Ku and Tu',
    inputs: [
      { k: 'ku', label: 'Ultimate gain Ku', unit: '', def: '8' },
      { k: 'tu', label: 'Oscillation period Tu', unit: 's', def: '0.5' },
    ],
    compute: (x) => {
      const ku = n(x.ku), tu = n(x.tu);
      const kp = 0.6 * ku, ti = tu / 2, td = tu / 8;
      return [
        ['P only', 'Kp = ' + f(0.5 * ku, 3)],
        ['PI', 'Kp = ' + f(0.45 * ku, 3) + ', Ki = ' + f(0.45 * ku / (tu / 1.2), 3)],
        ['PID Kp', f(kp, 3), { strong: true }],
        ['PID Ki (Kp/Ti)', f(kp / ti, 3), { strong: true }],
        ['PID Kd (Kp·Td)', f(kp * td, 4), { strong: true }],
      ];
    },
    note: 'Find Ku/Tu with P-only control raised until steady oscillation. Aggressive tuning — back off Kp 20–30% for less overshoot.',
  },
  {
    id: 'pid-fopdt', pack: 'control', title: 'PID — from Step Response', desc: 'FOPDT (K, τ, dead time L)',
    inputs: [
      { k: 'kp', label: 'Process gain K', unit: '', def: '2' },
      { k: 'tau', label: 'Time constant τ', unit: 's', def: '1.5' },
      { k: 'ld', label: 'Dead time L', unit: 's', def: '0.2' },
    ],
    compute: (x) => {
      const kc = 1.2 * n(x.tau) / (n(x.kp) * n(x.ld));
      const ti = 2 * n(x.ld), td = 0.5 * n(x.ld);
      return [
        ['Kp', f(kc, 3), { strong: true }],
        ['Ki (Kp/Ti)', f(kc / ti, 3), { strong: true }],
        ['Kd (Kp·Td)', f(kc * td, 4), { strong: true }],
        ['Controllability τ/L', f(n(x.tau) / n(x.ld), 1) + (n(x.tau) / n(x.ld) < 4 ? ' — hard to control' : ' — well behaved')],
      ];
    },
    note: 'Fit K, τ, L from an open-loop step test. Ziegler–Nichols open-loop rules.',
  },
  {
    id: 'first-order', pack: 'control', title: 'First-Order Response', desc: 'τ → rise/settle/bandwidth',
    inputs: [{ k: 'tau', label: 'Time constant τ', unit: 'ms', def: '50' }],
    compute: (x) => [
      ['Rise time (10–90%)', f(2.2 * n(x.tau), 1) + ' ms'],
      ['Settling (2%)', f(4 * n(x.tau), 1) + ' ms', { strong: true }],
      ['Bandwidth', f(1000 / (2 * Math.PI * n(x.tau)), 2) + ' Hz'],
    ],
  },
  {
    id: 'second-order', pack: 'control', title: 'Second-Order Response', desc: 'ωn, ζ → overshoot & settling',
    inputs: [
      { k: 'wn', label: 'Natural freq ωn', unit: 'rad/s', def: '20' },
      { k: 'z', label: 'Damping ζ', unit: '', def: '0.5' },
    ],
    compute: (x) => {
      const z = n(x.z), wn = n(x.wn);
      if (z >= 1) return [['Overdamped', 'no overshoot; ts ≈ ' + f(4 / (z * wn), 3) + ' s']];
      const mp = Math.exp(-Math.PI * z / Math.sqrt(1 - z * z)) * 100;
      return [
        ['Overshoot', f(mp, 1) + '%', { strong: true, cls: mp > 25 ? 'bad' : undefined }],
        ['Peak time', f(Math.PI / (wn * Math.sqrt(1 - z * z)), 3) + ' s'],
        ['Settling (2%)', f(4 / (z * wn), 3) + ' s', { strong: true }],
        ['Damped freq', f(wn * Math.sqrt(1 - z * z), 2) + ' rad/s'],
      ];
    },
  },
  {
    id: 'loop-rate', pack: 'control', title: 'Loop Rate Planner', desc: 'Control bandwidth → sample rates',
    inputs: [
      { k: 'bw', label: 'Control bandwidth', unit: 'Hz', def: '10' },
      { k: 'sensor', label: 'Sensor rate', unit: 'Hz', def: '200' },
    ],
    compute: (x) => [
      ['Loop rate (20×)', f(20 * n(x.bw), 0) + ' Hz (10–30× acceptable)', { strong: true }],
      ['Sensor Nyquist check', ...verdict(n(x.sensor) >= 10 * n(x.bw), 'OK (≥10× bw)', 'TOO SLOW — aliasing risk')],
      ['Latency budget', '< ' + f(1000 / (2 * Math.PI * n(x.bw)) / 3, 1) + ' ms total (≈ φ margin friendly)'],
    ],
  },
  {
    id: 'filter-alpha', pack: 'control', title: 'Filter Coefficients', desc: 'LPF α and complementary filter',
    inputs: [
      { k: 'fc', label: 'Cutoff', unit: 'Hz', def: '5' },
      { k: 'fs', label: 'Sample rate', unit: 'Hz', def: '200' },
      { k: 'tauC', label: 'Compl. filter τ', unit: 's', def: '0.5' },
    ],
    compute: (x) => {
      const dt = 1 / n(x.fs);
      const rc = 1 / (2 * Math.PI * n(x.fc));
      return [
        ['LPF α (y += α(x−y))', f(dt / (rc + dt), 4), { strong: true }],
        ['Complementary α (gyro weight)', f(n(x.tauC) / (n(x.tauC) + dt), 4), { strong: true }],
        ['Filter delay ≈', f(rc * 1000, 1) + ' ms'],
      ];
    },
  },

  // ---------------- COMMUNICATION ----------------
  {
    id: 'uart-timing', pack: 'comms', title: 'UART Timing', desc: 'Frame time and throughput',
    inputs: [
      { k: 'baud', label: 'Baud', unit: 'bps', def: '115200' },
      { k: 'par', label: 'Parity', type: 'select', def: '0', options: [{ v: '0', label: 'none' }, { v: '1', label: 'even/odd' }] },
    ],
    compute: (x) => {
      const bits = 1 + 8 + n(x.par) + 1;
      return [
        ['Bit time', f(1e6 / n(x.baud), 2) + ' µs'],
        ['Frame (' + bits + ' bits)', f(bits * 1e6 / n(x.baud), 1) + ' µs'],
        ['Max throughput', f(n(x.baud) / bits, 0) + ' bytes/s', { strong: true }],
      ];
    },
    note: 'Total baud mismatch budget ±2% (clock + framing).',
  },
  {
    id: 'bus-budget', pack: 'comms', title: 'I²C / SPI Bus Budget', desc: 'Utilization check',
    inputs: [
      { k: 'clk', label: 'Clock', unit: 'kHz', def: '400' },
      { k: 'bytes', label: 'Bytes / transaction', unit: 'B', def: '6' },
      { k: 'ovh', label: 'Overhead bits / txn', unit: 'b', def: '20' },
      { k: 'tps', label: 'Transactions / s', unit: '/s', def: '500' },
    ],
    compute: (x) => {
      const bitsPer = n(x.bytes) * 9 + n(x.ovh); // 9 = byte + ack (I²C worst case)
      const used = bitsPer * n(x.tps);
      const util = used / (n(x.clk) * 1000) * 100;
      return [
        ['Bits/s used', f(used, 0)],
        ['Bus utilization', f(util, 1) + '%', { strong: true, cls: util < 30 ? 'ok' : util < 70 ? undefined : 'bad' }],
        ['Verdict', util < 30 ? 'Comfortable' : util < 70 ? 'Watch for latency jitter' : 'Saturated — raise clock or split bus'],
      ];
    },
  },
  {
    id: 'link-budget', pack: 'comms', title: 'Wireless Link Budget', desc: 'FSPL → margin',
    inputs: [
      { k: 'ptx', label: 'TX power', unit: 'dBm', def: '14' },
      { k: 'gt', label: 'Antenna gains (Σ)', unit: 'dBi', def: '4' },
      { k: 'd', label: 'Distance', unit: 'm', def: '100' },
      { k: 'fq', label: 'Frequency', unit: 'MHz', def: '2400' },
      { k: 'sens', label: 'RX sensitivity', unit: 'dBm', def: '-95' },
    ],
    compute: (x) => {
      const fspl = 32.44 + 20 * Math.log10(n(x.d) / 1000) + 20 * Math.log10(n(x.fq));
      const prx = n(x.ptx) + n(x.gt) - fspl;
      const margin = prx - n(x.sens);
      return [
        ['Free-space path loss', f(fspl, 1) + ' dB'],
        ['RX power', f(prx, 1) + ' dBm'],
        ['Link margin', f(margin, 1) + ' dB', { strong: true, cls: margin >= 15 ? 'ok' : margin >= 6 ? undefined : 'bad' }],
        ['Verdict', margin >= 15 ? 'Solid' : margin >= 6 ? 'Marginal indoors' : 'Will drop out'],
      ];
    },
    note: 'Free space only — add 10–30 dB for walls and bodies.',
  },
  {
    id: 'antenna', pack: 'comms', title: 'Antenna Length', desc: 'λ/2 and λ/4 elements',
    inputs: [{ k: 'fq', label: 'Frequency', unit: 'MHz', def: '433' }],
    compute: (x) => {
      const lam = 299792 / n(x.fq); // mm
      return [
        ['Wavelength λ', f(lam, 1) + ' mm'],
        ['λ/4 monopole (×0.95)', f(lam / 4 * 0.95, 1) + ' mm', { strong: true }],
        ['λ/2 dipole (×0.95)', f(lam / 2 * 0.95, 1) + ' mm'],
      ];
    },
  },
  {
    id: 'throughput', pack: 'comms', title: 'Packet Throughput', desc: 'Goodput and packet timing',
    inputs: [
      { k: 'pl', label: 'Payload', unit: 'B', def: '32' },
      { k: 'ov', label: 'Protocol overhead', unit: 'B', def: '12' },
      { k: 'rate', label: 'Link rate', unit: 'kbps', def: '250' },
    ],
    compute: (x) => {
      const tot = n(x.pl) + n(x.ov);
      const tPkt = tot * 8 / (n(x.rate) * 1000) * 1000;
      return [
        ['Packet time', f(tPkt, 2) + ' ms'],
        ['Max packets/s', f(1000 / tPkt, 0), { strong: true }],
        ['Goodput', f(n(x.pl) / tot * n(x.rate), 1) + ' kbps (' + f(n(x.pl) / tot * 100, 0) + '% efficient)'],
      ];
    },
  },
  {
    id: 'can-load', pack: 'comms', title: 'CAN Bus Load', desc: 'Frame math + utilization',
    inputs: [
      { k: 'rate', label: 'Bitrate', unit: 'kbps', def: '500' },
      { k: 'mps', label: 'Messages / s', unit: '/s', def: '800' },
      { k: 'len', label: 'Avg payload', unit: 'B', def: '8' },
    ],
    compute: (x) => {
      const bits = (47 + 8 * n(x.len)) * 1.15; // std frame + avg stuffing
      const load = bits * n(x.mps) / (n(x.rate) * 1000) * 100;
      return [
        ['Bits per frame ≈', f(bits, 0)],
        ['Bus load', f(load, 1) + '%', { strong: true, cls: load < 30 ? 'ok' : load < 70 ? undefined : 'bad' }],
        ['Verdict', load < 30 ? 'Healthy' : load < 70 ? 'OK — watch low-priority latency' : 'Overloaded'],
      ];
    },
  },
];
