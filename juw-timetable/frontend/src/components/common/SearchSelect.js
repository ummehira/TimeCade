// frontend/src/components/common/SearchSelect.js
import React, { useState, useRef, useEffect } from 'react';

export default function SearchSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  required = false,
}) {
  const [open,   setOpen]   = useState(false);
  const [search, setSearch] = useState('');
  const wrapRef  = useRef();
  const inputRef = useRef();

  useEffect(() => {
    const handler = e => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const filtered = options.filter(o =>
    String(o.label).toLowerCase().includes(search.toLowerCase())
  );

  const selected = options.find(o => String(o.value) === String(value));

  const triggerStyle = {
    width: '100%', padding: '8px 30px 8px 10px',
    border: '1px solid #dde3e8', borderRadius: '6px',
    fontSize: '12px', fontFamily: 'inherit',
    color: selected ? '#1a2e3a' : '#9ca3af',
    background: 'white', cursor: 'pointer',
    outline: 'none', textAlign: 'left',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    position: 'relative', display: 'block',
    boxSizing: 'border-box',
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>

      {/* Hidden native select for form validation */}
      {required && (
        <select
          required
          value={value || ''}
          onChange={() => {}}
          tabIndex={-1}
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
        >
          <option value="" />
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )}

      {/* Trigger button */}
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => { setOpen(o => !o); setSearch(''); }}
          style={triggerStyle}
        >
          {selected ? selected.label : placeholder}
        </button>
        {/* Chevron */}
        <svg
          style={{ position: 'absolute', right: '8px', top: '50%', transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`, transition: 'transform 0.15s', pointerEvents: 'none' }}
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8fa5b0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 3px)', left: 0, right: 0, zIndex: 9999,
          background: 'white', border: '1px solid #dde3e8', borderRadius: '8px',
          boxShadow: '0 6px 20px rgba(0,0,0,0.12)', overflow: 'hidden',
        }}>
          {/* Search input */}
          <div style={{ padding: '7px 8px', borderBottom: '1px solid #f0f4f7', position: 'relative' }}>
            <svg style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}
              width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1a2e3a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={inputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              style={{ width: '100%', padding: '5px 8px 5px 26px', border: '1px solid #e0e8ed', borderRadius: '5px', fontSize: '11px', fontFamily: 'inherit', outline: 'none', color: '#1a2e3a', boxSizing: 'border-box' }}
            />
          </div>

          {/* Options */}
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {/* Clear / placeholder option */}
            <div
              onClick={() => { onChange(''); setOpen(false); setSearch(''); }}
              style={{ padding: '7px 12px', fontSize: '11px', color: '#9ca3af', cursor: 'pointer', borderBottom: '1px solid #f5f8fa' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {placeholder}
            </div>

            {filtered.length === 0 ? (
              <div style={{ padding: '12px', textAlign: 'center', fontSize: '11px', color: '#aabbc8' }}>No results</div>
            ) : (
              filtered.map(o => {
                const isActive = String(o.value) === String(value);
                return (
                  <div
                    key={o.value}
                    onClick={() => { onChange(o.value); setOpen(false); setSearch(''); }}
                    style={{
                      padding: '7px 12px', fontSize: '12px', cursor: 'pointer',
                      background: isActive ? '#f0f6fa' : 'transparent',
                      color: isActive ? '#2d4a5a' : '#1a2e3a',
                      fontWeight: isActive ? '700' : '400',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {o.label}
                    {isActive && (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#2d4a5a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}