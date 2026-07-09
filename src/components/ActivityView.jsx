import React, { useEffect, useState } from 'react';

const invoke = (...a) => window.bludos.invoke(...a);

// GitHub-style contribution heatmap of documentation activity + streak.
export default function ActivityView() {
  const [data, setData] = useState(null);
  useEffect(() => { invoke('activity:summary').then(setData); }, []);
  if (!data) return <div className="activity"><div className="muted pad">READING ACTIVITY…</div></div>;

  // arrange days into week columns (7 rows). data.days is oldest→newest.
  const cols = [];
  for (let i = 0; i < data.days.length; i += 7) cols.push(data.days.slice(i, i + 7));
  const level = (c) => (c === 0 ? 0 : c >= data.max * 0.75 ? 4 : c >= data.max * 0.5 ? 3 : c >= data.max * 0.25 ? 2 : 1);

  return (
    <div className="activity">
      <h2><span className="panel-tag">▮ ACTIVITY</span> <span className="panel-sub">DOCUMENTATION HEATMAP</span></h2>
      <div className="activity-stats">
        <div className="astat"><div className="astat-n">{data.streak}</div><div className="astat-l">DAY STREAK</div></div>
        <div className="astat"><div className="astat-n">{data.total}</div><div className="astat-l">EDITS · {data.days.length}D</div></div>
        <div className="astat"><div className="astat-n">{data.max}</div><div className="astat-l">BUSIEST DAY</div></div>
      </div>
      <div className="heatmap">
        {cols.map((week, wi) => (
          <div key={wi} className="heat-col">
            {week.map((d) => (
              <div key={d.date} className={'heat-cell l' + level(d.count)} title={`${d.date}: ${d.count} edit${d.count === 1 ? '' : 's'}`} />
            ))}
          </div>
        ))}
      </div>
      <div className="heat-legend"><span>less</span><span className="heat-cell l0" /><span className="heat-cell l1" /><span className="heat-cell l2" /><span className="heat-cell l3" /><span className="heat-cell l4" /><span>more</span></div>
    </div>
  );
}
