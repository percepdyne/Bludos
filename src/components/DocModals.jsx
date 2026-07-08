import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { mdToHtml } from '../../electron/md2html.cjs';

const invoke = (...a) => window.bludos.invoke(...a);

const useEsc = (onClose) => {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    window.addEventListener('keydown', h, true);
    return () => window.removeEventListener('keydown', h, true);
  }, [onClose]);
};

// ---------- Blueprint Mode ----------

export function BlueprintModal({ rel, onClose }) {
  const [html, setHtml] = useState('');
  const [saving, setSaving] = useState(false);
  useEsc(onClose);
  useEffect(() => { invoke('page:blueprint-html', rel).then(setHtml); }, [rel]);

  const savePdf = async () => {
    setSaving(true);
    await invoke('page:blueprint-pdf', rel); // opens the PDF on success
    setSaving(false);
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="bp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ov-head">
          <span className="panel-tag">▮ BLUEPRINT MODE</span>
          <span className="panel-sub">CYANOTYPE RENDER · A4</span>
          <button className="primary" disabled={saving} onClick={savePdf}>{saving ? 'RENDERING…' : '⎙ SAVE PDF'}</button>
          <button className="close" onClick={onClose}>✕</button>
        </div>
        <iframe className="bp-frame" title="blueprint" srcDoc={html} />
      </div>
    </div>
  );
}

// ---------- QR sample tag ----------

export function TagModal({ rel, meta, title, onClose }) {
  const [qr, setQr] = useState('');
  const frameRef = useRef(null);
  useEsc(onClose);

  const payload = `BLU|${meta.doc || ''}|${title}|${rel}`;
  useEffect(() => {
    QRCode.toDataURL(payload, { margin: 1, width: 220, color: { dark: '#191b16', light: '#f1f0ea' } })
      .then(setQr)
      .catch(() => setQr(''));
  }, [payload]);

  const labelHtml = `<!doctype html><html><head><meta charset="utf-8"><style>
@page { size: 62mm 40mm; margin: 0; } body { margin:0; font-family:'Segoe UI',sans-serif; }
.lbl { width:62mm; height:40mm; box-sizing:border-box; background:#f1f0ea; color:#191b16; border:1px solid #191b16; padding:3mm; display:flex; gap:3mm; }
.qr { width:30mm; height:30mm; } .qr img { width:100%; }
.tx { flex:1; overflow:hidden; display:flex; flex-direction:column; }
.doc { font-family:Consolas,monospace; font-size:8pt; letter-spacing:.06em; font-weight:700; }
.tt { font-size:7.5pt; font-weight:600; line-height:1.25; flex:1; overflow:hidden; }
.meta { font-family:Consolas,monospace; font-size:6pt; color:#555; }
.bar { height:3mm; background:repeating-linear-gradient(90deg,#191b16 0 1px,transparent 1px 3px,#191b16 3px 5px,transparent 5px 7px); margin-top:1mm; }
</style></head><body><div class="lbl">
<div class="qr">${qr ? `<img src="${qr}">` : ''}</div>
<div class="tx"><div class="doc">${meta.doc || 'BLU-DOC'}</div><div class="tt">${title}</div>
<div class="meta">${meta.status || 'Draft'} · ${String(meta.updated || '').slice(0, 10)} · BLUDOS</div><div class="bar"></div></div>
</div></body></html>`;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal tag-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ov-head">
          <span className="panel-tag">▮ SAMPLE TAG</span>
          <span className="panel-sub">STICK IT ON THE PHYSICAL THING</span>
          <button className="primary" onClick={() => frameRef.current?.contentWindow?.print()}>⎙ PRINT</button>
          <button className="close" onClick={onClose}>✕</button>
        </div>
        <div className="tag-stage">
          <iframe ref={frameRef} title="tag" srcDoc={labelHtml} className="tag-frame" />
        </div>
        <p className="set-hint pad">Scanning the QR yields <code>{payload.slice(0, 60)}…</code> — doc №, title, and workspace path, so any phone can identify the sample even without Bludos.</p>
      </div>
    </div>
  );
}

// ---------- Revision history ----------

export function RevisionsModal({ rel, onClose, onRestored }) {
  const [revs, setRevs] = useState([]);
  const [sel, setSel] = useState(null); // { file, markdown, meta }
  useEsc(onClose);
  useEffect(() => { invoke('page:revisions', rel).then(setRevs); }, [rel]);

  const view = async (r) => {
    const data = await invoke('page:revision-read', rel, r.file);
    setSel({ ...r, ...data });
  };

  const restoreCopy = async () => {
    if (!sel) return;
    const parts = rel.split('/');
    const folder = parts.length >= 3 ? parts[1] : 'Living Docs';
    const title = parts[parts.length - 1].replace(/\.md$/i, '') + ' (rev ' + sel.status + ')';
    const newRel = await invoke('page:create', parts[0], folder, title, sel.markdown);
    onRestored(newRel);
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal rev-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ov-head">
          <span className="panel-tag">▮ REVISION VAULT</span>
          <span className="panel-sub">SNAPSHOT ON EVERY STATUS CHANGE · {String(revs.length).padStart(2, '0')} REVS</span>
          {sel && <button onClick={restoreCopy}>⚓ RESTORE AS COPY</button>}
          <button className="close" onClick={onClose}>✕</button>
        </div>
        <div className="rev-cols">
          <div className="rev-list">
            {revs.map((r) => (
              <div key={r.file} className={'rev-row' + (sel && sel.file === r.file ? ' active' : '')} onClick={() => view(r)}>
                <div className="rev-status">{r.status}</div>
                <div className="rev-when">{new Date(r.when).toLocaleString()}</div>
              </div>
            ))}
            {revs.length === 0 && (
              <div className="muted pad">No snapshots yet — a revision is captured every time this document's status changes.</div>
            )}
          </div>
          <div className="rev-view">
            {sel
              ? <div className="preview-render" dangerouslySetInnerHTML={{ __html: mdToHtml(sel.markdown) }} />
              : <div className="muted pad">Select a revision to view it.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
