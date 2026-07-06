import React, { useState } from 'react';
import TEMPLATE_PACKS from '../templates.json';

const invoke = (...a) => window.bludos.invoke(...a);

export default function TemplatesModal({ info, tree, onClose, onInserted }) {
  const [packId, setPackId] = useState(TEMPLATE_PACKS[0].id);
  const [selId, setSelId] = useState(null);
  const [robotics, setRobotics] = useState(true);
  const [project, setProject] = useState(tree.projects[0]?.name || '');

  const pack = TEMPLATE_PACKS.find((p) => p.id === packId);
  const templates = pack.templates.filter((t) => robotics || !t.roboOnly);
  const selected = templates.find((t) => t.id === selId) || null;

  const insert = async () => {
    if (!selected || !project) return;
    const folder = pack.phase == null ? 'Living Docs' : info.phaseFolders[pack.phase];
    const body = robotics ? selected.body : (selected.bodyCore ?? selected.body);
    const rel = await invoke('page:create', project, folder, selected.title, body);
    onInserted(rel);
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal templates-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Templates <span className="muted">— seeded from your V3 master checklist</span></h2>
          <label className="robo-toggle">
            <input type="checkbox" checked={robotics} onChange={(e) => setRobotics(e.target.checked)} />
            Include <code>[AI/ROBOT/EV]</code> items
          </label>
          <select value={project} onChange={(e) => setProject(e.target.value)}>
            {tree.projects.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
          <button className="close" onClick={onClose}>✕</button>
        </div>
        {tree.projects.length === 0 ? (
          <div className="pad muted">Create a project first — templates are inserted into a project's phase folder.</div>
        ) : (
          <div className="templates-cols">
            <div className="col packs">
              {TEMPLATE_PACKS.map((p) => (
                <div
                  key={p.id}
                  className={'pack' + (p.id === packId ? ' active' : '')}
                  onClick={() => { setPackId(p.id); setSelId(null); }}
                >
                  {p.title}
                  <span className="count">{p.templates.length}</span>
                </div>
              ))}
            </div>
            <div className="col tpls">
              {templates.map((t) => (
                <div
                  key={t.id}
                  className={'tpl' + (t.id === selId ? ' active' : '')}
                  onClick={() => setSelId(t.id)}
                >
                  {t.title}
                  {t.roboOnly && <span className="robo-badge">AI/ROBOT/EV</span>}
                </div>
              ))}
            </div>
            <div className="col preview">
              {selected ? (
                <>
                  <pre>{(robotics ? selected.body : (selected.bodyCore ?? selected.body)).slice(0, 2500)}</pre>
                  <button className="primary insert" onClick={insert}>
                    Insert into {project} ▸ {pack.phase == null ? 'Living Docs' : info.phaseFolders[pack.phase]}
                  </button>
                </>
              ) : (
                <div className="muted pad">Select a template to preview it.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
