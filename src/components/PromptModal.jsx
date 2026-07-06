import React, { useEffect, useRef, useState } from 'react';

export default function PromptModal({
  title, placeholder, hint, initial = '', submitLabel = 'OK', onSubmit, onCancel,
}) {
  const [val, setVal] = useState(initial);
  const ref = useRef(null);

  useEffect(() => { ref.current?.focus(); }, []);

  return (
    <div className="overlay" onClick={onCancel}>
      <div className="modal prompt-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <input
          ref={ref}
          placeholder={placeholder}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSubmit(val);
            if (e.key === 'Escape') onCancel();
          }}
        />
        {hint && <p className="prompt-hint">{hint}</p>}
        <div className="prompt-actions">
          <button onClick={onCancel}>Cancel</button>
          <button className="primary" onClick={() => onSubmit(val)}>{submitLabel}</button>
        </div>
      </div>
    </div>
  );
}
