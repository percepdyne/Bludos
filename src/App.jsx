import React, { useCallback, useEffect, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Editor from './components/Editor.jsx';
import Archive from './components/Archive.jsx';
import Trash from './components/Trash.jsx';
import TemplatesModal from './components/TemplatesModal.jsx';
import PromptModal from './components/PromptModal.jsx';
import QuickOpen from './components/QuickOpen.jsx';
import Toolbox from './components/Toolbox.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import GateRoom from './components/GateRoom.jsx';
import RemindersView from './components/RemindersView.jsx';
import ActivityView from './components/ActivityView.jsx';
import MusicPlayer from './components/MusicPlayer.jsx';
import Sketchbook from './components/Sketchbook.jsx';
import HatcheryView from './components/HatcheryView.jsx';
import DeckView from './components/DeckView.jsx';
import TEMPLATE_PACKS from './templates.json';
import { codename } from './tools/codename.js';
import { setFeedbackEnabled, fb } from './tools/feedback.js';

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
  const [settings, setSettings] = useState({});
  const [tree, setTree] = useState({ projects: [] });
  const [view, setView] = useState({ type: 'home' });
  const [showTemplates, setShowTemplates] = useState(null); // null | { project?, folderName? }
  const [prompt, setPrompt] = useState(null);
  const [quickOpen, setQuickOpen] = useState(false);
  const [toolboxOpen, setToolboxOpen] = useState(false);
  const [toolPrefill, setToolPrefill] = useState(null);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [overdue, setOverdue] = useState(0);
  const [banner, setBanner] = useState(null);
  const [booting, setBooting] = useState(() => !sessionStorage.getItem('bludos-booted'));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [recents, setRecents] = useState(loadRecents);

  const refreshTree = useCallback(async () => setTree(await invoke('tree:get')), []);

  useEffect(() => {
    invoke('workspace:info').then(setInfo);
    invoke('config:get').then(setConfig);
    invoke('settings:get').then(setSettings);
    refreshTree();
  }, [refreshTree]);

  // Appearance: accent + sheet applied as data attributes driving CSS variables
  useEffect(() => {
    const a = settings.appearance || {};
    document.documentElement.dataset.accent = a.accent || 'lime';
    document.documentElement.dataset.sheet = a.sheet || 'light';
    setFeedbackEnabled(!!settings.feedbackSound);
  }, [settings]);

  // boot sequence (once per app launch)
  useEffect(() => {
    if (!booting) return;
    sessionStorage.setItem('bludos-booted', '1');
    const t = setTimeout(() => setBooting(false), 1600);
    return () => clearTimeout(t);
  }, [booting]);

  const saveSettings = async (patch) => setSettings(await invoke('settings:set', patch));
  const saveConfig = async (patch) => setConfig(await invoke('config:set', patch));

  // reminder badge count + fire banner
  const refreshOverdue = useCallback(async () => {
    const list = await invoke('reminders:list');
    setOverdue(list.filter((r) => !r.done && new Date(r.dueISO).getTime() <= Date.now()).length);
  }, []);
  useEffect(() => {
    refreshOverdue();
    const off = window.bludos.on('reminder:fire', (due) => {
      setBanner(due[due.length - 1]);
      refreshOverdue();
    });
    const iv = setInterval(refreshOverdue, 60000);
    return () => { off && off(); clearInterval(iv); };
  }, [refreshOverdue]);

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

  // RECALC from a CALC block (or /calc slash) → open toolbox, prefilled if given
  useEffect(() => {
    const h = (e) => {
      if (e.detail && e.detail.id) setToolPrefill({ id: e.detail.id, vals: e.detail.vals, nonce: Date.now() });
      setToolboxOpen(true);
    };
    window.addEventListener('bludos:open-tool', h);
    return () => window.removeEventListener('bludos:open-tool', h);
  }, []);

  // Ctrl+L — today's lab-notebook log (tamper-evident chain)
  useEffect(() => {
    const onKey = async (e) => {
      if (!(e.ctrlKey || e.metaKey) || e.key !== 'l') return;
      e.preventDefault();
      const project = (view.type === 'page' && view.rel.split('/')[0]) || tree.projects[0]?.name;
      if (!project) return;
      const r = await invoke('log:today', project);
      await refreshTree();
      openPage(r.rel);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, tree, refreshTree]);

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
        onShowArchive={() => { fb.drawer(); setView({ type: 'archive' }); }}
        onShowTrash={() => setView({ type: 'trash' })}
        onShowGates={() => setView({ type: 'gates' })}
        onShowToolbox={() => setToolboxOpen((v) => !v)}
        onShowSettings={() => setSettingsOpen(true)}
        onShowActivity={() => setView({ type: 'activity' })}
        onShowPlayer={() => setPlayerOpen((v) => !v)}
        onShowSketch={() => setView({ type: 'sketch' })}
        onShowHatchery={() => setView({ type: 'hatchery' })}
        onShowDeck={() => setView({ type: 'deck' })}
        onShowReminders={() => setView({ type: 'reminders' })}
        hatcheryOn={settings.hatcheryEnabled !== false}
        overdue={overdue}
        onHome={() => setView({ type: 'home' })}
        onSetOperator={() => setSettingsOpen(true)}
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
        {view.type === 'gates' && <GateRoom onOpenPage={openPage} />}
        {view.type === 'reminders' && <RemindersView onOpenPage={openPage} onChanged={refreshOverdue} />}
        {view.type === 'activity' && <ActivityView />}
        {view.type === 'sketch' && <Sketchbook projects={tree.projects.map((p) => p.name)} />}
        {view.type === 'hatchery' && <HatcheryView onChanged={refreshTree} />}
        {view.type === 'deck' && <DeckView />}
        {view.type === 'home' && (
          <Home tree={tree} info={info} onNewProject={newProject} onOpenProject={(name) => {
            const proj = tree.projects.find((p) => p.name === name);
            const first = proj && proj.folders.flatMap((f) => f.pages)[0];
            if (first) openPage(first.rel); else setShowTemplates({ project: name });
          }} onShowTemplates={() => setShowTemplates({})} />
        )}
      </main>
      {booting && (
        <div className="boot" onClick={() => setBooting(false)}>
          <div className="boot-inner">
            <div className="boot-mark">◆</div>
            <div className="boot-title">BLUDOS</div>
            <div className="boot-line">SYSTEM ONLINE · BLUE DOSSIER</div>
            <div className="boot-bar"><div className="boot-bar-fill" /></div>
          </div>
        </div>
      )}
      {toolboxOpen && (
        <Toolbox
          settings={settings}
          operator={config.userName || ''}
          currentRel={view.type === 'page' ? view.rel : null}
          onClose={() => setToolboxOpen(false)}
          onSaveSettings={saveSettings}
          prefill={toolPrefill}
        />
      )}
      <MusicPlayer open={playerOpen} onClose={() => setPlayerOpen(false)} />
      {banner && (
        <div className="reminder-banner" onClick={() => { if (banner.rel) openPage(banner.rel); setBanner(null); }}>
          <span className="rb-ic">🔔</span>
          <span className="rb-text">{banner.text}</span>
          <button className="close" onClick={(e) => { e.stopPropagation(); setBanner(null); }}>✕</button>
        </div>
      )}
      {settingsOpen && (
        <SettingsModal
          settings={settings}
          config={config}
          info={info}
          onClose={() => setSettingsOpen(false)}
          onSaveSettings={saveSettings}
          onSaveConfig={saveConfig}
          onSwitchWorkspace={switchWorkspace}
        />
      )}
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

function Home({ tree, info, onNewProject, onOpenProject, onShowTemplates }) {
  const templateCount = TEMPLATE_PACKS.reduce((n, p) => n + p.templates.length, 0);
  const pageCount = tree.projects.reduce((n, pr) => n + pr.folders.reduce((m, f) => m + f.pages.length, 0), 0);
  const hue = (name) => { let h = 2166136261; for (const ch of name) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) % 360; };
  return (
    <div className="shelf-home">
      <div className="shelf-head">
        <div className="dossier-title">
          <span className="dossier-mark">◆</span>
          <h1>BLUDOS</h1>
          <div className="dossier-sub">BLUE DOSSIER — {String(tree.projects.length).padStart(2, '0')} PROJECTS · {String(pageCount).padStart(3, '0')} DOCS · {templateCount} TEMPLATES</div>
        </div>
        <div className="home-actions">
          <button className="primary" onClick={onNewProject}>+ NEW PROJECT</button>
          <button onClick={onShowTemplates}>▤ TEMPLATES</button>
        </div>
      </div>
      <div className="shelf">
        {tree.projects.map((pr) => {
          const docs = pr.folders.reduce((m, f) => m + f.pages.length, 0);
          const h = hue(pr.name);
          return (
            <div key={pr.name} className="folder" style={{ '--fh': h }} onClick={() => onOpenProject(pr.name)} title={`Open ${pr.name}`}>
              <div className="folder-tab" />
              <div className="folder-body">
                <div className="folder-code">{codename(pr.name)}</div>
                <div className="folder-name">{pr.name}</div>
                <div className="folder-meta">{docs} DOC{docs === 1 ? '' : 'S'}</div>
                <div className="folder-barcode" />
              </div>
            </div>
          );
        })}
        <div className="folder new-folder" onClick={onNewProject}>
          <div className="folder-tab" />
          <div className="folder-body"><div className="new-plus">+</div><div className="folder-meta">NEW PROJECT</div></div>
        </div>
      </div>
      {tree.projects.length === 0 && (
        <p className="home-hint">▸ Every project is born with all 11 design phases plus Living Docs — and a companion hatches for it.</p>
      )}
      <div className="shelf-foot"><span>STORAGE · {info ? info.root : '—'}</span><span>CTRL+P TO JUMP · LOCAL · OFFLINE-FIRST</span></div>
    </div>
  );
}
