// How "filled in" a document is: checklist items done, table data cells with
// content, and placeholder blanks resolved. Pure + testable; drives the
// per-page completeness ring and the Gate Room health score.

export function pageCompleteness(markdown) {
  const md = String(markdown || '');
  let filled = 0, total = 0;

  // 1. task checkboxes
  const done = (md.match(/- \[x\]/gi) || []).length;
  const todo = (md.match(/- \[ \]/g) || []).length;
  filled += done; total += done + todo;

  // 2. table data cells (skip header row + the |---| separator)
  // a separator row's cells are ALL dashes (optionally colon-aligned) — an
  // all-blank data row must not be mistaken for one.
  const isSep = (t) => /^\|.*\|$/.test(t) && t.slice(1, -1).split('|').every((c) => /^\s*:?-{2,}:?\s*$/.test(c));
  const lines = md.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!/^\|.*\|$/.test(l)) continue;
    if (isSep(l)) continue;                                 // separator row
    if (isSep((lines[i + 1] || '').trim())) continue;       // header (precedes separator)
    const cells = l.slice(1, -1).split('|').map((c) => c.trim());
    for (const c of cells) { total++; if (c) filled++; }
  }

  // 3. explicit blanks: "____" runs, or a label line ending ":" with nothing after
  for (const l of lines) {
    const t = l.trim();
    const blanks = (t.match(/_{3,}/g) || []).length;
    total += blanks; // each blank starts unfilled
    if (/[:：]\s*$/.test(t) && /^[-*]?\s*\**[\w ./&()-]{2,}\**\s*[:：]\s*$/.test(t)) {
      total++; // an empty "Field:" line is one unfilled slot
    }
  }

  const pct = total === 0 ? 100 : Math.round((filled / total) * 100);
  return { filled, total, pct };
}
