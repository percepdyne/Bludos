import React, { useCallback, useEffect, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Editor from './components/Editor.jsx';
import Archive from './components/Archive.jsx';
import Trash from './components/Trash.jsx';
import TemplatesModal from './components/TemplatesModal.jsx';
import PromptModal from './components/PromptModal.jsx';
import TEMPLATE_PACKS from './templates.json';

const invoke = (...a) => window.bludos.invoke(...a);

export default function App() {
  if (!window.bludos) {
    return <div className="fatal">Bludos must run inside its app shell. Start it with <code>npm start</code>.</div>;
  }

  const [info, setInfo] = useState(null);
  const [tree, setTree] = useState({ projects: [] });
  const [view, setView] = useState({ type: 'home' });
  const [showTemplates, setShowTemplates] = useState(false);
  const [prompt, setPrompt] = useState(null);

  const refreshTree = useCallback(async () => setTree(await invoke('tree:get')), []);

  useEffect(() => {
    invoke('workspace:info').then(setInfo);
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

  const newProject = () =>
    setPrompt({
      title: 'New project',
      placeholder: 'Project name…',
      onSubmit: async (name) => {
        setPrompt(null);
        if (name && name.trim()) setTree(await invoke('project:create', name.trim()));
      },
    });

  const newPage = async (project, folder) => {
    const rel = await invoke('page:create', project, folder, 'Untitled', '');
    await refreshTree();
    setView({ type: 'page', rel });
  };

  const trashPage = async (rel) => {
    await invoke('page:trash', rel);
    await refreshTree();
    if (view.type === 'page' && view.rel === rel) setView({ type: 'home' });
  };

  return (
    <div className="app">
      <Sidebar
        tree={tree}
        activeRel={view.type === 'page' ? view.rel : null}
        onOpenPage={(rel) => setView({ type: 'page', rel })}
        onNewPage={newPage}
        onTrashPage={trashPage}
        onNewProject={newProject}
        onShowTemplates={() => setShowTemplates(true)}
        onShowArchive={() => setView({ type: 'archive' })}
        onShowTrash={() => setView({ type: 'trash' })}
        onHome={() => setView({ type: 'home' })}
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
          <Home tree={tree} info={info} onNewProject={newProject} onShowTemplates={() => setShowTemplates(true)} />
        )}
      </main>
      {showTemplates && info && (
        <TemplatesModal
          info={info}
          tree={tree}
          onClose={() => setShowTemplates(false)}
          onInserted={async (rel) => {
            setShowTemplates(false);
            await refreshTree();
            setView({ type: 'page', rel });
          }}
        />
      )}
      {prompt && <PromptModal {...prompt} onCancel={() => setPrompt(null)} />}
    </div>
  );
}

function Home({ tree, info, onNewProject, onShowTemplates }) {
  const templateCount = TEMPLATE_PACKS.reduce((n, p) => n + p.templates.length, 0);
  return (
    <div className="home">
      <div className="home-card">
        <div className="home-mark">◆</div>
        <h1>Bludos</h1>
        <p className="home-sub">blue dossier — your local design documentation studio</p>
        <p className="home-info">
          {tree.projects.length} project{tree.projects.length === 1 ? '' : 's'} · {templateCount} design-process
          templates · everything stored on this machine{info ? <> at <code>{info.root}</code></> : null}
        </p>
        <div className="home-actions">
          <button className="primary" onClick={onNewProject}>+ New Project</button>
          <button onClick={onShowTemplates}>Browse Templates</button>
        </div>
        {tree.projects.length === 0 && (
          <p className="home-hint">
            Start by creating a project — it comes pre-structured with all 11 design phases plus Living Docs.
          </p>
        )}
      </div>
    </div>
  );
}
