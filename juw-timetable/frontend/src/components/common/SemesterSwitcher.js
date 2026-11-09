// frontend/src/components/common/SemesterSwitcher.js
import React, { useState } from 'react';
import { CalendarRange } from 'lucide-react';
import { useSemester, SEMESTER_OPTIONS, semesterLabel, semesterShort } from '../../context/SemesterContext';

export default function SemesterSwitcher() {
  const { semester, loading, canChange, changeSemester } = useSemester();
  const [busy, setBusy] = useState(false);
  if (loading) return null;

  // Teachers / students: read-only badge
  if (!canChange) {
    return (
      <div title={semesterLabel(semester)} style={{ display:'flex',alignItems:'center',gap:'5px',padding:'5px 10px',borderRadius:'8px',
        background:'#eef4f8',color:'#2d4a5a',fontSize:'11px',fontWeight:'700' }}>
        <CalendarRange size={13}/> {semesterShort(semester)}
      </div>
    );
  }

  const pick = async n => {
    if (n === semester || busy) return;
    const ok = window.confirm(
      `Switch the whole system to ${semesterLabel(n)}?\n\n` +
      `Batch, teacher and room timetables, conflict checks, the AI agent and all dashboards will show ${semesterLabel(n)} only.\n` +
      `Unsaved changes on the current page will be lost.`
    );
    if (!ok) return;
    setBusy(true);
    try {
      await changeSemester(n);
      window.location.reload();   // reload so every page re-fetches for the new semester
    } catch (e) {
      window.alert(e.response?.data?.message || 'Could not change the semester.');
      setBusy(false);
    }
  };

  return (
    <div title="Active semester — change it once and every screen follows"
      style={{ display:'flex',alignItems:'center',gap:'6px' }}>
      <CalendarRange size={14} color="#5a7080"/>
      <div style={{ display:'flex',background:'#eef4f8',borderRadius:'8px',padding:'2px' }}>
        {SEMESTER_OPTIONS.map(n => (
          <button key={n} type="button" onClick={() => pick(n)} disabled={busy}
            style={{ border:'none',cursor:busy?'wait':'pointer',fontFamily:'inherit',padding:'5px 10px',borderRadius:'6px',
              fontSize:'11px',fontWeight:'700',
              background: semester === n ? '#2d4a5a' : 'transparent',
              color:      semester === n ? 'white'   : '#4a6070' }}>
            {semesterShort(n)}
          </button>
        ))}
      </div>
    </div>
  );
}
