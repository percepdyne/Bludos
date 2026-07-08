// CSV → SVG line chart + stats block. Pure (no DOM): testable in node and
// usable from the editor's drop handler. Charts render on the paper sheet,
// so the styling is print-safe ink on light ground.

const f = (v, d = 3) => (Number.isFinite(v) ? Number(v.toFixed(d)).toString() : '—');
const COLORS = ['#0e2a52', '#9dc20e', '#d97706', '#c2334d'];

export function csvChart(text, name) {
  const lines = String(text).trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return { ok: false, error: 'need at least 2 rows' };
  const cells = lines.map((l) => l.split(/[,;\t]/).map((c) => c.trim()));
  const width = Math.max(...cells.map((r) => r.length));
  const headerRow = cells[0].some((c) => c !== '' && !Number.isFinite(parseFloat(c)));
  const headers = headerRow ? cells[0] : cells[0].map((_, i) => 'col' + (i + 1));
  const data = (headerRow ? cells.slice(1) : cells).map((r) => r.map((c) => parseFloat(c)));
  if (!data.length) return { ok: false, error: 'no data rows' };

  const numericCols = [];
  for (let i = 0; i < width; i++) if (data.every((r) => Number.isFinite(r[i]))) numericCols.push(i);
  if (!numericCols.length) return { ok: false, error: 'no fully numeric column' };

  let xIdx = null;
  let yCols = numericCols;
  if (numericCols.length >= 2) { xIdx = numericCols[0]; yCols = numericCols.slice(1, 5); }
  else yCols = numericCols.slice(0, 1);

  const xs = data.map((r, i) => (xIdx === null ? i : r[xIdx]));
  const series = yCols.map((ci, si) => ({
    name: headers[ci] || 'col' + (ci + 1),
    color: COLORS[si % COLORS.length],
    vals: data.map((r) => r[ci]),
  }));

  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const all = series.flatMap((s) => s.vals);
  let yMin = Math.min(...all), yMax = Math.max(...all);
  if (yMin === yMax) { yMin -= 1; yMax += 1; }
  const L = 62, R = 748, T = 24, B = 296;
  const X = (v) => (xMax === xMin ? (L + R) / 2 : L + (v - xMin) / (xMax - xMin) * (R - L));
  const Y = (v) => B - (v - yMin) / (yMax - yMin) * (B - T);

  const grid = [0, 0.25, 0.5, 0.75, 1].map((t) => {
    const y = T + t * (B - T);
    const val = yMax - t * (yMax - yMin);
    return `<line x1="${L}" y1="${y}" x2="${R}" y2="${y}" stroke="#d8d6cc" stroke-width="1"/>` +
      `<text x="${L - 6}" y="${y + 3}" text-anchor="end" font-size="9" fill="#77796e" font-family="Consolas,monospace">${f(val, 2)}</text>`;
  }).join('');

  const polys = series.map((s) =>
    `<polyline fill="none" stroke="${s.color}" stroke-width="1.8" points="${s.vals.map((v, i) => X(xs[i]).toFixed(1) + ',' + Y(v).toFixed(1)).join(' ')}"/>`
  ).join('');

  const legend = series.map((s, i) =>
    `<rect x="${L + i * 150}" y="${B + 22}" width="10" height="10" fill="${s.color}"/>` +
    `<text x="${L + i * 150 + 15}" y="${B + 31}" font-size="10" fill="#191b16" font-family="Consolas,monospace">${s.name}</text>`
  ).join('');

  const xLabel = xIdx === null ? 'index' : headers[xIdx] || 'x';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 340" font-family="Segoe UI,sans-serif">
<rect width="760" height="340" fill="#f1f0ea"/>
<text x="${L}" y="14" font-size="10" letter-spacing="2" fill="#77796e" font-family="Consolas,monospace">DATA ▮ ${name.toUpperCase()}</text>
${grid}${polys}
<line x1="${L}" y1="${B}" x2="${R}" y2="${B}" stroke="#191b16" stroke-width="1.2"/>
<line x1="${L}" y1="${T}" x2="${L}" y2="${B}" stroke="#191b16" stroke-width="1.2"/>
<text x="${L}" y="${B + 12}" font-size="9" fill="#77796e" font-family="Consolas,monospace">${f(xMin, 2)}</text>
<text x="${R}" y="${B + 12}" text-anchor="end" font-size="9" fill="#77796e" font-family="Consolas,monospace">${f(xMax, 2)} ${xLabel}</text>
${legend}</svg>`;

  const stats = series.map((s) => {
    const mean = s.vals.reduce((a, b) => a + b, 0) / s.vals.length;
    return [s.name, `n=${s.vals.length} · min ${f(Math.min(...s.vals))} · max ${f(Math.max(...s.vals))} · mean ${f(mean)}`];
  });
  return { ok: true, svg, stats };
}

export function chartBlock(name, stats) {
  const date = new Date().toISOString().slice(0, 10);
  return '`DATA ▮ csv-chart · ' + name + ' · ' + date + '`\n\n' +
    '| Series | Summary |\n| --- | --- |\n' +
    stats.map(([a, b]) => `| ${a} | ${b} |`).join('\n');
}
