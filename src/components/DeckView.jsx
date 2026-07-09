import React, { useEffect, useState } from 'react';
import { PetArt, speciesName } from '../tools/pets.jsx';

const invoke = (...a) => window.bludos.invoke(...a);

export default function DeckView() {
  const [cards, setCards] = useState([]);
  useEffect(() => { invoke('deck:list').then(setCards); }, []);

  const days = (c) => Math.max(1, Math.round((new Date(c.completedAt) - new Date(c.hatchedAt)) / 8.64e7));

  return (
    <div className="deck">
      <h2><span className="panel-tag">▮ DECK</span> <span className="panel-sub">{cards.length} ACHIEVEMENT CARDS</span></h2>
      {cards.length === 0 && <p className="muted">No cards yet. Complete a project and mint its companion as a card.</p>}
      <div className="card-deck">
        {cards.map((c) => (
          <div key={c.id} className={'achievement' + (c.prime ? ' prime' : '') + (c.rare ? ' rare' : '')}>
            <div className="ach-top">
              <span>{c.prime ? 'PRIME' : c.rare ? 'RARE' : 'COMPANION'}</span>
              <span>{new Date(c.completedAt).toISOString().slice(0, 10)}</span>
            </div>
            <div className="ach-art">
              <PetArt species={c.species} stage={c.prime ? 5 : c.finalStage} hue={c.colorway} prime={c.prime} rare={c.rare} size={130} />
            </div>
            <div className="ach-name">{speciesName(c.species)}{c.rare ? ' ✦' : ''}</div>
            <div className="ach-project">{c.project}</div>
            <table className="ach-stats"><tbody>
              <tr><td>FORM</td><td>{['', 'Hatchling', 'Juvenile', 'Adult', 'Elder', 'Prime'][c.prime ? 5 : c.finalStage]}</td></tr>
              <tr><td>COMPLETION</td><td>{c.completion}%</td></tr>
              <tr><td>DOCUMENTS</td><td>{c.docs}</td></tr>
              <tr><td>DURATION</td><td>{days(c)} days</td></tr>
            </tbody></table>
          </div>
        ))}
      </div>
    </div>
  );
}
