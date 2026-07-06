import React, { useEffect, useMemo, useState } from 'react';
import TEMPLATE_PACKS from '../templates.json';
import { mdToHtml } from '../../electron/md2html.cjs';

const invoke = (...a) => window.bludos.invoke(...a);

const badgeFor = (packId) =>
  packId === 'user' ? 'USR' : packId.startsWith('m-') ? 'DOC' : 'CHK';

export default function TemplatesModal({ info, tree, preset = {}, currentRel, onClose, onInserted }) {
  const currentProject = preset.project || (currentRel ? currentRel.split('/')[0] : null);
  const currentFolder = preset.folderName || (currentRel && currentRel.split('/').length === 3 ? currentRel.split('/')[1] : null);

  const [userTpls, setUserTpls] = useState([]);
  const [packId, setPackId] = useState(TEMPLATE_PACKS[0].id);
  const [selId, setSelId] = useState(null);
  const [robotics, setRobotics] = useState(true);
  const [project, setProject] = useState(
    (currentProject && tree.projects.some((p) => p.name === currentProject) && currentProject) ||
    tree.projects[0]?.name || ''
  );
  const [folderIdx, setFolderIdx] = useState(() => {
    const i = currentFolder ? info.phaseFolders.indexOf(currentFolder) : -1;
    return i >= 0 ? i : (TEMPLATE_PACKS[0].defaultFolderIndex ?? 11);
  });

  useEffect(() => { invoke('templates:user').then(setUserTpls); }, []);

  const allPacks = useMemo(() => {
    const packs = [...TEMPLATE_PACKS];
    if (userTpls.length) {
      packs.push({
        id: 'user',
        title: 'My Studio — Saved Templates',
        source: 'Pages you saved as templates in this workspace',
        defaultFolderIndex: 11,
        templates: userTpls,
      });
    }
    return packs;
  }, [userTpls]);

  const pack = allPacks.find((p) => p.id === packId) || allPacks[0];
  const templates = pack.templates.filter((t) => robotics || !t.roboOnly);
  const selected = templates.find((t) => t.id === selId) || null;

  const pickPack = (p) => {
    setPackId(p.id);
    setSelId(null);
    const i = currentFolder ? info.phaseFolders.indexOf(currentFolder) : -1;
    setFolderIdx(i >= 0 ? i : (p.defaultFolderIndex ?? 11));
  };

  const insert = async () => {
    if (!selected || !project) return;
    const folder = info.phaseFolders[folderIdx];
    const body = robotics ? selected.body : (selected.bodyCore ?? selected.body);
    const rel = await invoke('page:create', project, folder, selected.title, body);
    onInserted(rel);
  };

  const phasePacks = allPacks.filter((p) => p.id.startsWith('phase-') || p.id === 'living-docs');
  const methodPacks = allPacks.filter((p) => p.id.startsWith('m-'));
  const userPacks = allPacks.filter((p) => p.id === 'user');
  const totalDocs = allPacks.reduce((n, p) => n + p.templates.length, 0);

  const previewHtml = useMemo(() => {
    if (!selected) return '';
    const body = (robotics ? selected.body : (selected.bodyCore ?? selected.body))
      .replaceAll('{{DOC}}', 'BLU-P##-SAMPLE')
      .replaceAll('{{DATE}}', new Date().toISOString().slice(0, 10));
    return mdToHtml(body);
  }, [selected, robotics]);

  const PackRow = ({ p }) => (
    <div className={'pack' + (p.id === pack.id ? ' active' : '')} onClick={() => pickPack(p)}>
      <span className="pack-title">{p.title}</span>
      <span className="count">{String(p.templates.length).padStart(2, '0')}</span>
    </div>
  );

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal templates-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span className="panel-tag">▮ TEMPLATE LIBRARY</span>
          <span className="panel-sub">{totalDocs} DOCS · {allPacks.length} PACKS</span>
          <label className="robo-toggle">
            <input type="checkbox" checked={robotics} onChange={(e) => setRobotics(e.target.checked)} />
            AI/ROBOT/EV items
          </label>
          <button className="close" onClick={onClose}>✕</button>
        </div>
        {tree.projects.length === 0 ? (
          <div className="pad muted">Create a project first — templates are inserted into a project's phase folder.</div>
        ) : (
          <>
            <div className="templates-cols">
              <div className="col packs">
                <div className="col-label">PHASE PACKS // V3 CHECKLISTS</div>
                {phasePacks.map((p) => <PackRow key={p.id} p={p} />)}
                <div className="col-label">METHOD LIBRARY // CROSS-INDUSTRY</div>
                {methodPacks.map((p) => <PackRow key={p.id} p={p} />)}
                {userPacks.length > 0 && <div className="col-label">MY STUDIO</div>}
                {userPacks.map((p) => <PackRow key={p.id} p={p} />)}
              </div>
              <div className="col tpls">
                <div className="col-label">DOCUMENTS</div>
                {pack.source && <div className="pack-source">{pack.source}</div>}
                {templates.map((t, i) => (
                  <div key={t.id} className={'tpl' + (t.id === selId ? ' active' : '')} onClick={() => setSelId(t.id)}>
                    <span className="tpl-idx">{String(i + 1).padStart(2, '0')}</span>
                    {t.title}
                    <span className="kind-badge">{t.roboOnly ? 'AI/EV' : badgeFor(pack.id)}</span>
                  </div>
                ))}
              </div>
              <div className="col preview">
                <div className="col-label">PREVIEW</div>
                {selected ? (
                  <div className="preview-render" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                ) : (
                  <div className="muted pad">Select a document to preview.</div>
                )}
              </div>
            </div>
            <div className="modal-foot">
              <span className="foot-label">INSERT INTO</span>
              <select value={project} onChange={(e) => setProject(e.target.value)}>
                {tree.projects.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
              </select>
              <span className="foot-label">▸</span>
              <select value={folderIdx} onChange={(e) => setFolderIdx(Number(e.target.value))}>
                {info.phaseFolders.map((f, i) => <option key={f} value={i}>{f}</option>)}
              </select>
              <button className="primary insert" disabled={!selected} onClick={insert}>⤓ INSERT DOCUMENT</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
