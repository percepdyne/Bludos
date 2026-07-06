import React, { useCallback, useEffect, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Editor from './components/Editor.jsx';
import Archive from './components/Archive.jsx';
import Trash from './components/Trash.jsx';
import TemplatesModal from './components/TemplatesModal.jsx';
import PromptModal from './components/PromptModal.jsx';
import QuickOpen from './components/QuickOpen.jsx';
import TEMPLATE_PACKS from './templates.json';

const invoke = (...a) => window.bludos.invoke(...a);

const RECENTS_KEY = 'bludos-recents';
const loadRecents = () => {
  try { return JSON.parse(localStorage.getItem(RECENTS_KEY)) || []; } catch { return []; }
};

export default function App() {
  if (!window.bludos) {
    return <div className="fatal">Bludos must run inside its app shell. Start it with <code>npm start</code>.</div>;
  }

  const [info, setInfo] = useState(null);
  const [config, setConfig] = useState({});
  const [tree, setTree] = useState({ projects: [] });
  const [view, setView] = useState({ type: 'home' });
  const [showTemplates, setShowTemplates] = useState(null); // null | { project?, folderName? }
  const [prompt, setPrompt] = useState(null);
  const [quickOpen, setQuickOpen] = useState(false);
  const [recents, setRecents] = useState(loadRecents);

  const refreshTree = useCallback(async () => setTree(await invoke('tree:get')), []);

  useEffect(() => {
    invoke('workspace:info').then(setInfo);
    invoke('config:get').then(setConfig);
    refreshTree();
  }, [refreshTree]);

  // Block the window from navigating away when files are dropped outside a drop zone
  useEffect(() => {
    const stop = (e) => e.preventDefault();
    window.addEventListener('dragover', stop);
    window.addEventListener('drop', stop);
    return () => {
      window.removeEventListener('dragover', stop);
      window.removeEventListener('drop', stop);
    };
  }, []);

  // Ctrl+P / Ctrl+K quick-open
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'k')) {
        e.preventDefault();
        setQuickOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const openPage = (rel) => {
    setView({ type: 'page', rel });
    setRecents((r) => {
      const next = [rel, ...r.filter((x) => x !== rel)].slice(0, 12);
      try { localStorage.setItem(RECENTS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  const newProject = () =>
    setPrompt({
      title: 'New project',
      placeholder: 'Project name…',
      submitLabel: 'Create',
      onSubmit: async (name) => {
        setPrompt(null);
        if (name && name.trim()) setTree(await invoke('project:create', name.trim()));
      },
    });

  const setOperator = () =>
    setPrompt({
      title: 'Operator name',
      placeholder: 'Your name (stamped as author on documents)…',
      initial: config.userName || '',
      submitLabel: 'Save',
      onSubmit: async (name) => {
        setPrompt(null);
        setConfig(await invoke('config:set', { userName: (name || '').trim() }));
      },
    });

  const switchWorkspace = () => invoke('workspace:choose'); // window reloads on success

  const newPage = async (project, folder) => {
    const rel = await invoke('page:create', project, folder, 'Untitled', '');
    await refreshTree();
    openPage(rel);
  };

  const trashPage = async (rel) => {
    await invoke('page:trash', rel);
    await refreshTree();
    if (view.type === 'page' && view.rel === rel) setView({ type: 'home' });
  };

  const exportProject = async (name) => {
    await invoke('project:export', name); // opens the exported folder in Explorer on success
  };

  return (
    <div className="app">
      <Sidebar
        tree={tree}
        activeRel={view.type === 'page' ? view.rel : null}
        operator={config.userName || ''}
        onOpenPage={openPage}
        onNewPage={newPage}
        onTrashPage={trashPage}
        onNewProject={newProject}
        onExportProject={exportProject}
        onShowTemplates={() => setShowTemplates({})}
        onShowTemplatesAt={(project, folderName) => setShowTemplates({ project, folderName })}
        onShowArchive={() => setView({ type: 'archive' })}
        onShowTrash={() => setView({ type: 'trash' })}
        onHome={() => setView({ type: 'home' })}
        onSetOperator={setOperator}
        onSwitchWorkspace={switchWorkspace}
      />
      <main className="main">
        {view.type === 'page' && (
          <Editor
            key={view.rel}
            rel={view.rel}
            onRenamed={(rel) => { setView({ type: 'page', rel }); refreshTree(); }}
          />
        )}
        {view.type === 'archive' && <Archive />}
        {view.type === 'trash' && <Trash onRestored={refreshTree} />}
        {view.type === 'home' && (
          <Home tree={tree} info={info} onNewProject={newProject} onShowTemplates={() => setShowTemplates({})} />
        )}
      </main>
      {showTemplates && info && (
        <TemplatesModal
          info={info}
          tree={tree}
          preset={showTemplates}
          currentRel={view.type === 'page' ? view.rel : null}
          onClose={() => setShowTemplates(null)}
          onInserted={async (rel) => {
            setShowTemplates(null);
            await refreshTree();
            openPage(rel);
          }}
        />
      )}
      {quickOpen && (
        <QuickOpen tree={tree} recents={recents} onOpen={openPage} onClose={() => setQuickOpen(false)} />
      )}
      {prompt && <PromptModal {...prompt} onCancel={() => setPrompt(null)} />}
    </div>
  );
}

function Home({ tree, info, onNewProject, onShowTemplates }) {
  const templateCount = TEMPLATE_PACKS.reduce((n, p) => n + p.templates.length, 0);
  const pageCount = tree.projects.reduce((n, pr) => n + pr.folders.reduce((m, f) => m + f.pages.length, 0), 0);
  return (
    <div className="home">
      <div className="dossier">
        <div className="dossier-top">
          <span>BLU_DOS // COVER SHEET</span>
          <span>CLASS: INTERNAL</span>
        </div>
        <div className="barcode" />
        <div className="dossier-title">
          <span className="dossier-mark">◆</span>
          <h1>BLUDOS</h1>
          <div className="dossier-sub">BLUE DOSSIER — LOCAL DESIGN DOCUMENTATION SYSTEM</div>
        </div>
        <table className="spec-table">
          <tbody>
            <tr><td>PROJECTS ON FILE</td><td>{String(tree.projects.length).padStart(2, '0')}</td></tr>
            <tr><td>DOCUMENTS</td><td>{String(pageCount).padStart(3, '0')}</td></tr>
            <tr><td>TEMPLATE LIBRARY</td><td>{templateCount} DOCS · {TEMPLATE_PACKS.length} PACKS</td></tr>
            <tr><td>STORAGE</td><td>{info ? info.root : '—'}</td></tr>
            <tr><td>MODE</td><td>LOCAL · OFFLINE-FIRST · PLAIN MARKDOWN</td></tr>
            <tr><td>QUICK JUMP</td><td>CTRL+P</td></tr>
          </tbody>
        </table>
        <div className="home-actions">
          <button className="primary" onClick={onNewProject}>+ NEW PROJECT</button>
          <button onClick={onShowTemplates}>▤ BROWSE TEMPLATE LIBRARY</button>
        </div>
        {tree.projects.length === 0 && (
          <p className="home-hint">
            ▸ A new project is born with all 11 design phases plus Living Docs, ready for templates.
          </p>
        )}
        <div className="dossier-foot">
          <span>EST. 2026 · PHYSICAL PRODUCT DESIGN</span>
          <span>REV B.0</span>
        </div>
      </div>
    </div>
  );
}
