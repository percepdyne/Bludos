import React, { useState } from 'react';
import ActivityView from './ActivityView.jsx';
import HatcheryView from './HatcheryView.jsx';
import DeckView from './DeckView.jsx';

// One tab that relates project progress to its companion: the documentation
// heatmap, the Hatchery (living companions), and the Deck (achievement cards).
export default function ActivityHub({ initialTab = 'heatmap', hatcheryOn, onChanged }) {
  const tabs = hatcheryOn ? ['heatmap', 'hatchery', 'deck'] : ['heatmap'];
  const [tab, setTab] = useState(tabs.includes(initialTab) ? initialTab : 'heatmap');
  const LABEL = { heatmap: '◷ HEATMAP', hatchery: '▦ HATCHERY', deck: '⬢ DECK' };

  return (
    <div className="activity-hub">
      {hatcheryOn && (
        <div className="hub-tabs">
          {tabs.map((t) => (
            <button key={t} className={'hub-tab' + (t === tab ? ' on' : '')} onClick={() => setTab(t)}>{LABEL[t]}</button>
          ))}
        </div>
      )}
      <div className="hub-body">
        {tab === 'heatmap' && <ActivityView />}
        {tab === 'hatchery' && <HatcheryView onChanged={onChanged} />}
        {tab === 'deck' && <DeckView />}
      </div>
    </div>
  );
}
