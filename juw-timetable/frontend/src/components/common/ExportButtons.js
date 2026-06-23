// frontend/src/components/common/ExportButtons.js
// PDF-only export button in navy theme color.
// Props: entries, title, subtitle, filename, size ('sm'|'md'), disabled

import React, { useState } from 'react';
import { exportTimetablePDF } from '../../utils/exportTimetable';

const FileText = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);

const DownloadIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

export default function ExportButtons({ entries = [], title = 'Timetable', subtitle = '', filename, size = 'md', disabled = false }) {
  const [loading, setLoading] = useState(false);

  const isEmpty    = !entries || entries.length === 0;
  const isDisabled = disabled || isEmpty;
  const pad        = size === 'sm' ? '5px 14px' : '8px 18px';
  const fsize      = size === 'sm' ? '11px' : '12px';

  const handlePDF = async () => {
    if (isDisabled || loading) return;
    setLoading(true);
    try {
      exportTimetablePDF(entries, { title, subtitle, filename: filename ? `${filename}.pdf` : undefined });
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('PDF export failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePDF}
      disabled={isDisabled || loading}
      title={isEmpty ? 'No timetable data to export' : `Download ${title} as PDF`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: pad,
        border: 'none',
        borderRadius: '7px',
        fontSize: fsize,
        fontWeight: '700',
        fontFamily: 'inherit',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.4 : 1,
        background: '#2d4a5a',
        color: 'white',
        whiteSpace: 'nowrap',
        transition: 'opacity 0.15s',
      }}
      onMouseEnter={e => { if (!isDisabled) e.currentTarget.style.opacity = '0.85'; }}
      onMouseLeave={e => { if (!isDisabled) e.currentTarget.style.opacity = '1'; }}
    >
      {loading ? (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            style={{ animation: 'spin 1s linear infinite' }}>
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
            <path d="M12 2a10 10 0 0110 10" strokeLinecap="round"/>
          </svg>
          Exporting...
        </>
      ) : (
        <>
          <FileText size={size === 'sm' ? 12 : 14}/>
          Export PDF
          <DownloadIcon size={size === 'sm' ? 11 : 13}/>
        </>
      )}
      <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
    </button>
  );
}