// Minimal GFM-ish markdown renderer shared by the template preview (renderer)
// and the HTML export (main process). Handles the subset Bludos writes:
// headings, task lists, bullet/numbered lists, tables, blockquotes, hr,
// code fences, inline marks, links, images.

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inline(s) {
  s = esc(s);
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*\w])\*([^*]+)\*/g, '$1<em>$2</em>');
  s = s.replace(/~~([^~]+)~~/g, '<s>$1</s>');
  s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2">');
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return s;
}

function mdToHtml(md) {
  const lines = String(md || '').split(/\r?\n/);
  const out = [];
  let i = 0;
  let inCode = false;
  let openList = null; // 'ul' | 'ol'
  const closeList = () => { if (openList) { out.push(`</${openList}>`); openList = null; } };

  while (i < lines.length) {
    const line = lines[i];
    let m;

    if (/^```/.test(line)) {
      if (!inCode) { closeList(); out.push('<pre><code>'); inCode = true; }
      else { out.push('</code></pre>'); inCode = false; }
      i++; continue;
    }
    if (inCode) { out.push(esc(line)); i++; continue; }
    if (/^\s*$/.test(line)) { closeList(); i++; continue; }

    if ((m = line.match(/^(#{1,6})\s+(.*)$/))) {
      closeList();
      out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`);
      i++; continue;
    }
    if (/^\s*---+\s*$/.test(line)) { closeList(); out.push('<hr>'); i++; continue; }
    if ((m = line.match(/^>\s?(.*)$/))) { closeList(); out.push(`<blockquote>${inline(m[1])}</blockquote>`); i++; continue; }

    if (/^\s*\|/.test(line)) {
      closeList();
      const rows = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) { rows.push(lines[i].trim()); i++; }
      const cells = (r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const hasHeader = rows.length > 1 && /^\|?\s*:?-{2,}/.test(rows[1].replace(/^\|/, ''));
      let html = '<table>';
      for (let r = 0; r < rows.length; r++) {
        if (r === 1 && hasHeader) continue;
        if (/^\|?\s*:?-{2,}/.test(rows[r].replace(/^\|/, ''))) continue;
        const tag = r === 0 && hasHeader ? 'th' : 'td';
        html += '<tr>' + cells(rows[r]).map((c) => `<${tag}>${inline(c)}</${tag}>`).join('') + '</tr>';
      }
      out.push(html + '</table>');
      continue;
    }

    if ((m = line.match(/^(\s*)- \[([ xX])\]\s+(.*)$/))) {
      closeList();
      const done = m[2] !== ' ';
      out.push(
        `<div class="task${done ? ' done' : ''}" style="margin-left:${m[1].length * 9}px">` +
        `<span class="box">${done ? '☑' : '☐'}</span> ${inline(m[3])}</div>`
      );
      i++; continue;
    }
    if ((m = line.match(/^\s*[-*]\s+(.*)$/))) {
      if (openList !== 'ul') { closeList(); out.push('<ul>'); openList = 'ul'; }
      out.push(`<li>${inline(m[1])}</li>`);
      i++; continue;
    }
    if ((m = line.match(/^\s*\d+\.\s+(.*)$/))) {
      if (openList !== 'ol') { closeList(); out.push('<ol>'); openList = 'ol'; }
      out.push(`<li>${inline(m[1])}</li>`);
      i++; continue;
    }

    closeList();
    out.push(`<p>${inline(line)}</p>`);
    i++;
  }
  closeList();
  if (inCode) out.push('</code></pre>');
  return out.join('\n');
}

module.exports = { mdToHtml };
