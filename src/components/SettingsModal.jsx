import React, { useState } from 'react';
import { TOOL_PACKS } from '../tools/tools.jsx';

const invoke = (...a) => window.bludos.invoke(...a);

const SECTIONS = ['Profile', 'Workspace', 'Appearance', 'Toolbox', 'Companion', 'Integrations', 'Shortcuts', 'Data'];
const ACCENTS = [
  { id: 'lime', color: '#c8f31d' },
  { id: 'cyan', color: '#67e8f9' },
  { id: 'amber', color: '#fbbf24' },
];

export default function SettingsModal({ settings, config, info, onClose, onSaveSettings, onSaveConfig, onSwitchWorkspace }) {
  const [sec, setSec] = useState('Profile');
  const [name, setName] = useState(config.userName || '');
  const [hook, setHook] = useState(settings.teamsWebhookUrl || '');
  const [chain, setChain] = useState(null);

  React.useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const appearance = settings.appearance || {};
  const packsCfg = settings.toolPacks || {};

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span className="panel-tag">▮ SETTINGS</span>
          <span className="panel-sub">WORKSPACE + OPERATOR CONFIGURATION</span>
          <button className="close" onClick={onClose}>✕</button>
        </div>
        <div className="settings-cols">
          <div className="settings-nav">
            {SECTIONS.map((s) => (
              <div key={s} className={'settings-nav-item' + (s === sec ? ' active' : '')} onClick={() => setSec(s)}>{s}</div>
            ))}
          </div>
          <div className="settings-body">
            {sec === 'Profile' && (
              <>
                <div className="col-label">OPERATOR</div>
                <p className="set-hint">Stamped as author / updatedBy on every document you create or edit.</p>
                <input value={name} onChange={(e) => setName(e.target.value)}
                  onBlur={() => onSaveConfig({ userName: name.trim() })}
                  placeholder="Your name…" style={{ width: 280 }} />
              </>
            )}
            {sec === 'Workspace' && (
              <>
                <div className="col-label">CURRENT WORKSPACE</div>
                <p className="set-path">{info?.root || '—'}</p>
                <p className="set-hint">All projects, pages, and archive assets live here as plain files. Point it at a shared or synced drive to collaborate.</p>
                <div className="color-row">
                  <button onClick={onSwitchWorkspace}>⇄ SWITCH WORKSPACE…</button>
                  <button onClick={() => invoke('workspace:open-folder')}>⌸ OPEN IN EXPLORER</button>
                </div>
              </>
            )}
            {sec === 'Appearance' && (
              <>
                <div className="col-label">THEME</div>
                <p className="set-hint">Light or dark across the whole app — text and fluorescent icons adapt for readability in both.</p>
                <div className="color-row">
                  {['dark', 'light'].map((m) => (
                    <button key={m}
                      className={(appearance.theme || 'dark') === m ? 'primary' : ''}
                      onClick={() => onSaveSettings({ appearance: { ...appearance, theme: m } })}
                    >{m === 'dark' ? '◐ DARK' : '◑ LIGHT'}</button>
                  ))}
                </div>
                <div className="col-label">ACCENT</div>
                <div className="color-row">
                  {ACCENTS.map((a) => (
                    <button key={a.id}
                      className={'accent-swatch' + ((appearance.accent || 'lime') === a.id ? ' on' : '')}
                      data-a={a.id}
                      style={{ background: a.color }}
                      title={a.id}
                      onClick={() => onSaveSettings({ appearance: { ...appearance, accent: a.id } })}
                    />
                  ))}
                </div>
                <div className="col-label">WRITING SHEET</div>
                <p className="set-hint">The paper surface in the editor, archive cards, and previews.</p>
                <div className="color-row">
                  {['light', 'dark'].map((m) => (
                    <button key={m}
                      className={(appearance.sheet || 'light') === m ? 'primary' : ''}
                      onClick={() => onSaveSettings({ appearance: { ...appearance, sheet: m } })}
                    >{m.toUpperCase()}</button>
                  ))}
                </div>
              </>
            )}
            {sec === 'Toolbox' && (
              <>
                <div className="col-label">TOOL PACKS</div>
                <p className="set-hint">Enable only what your discipline needs — tools ship in packs to avoid a junk drawer.</p>
                {TOOL_PACKS.map((p) => (
                  <label key={p.id} className="pack-toggle">
                    <input type="checkbox"
                      checked={packsCfg[p.id] !== false}
                      onChange={(e) => onSaveSettings({ toolPacks: { ...packsCfg, [p.id]: e.target.checked } })} />
                    <span>{p.title} ({p.tools.length})</span>
                    <span className="muted">
                      {p.tools.slice(0, 4).map((t) => t.title).join(' · ')}
                      {p.tools.length > 4 ? ` · +${p.tools.length - 4} more` : ''}
                    </span>
                  </label>
                ))}
              </>
            )}
            {sec === 'Companion' && (
              <>
                <div className="col-label">HATCHERY COMPANIONS</div>
                <p className="set-hint">A small companion hatches with each new project and evolves as you document. Purely ambient — it mirrors your project's real progress. When a project completes you can keep it on display (up to 3) or mint it as an achievement card in your Deck.</p>
                <label className="pack-toggle">
                  <input type="checkbox"
                    checked={settings.hatcheryEnabled !== false}
                    onChange={(e) => onSaveSettings({ hatcheryEnabled: e.target.checked })} />
                  <span>Enable companions</span>
                  <span className="muted">shows the Hatchery + Deck</span>
                </label>
                <label className="pack-toggle">
                  <input type="checkbox"
                    checked={!!settings.feedbackSound}
                    onChange={(e) => onSaveSettings({ feedbackSound: e.target.checked })} />
                  <span>Tactile feedback sounds</span>
                  <span className="muted">clicks & stamps (coming online)</span>
                </label>
              </>
            )}
            {sec === 'Integrations' && (
              <>
                <div className="col-label">MICROSOFT TEAMS — INCOMING WEBHOOK</div>
                <input value={hook} onChange={(e) => setHook(e.target.value)}
                  onBlur={() => onSaveSettings({ teamsWebhookUrl: hook.trim() })}
                  placeholder="https://… (Workflows webhook request URL)" style={{ width: '100%' }} />
                <p className="set-hint">Teams channel ▸ ⋯ ▸ Workflows ▸ "Post to a channel when a webhook request is received".</p>
                <div className="col-label">COMING IN WAVE 2+</div>
                <p className="set-hint">Claude / Gemini API keys (AI drafting, summaries, auto-tagging) · Bludos Clipper token (Chrome/Pinterest) · MCP server. See docs/TOOLBOX_ROADMAP.md.</p>
              </>
            )}
            {sec === 'Shortcuts' && (
              <>
                <div className="col-label">KEYBOARD</div>
                <table className="shortcut-table">
                  <tbody>
                    <tr><td><code>Ctrl+P</code> / <code>Ctrl+K</code></td><td>Quick-open a document</td></tr>
                    <tr><td><code>Enter</code> (title)</td><td>Commit rename</td></tr>
                    <tr><td><code>Ctrl+V</code> (editor)</td><td>Paste image from clipboard</td></tr>
                    <tr><td><code>Tab</code> (table)</td><td>Next cell</td></tr>
                  </tbody>
                </table>
              </>
            )}
            {sec === 'Data' && (
              <>
                <div className="col-label">THE TRENCH</div>
                <p className="set-hint">Nuked pages and assets sink to the Trench and are salvageable for 30 days, then dissolve permanently.</p>
                <div className="col-label">INDEXES</div>
                <p className="set-hint">Archive and trench indexes are written atomically with .bak fallbacks, and the archive index reconciles against the real files at every startup.</p>
                <div className="col-label">LAB NOTEBOOK CHAIN</div>
                <p className="set-hint">Ctrl+L opens today's log page. When a new day's log is created, the previous day is sealed: its SHA-256 joins an append-only chain, making the notebook tamper-evident.</p>
                <button onClick={async () => setChain(await invoke('log:verify'))}>⛓ VERIFY CHAIN</button>
                {chain && (
                  <p className="set-hint">
                    {chain.length === 0
                      ? 'Chain is empty — a log is sealed when the next day\'s log is created.'
                      : chain.every((c) => c.ok)
                        ? `✓ ${chain.length} sealed log(s) verified — no tampering detected.`
                        : `⚠ FAILED verification: ${chain.filter((c) => !c.ok).map((c) => c.file + (c.missing ? ' (missing)' : ' (modified)')).join(', ')}`}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
