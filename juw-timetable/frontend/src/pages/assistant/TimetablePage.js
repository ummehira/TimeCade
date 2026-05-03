// frontend/src/pages/assistant/TimetablePage.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../utils/api';
import { useResponsive } from '../../hooks/useResponsive';
import SearchSelect from '../../components/common/SearchSelect';

const DAYS  = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const SLOTS = [
  { id:1, label:'9:00',  full:'9:00 - 10:00'  },
  { id:2, label:'10:00', full:'10:00 - 11:00' },
  { id:3, label:'11:00', full:'11:00 - 12:00' },
  { id:4, label:'12:00', full:'12:00 - 1:00'  },
  { id:5, label:'1:00',  full:'1:00 - 2:00'   },
];
const LAB_SLOTS = {
  1:'9:00 - 12:00 (Lab)',
  2:'10:00 - 1:00 (Lab)',
  3:'11:00 - 2:00 (Lab)',
};
// Slots 4 and 5 are invalid for labs (would exceed 2:00 PM)
const VALID_LAB_SLOTS = [1, 2, 3];
const CELL_NAVY  = '#2d4a5a';
const CELL_GREEN = '#3a6070';

// ── Conflict Alert ────────────────────────────────────────────────────────
function ConflictAlert({ conflicts, onClose }) {
  if (!conflicts?.length) return null;
  return (
    <div style={{ background:'#fef2f2',border:'2px solid #ef4444',borderRadius:'10px',padding:'14px 16px',marginBottom:'14px' }}>
      <div style={{ display:'flex',alignItems:'flex-start',gap:'10px' }}>
        <div style={{ width:'28px',height:'28px',background:'#ef4444',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:'13px',fontWeight:'800',color:'#dc2626',marginBottom:'6px' }}>Conflict Detected — Move blocked</div>
          {conflicts.map((c,i)=>(
            <div key={i} style={{ fontSize:'12px',color:'#9b1c1c',display:'flex',gap:'6px',marginBottom:'3px' }}>
              <span style={{ color:'#ef4444',fontWeight:'700' }}>✕</span>{c.message}
            </div>
          ))}
        </div>
        <button onClick={onClose} style={{ background:'#fecaca',border:'none',cursor:'pointer',color:'#dc2626',borderRadius:'50%',width:'22px',height:'22px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',fontWeight:'700',flexShrink:0 }}>×</button>
      </div>
    </div>
  );
}

// ── Add Class Form ────────────────────────────────────────────────────────
function AddClassForm({ rooms, selectedBatch, semester, batches, onAdd, loading }) {
  const { isMobile } = useResponsive();
  const [formBatch,      setFormBatch]      = useState(selectedBatch||'');
  const [formSemester,   setFormSemester]   = useState(semester||1);
  const [batchCourses,   setBatchCourses]   = useState([]);
  const [courseTeachers, setCourseTeachers] = useState([]);
  const [form, setForm] = useState({ subject_id:'', teacher_id:'', room_id:'', day:'', time_slot:'', is_lab:false });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const [batchDefaultRoom, setBatchDefaultRoom] = useState(null);

  useEffect(()=>{ if(selectedBatch) setFormBatch(selectedBatch); },[selectedBatch]);
  useEffect(()=>{ setFormSemester(semester); },[semester]);

  useEffect(()=>{
    if(!formBatch){ setBatchCourses([]); setBatchDefaultRoom(null); return; }
    // Load courses for batch
    api.get('/assignments/batch-courses',{params:{batch_id:formBatch,semester:formSemester}})
      .then(r=>setBatchCourses(r.data)).catch(()=>setBatchCourses([]));
    // Load batch default room from batches state
    const batch = batches.find(b=>String(b.id)===String(formBatch));
    const defRoom = batch?.default_room_id || null;
    setBatchDefaultRoom(defRoom ? String(defRoom) : null);
    if(defRoom) set('room_id', String(defRoom));
    setForm(f=>({...f,subject_id:'',teacher_id:''}));
    setCourseTeachers([]);
  },[formBatch,formSemester]);

  useEffect(()=>{
    if(!form.subject_id){ setCourseTeachers([]); return; }
    api.get('/assignments/course-teachers',{params:{subject_id:form.subject_id}})
      .then(r=>setCourseTeachers(r.data)).catch(()=>setCourseTeachers([]));
    set('teacher_id','');
  },[form.subject_id]);

  const course    = batchCourses.find(s=>String(s.id)===String(form.subject_id));
  const isFYP     = course?.credit_format === '0+3' ||
                    /fyp|final.year.project|fyp-i|fyp-ii|fyp1|fyp2/i.test(
                      (course?.name||'')+' '+(course?.code||'')+' '+(course?.short_name||'')
                    );
  const slotLabel = form.time_slot ? (form.is_lab ? LAB_SLOTS[form.time_slot] : SLOTS.find(s=>s.id===parseInt(form.time_slot))?.full) : null;
  const roomReady = batchDefaultRoom || form.room_id;
  const teacherReady = isFYP || form.teacher_id;
  const canAdd    = formBatch&&roomReady&&form.subject_id&&teacherReady&&form.day&&form.time_slot&&!loading;

  const fl = { fontSize:'10px',fontWeight:'700',color:'#5a7080',textTransform:'uppercase',letterSpacing:'0.5px',display:'block',marginBottom:'5px' };
  const fi = { width:'100%',padding:'8px 10px',border:'1px solid #dde3e8',borderRadius:'6px',fontSize:'12px',fontFamily:'inherit',color:'#1a2e3a',outline:'none',background:'white' };

  return (
    <div style={{ background:'white',borderRadius:'10px',padding:'16px',border:'1px solid #dde3e8',marginBottom:'16px' }}>
      <div style={{ fontSize:'13px',fontWeight:'700',color:'#1a2e3a',marginBottom:'14px' }}>Add New Class</div>

      {/* Batch + Session */}
      <div style={{ display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:'10px',marginBottom:'12px',padding:'12px',background:'#f8fafc',borderRadius:'8px',border:'1px solid #e8edf0' }}>
        <div>
          <label style={fl}>Batch *</label>
          <select value={formBatch||''} onChange={e=>{ setFormBatch(parseInt(e.target.value)||''); setFormSemester(1); }} style={fi}>
            <option value="">-- Select Batch --</option>
            {(batches||[]).map(b=><option key={b.id} value={b.id}>{b.batch_name}</option>)}
          </select>
        </div>
        <div>
          <label style={fl}>Session *</label>
          <select value={formSemester} onChange={e=>setFormSemester(parseInt(e.target.value))} disabled={!formBatch}
            style={{ ...fi,background:!formBatch?'#f0f4f7':'white',color:!formBatch?'#aabbc8':'#1a2e3a' }}>
            <option value={1}>Session 1 (First Semester)</option>
            <option value={2}>Session 2 (Second Semester)</option>
          </select>
        </div>
      </div>

      {/* Course + Teacher */}
      <div style={{ display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:'10px',marginBottom:'10px' }}>
        <div>
          <label style={fl}>Course {formBatch&&batchCourses.length===0&&<span style={{ color:'#d97706',fontWeight:'400',textTransform:'none' }}>(assign subjects first)</span>}</label>
          <select value={form.subject_id} onChange={e=>set('subject_id',e.target.value)} disabled={!formBatch} style={{ ...fi,background:!formBatch?'#f8fafc':'white' }}>
            <option value="">-- Select Course --</option>
            {batchCourses.map(s=><option key={s.id} value={s.id}>{s.name}{s.has_lab?' (Lab)':''}</option>)}
          </select>
        </div>
        <div>
          <label style={fl}>
            Teacher{' '}
            {isFYP
              ? <span style={{ color:'#d97706',fontWeight:'600',textTransform:'none',background:'#fef3c7',border:'1px solid #fde68a',borderRadius:'4px',padding:'1px 6px',fontSize:'9px' }}>Optional for FYP</span>
              : form.subject_id&&courseTeachers.length===0&&<span style={{ color:'#d97706',fontWeight:'400',textTransform:'none' }}>(assign teachers first)</span>
            }
          </label>
          <select value={form.teacher_id} onChange={e=>set('teacher_id',e.target.value)} disabled={!form.subject_id} style={{ ...fi,background:!form.subject_id?'#f8fafc':'white' }}>
            <option value="">{isFYP ? '-- No supervisor (individual groups)' : '-- Select Teacher --'}</option>
            {courseTeachers.map(t=><option key={t.id} value={t.id}>{t.full_name}</option>)}
          </select>
        </div>
      </div>
      {/* Room info — shown as read-only from batch default */}
      {batchDefaultRoom ? (
        <div style={{ background:'#f0fdf4',border:'1px solid #86efac',borderRadius:'7px',padding:'8px 14px',marginBottom:'10px',fontSize:'12px',color:'#166534',display:'flex',alignItems:'center',gap:'7px' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Room: <strong>{(rooms||[]).find(r=>String(r.id)===String(batchDefaultRoom))?.room_id || 'Default'}</strong>
          <span style={{ color:'#4ade80',fontSize:'10px' }}>(batch default — change from edit popup)</span>
        </div>
      ) : formBatch ? (
        <div style={{ background:'#fef3c7',border:'1px solid #fde68a',borderRadius:'7px',padding:'8px 14px',marginBottom:'10px',fontSize:'12px',color:'#92400e',display:'flex',alignItems:'center',gap:'7px' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          No default room set for this batch — go to <strong style={{ marginLeft:'3px' }}>Batch Management → Edit</strong> to assign one.
        </div>
      ) : null}

      {/* Day + Time + Lab + Submit */}
      <div style={{ display:'flex',gap:'10px',alignItems:'flex-end',flexWrap:'wrap' }}>
        <div style={{ flex:'1 1 120px' }}>
          <label style={fl}>Day</label>
          <SearchSelect options={DAYS.map(d=>({ value:d, label:d }))} value={form.day} onChange={v=>set('day',v)} placeholder="Select Day"/>
        </div>
        <div style={{ flex:'1 1 140px' }}>
          <label style={fl}>Time Slot</label>
          <SearchSelect
            options={SLOTS
              .filter(s=> !form.is_lab || VALID_LAB_SLOTS.includes(s.id))
              .map(s=>({ value:s.id, label:form.is_lab?LAB_SLOTS[s.id]:s.full,
                disabled: form.is_lab && !VALID_LAB_SLOTS.includes(s.id) }))}
            value={form.time_slot}
            onChange={v=>{ set('time_slot',v); }}
            placeholder="Select Time"
          />
        </div>
        <label style={{ display:'flex',alignItems:'center',gap:'7px',padding:'8px 12px',background:'#f8fafc',borderRadius:'7px',border:'1px solid #e0e8ed',cursor:'pointer',whiteSpace:'nowrap',height:'36px',boxSizing:'border-box' }}>
          <input type="checkbox" checked={form.is_lab} onChange={e=>{
            const newIsLab = e.target.checked;
            set('is_lab', newIsLab);
            // Clear time slot if it's invalid for a lab
            if(newIsLab && form.time_slot && !VALID_LAB_SLOTS.includes(parseInt(form.time_slot))){
              set('time_slot','');
            }
          }} style={{ width:'14px',height:'14px',accentColor:CELL_GREEN,cursor:'pointer' }}/>
          <span style={{ fontSize:'12px',fontWeight:'600',color:'#1a2e3a',display:'flex',alignItems:'center',gap:'5px' }}>
            <span style={{ background:'#dcfce7',color:'#166534',borderRadius:'4px',padding:'1px 6px',fontSize:'10px',fontWeight:'700' }}>LAB</span>
            3-hour slot
            {course?.has_lab&&<span style={{ color:'#16a34a',fontSize:'10px' }}>✓</span>}
          </span>
        </label>
        {slotLabel&&<span style={{ fontSize:'11px',fontWeight:'600',color:form.is_lab?'#166534':'#2d4a5a',background:form.is_lab?'#dcfce7':'#e8f4fd',border:`1px solid ${form.is_lab?'#86efac':'#b8d9f5'}`,borderRadius:'5px',padding:'4px 10px',whiteSpace:'nowrap' }}>{slotLabel}</span>}
        <button type="button" disabled={!canAdd} onClick={()=>onAdd({...form,batch_id:formBatch,semester:formSemester})}
          style={{ background:CELL_NAVY,color:'white',border:'none',padding:'9px 20px',borderRadius:'7px',fontSize:'12px',fontWeight:'700',cursor:canAdd?'pointer':'not-allowed',fontFamily:'inherit',whiteSpace:'nowrap',opacity:canAdd?1:0.4 }}>
          {loading?'Adding...':'Add Class'}
        </button>
      </div>
    </div>
  );
}

// ── Editable Class Card Popup ─────────────────────────────────────────────
// ── Editable Class Card Popup ─────────────────────────────────────────────
function EditCardPopup({ entry, teachers, rooms, onSave, onDelete, onClose }) {
  const [courseTeachers, setCourseTeachers] = useState([]);
  const [form, setForm] = useState({ teacher_id: entry.teacher_id, room_id: entry.room_id });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  useEffect(()=>{
    api.get('/assignments/course-teachers',{params:{subject_id:entry.subject_id}})
      .then(r=>setCourseTeachers(r.data.length ? r.data : teachers))
      .catch(()=>setCourseTeachers(teachers));
  },[entry.subject_id]);

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:9000,display:'flex',alignItems:'center',justifyContent:'center' }}
      onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:'white',borderRadius:'16px',width:'420px',boxShadow:'0 24px 70px rgba(0,0,0,0.3)',border:'1px solid #e0e8ed',overflow:'hidden' }}>

        {/* Header */}
        <div style={{ background:CELL_NAVY,padding:'18px 20px',position:'relative' }}>
          <button onClick={onClose} style={{ position:'absolute',top:'12px',right:'12px',background:'rgba(255,255,255,0.15)',border:'none',cursor:'pointer',color:'white',borderRadius:'50%',width:'28px',height:'28px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',fontWeight:'700' }}>×</button>
          <div style={{ fontSize:'16px',fontWeight:'800',color:'white',marginBottom:'5px' }}>{entry.subject_name}</div>
          <div style={{ display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap' }}>
            <span style={{ background:'rgba(255,255,255,0.2)',color:'white',fontSize:'10px',fontWeight:'700',padding:'2px 9px',borderRadius:'8px' }}>{entry.is_lab?'Lab Session':'Regular Class'}</span>
            <span style={{ fontSize:'11px',color:'rgba(255,255,255,0.75)' }}>{entry.day}</span>
            <span style={{ fontSize:'11px',color:'rgba(255,255,255,0.5)' }}>·</span>
            <span style={{ fontSize:'11px',color:'rgba(255,255,255,0.75)' }}>{entry.slot_label}</span>
            <span style={{ fontSize:'11px',color:'rgba(255,255,255,0.5)' }}>·</span>
            <span style={{ fontSize:'11px',color:'rgba(255,255,255,0.75)' }}>{entry.room_code}</span>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding:'20px' }}>
          {/* Info */}
          <div style={{ background:'#f8fafc',borderRadius:'8px',padding:'10px 14px',marginBottom:'16px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px',fontSize:'12px',color:'#5a7080' }}>
            <div>Batch: <strong style={{ color:'#1a2e3a' }}>{entry.batch_name||'—'}</strong></div>
            <div>Teacher: <strong style={{ color:'#1a2e3a' }}>{entry.teacher_name}</strong></div>
            <div>Room: <strong style={{ color:'#1a2e3a' }}>{entry.room_code}</strong></div>
            <div>Credits: <strong style={{ color:'#1a2e3a' }}>{entry.credit_hours||'—'}</strong></div>
          </div>

          {/* Teacher */}
          <div style={{ marginBottom:'13px' }}>
            <label style={{ fontSize:'10px',fontWeight:'700',color:'#5a7080',textTransform:'uppercase',letterSpacing:'0.5px',display:'block',marginBottom:'5px' }}>Change Teacher</label>
            <select value={form.teacher_id} onChange={e=>set('teacher_id',parseInt(e.target.value))}
              style={{ width:'100%',padding:'9px 12px',border:'1px solid #dde3e8',borderRadius:'7px',fontSize:'12px',fontFamily:'inherit',color:'#1a2e3a',outline:'none',background:'white',cursor:'pointer' }}>
              {courseTeachers.map(t=>(
                <option key={t.id} value={t.id}>{t.full_name}{t.id===entry.teacher_id?' (current)':''}</option>
              ))}
              {!courseTeachers.find(t=>t.id===entry.teacher_id)&&(
                <option value={entry.teacher_id}>{entry.teacher_name} (current)</option>
              )}
            </select>
          </div>

          {/* Room */}
          <div style={{ marginBottom:'20px' }}>
            <label style={{ fontSize:'10px',fontWeight:'700',color:'#5a7080',textTransform:'uppercase',letterSpacing:'0.5px',display:'block',marginBottom:'5px' }}>Change Room</label>
            <select value={form.room_id} onChange={e=>set('room_id',parseInt(e.target.value))}
              style={{ width:'100%',padding:'9px 12px',border:'1px solid #dde3e8',borderRadius:'7px',fontSize:'12px',fontFamily:'inherit',color:'#1a2e3a',outline:'none',background:'white',cursor:'pointer' }}>
              {rooms.map(r=>(
                <option key={r.id} value={r.id}>{r.room_id} — Cap: {r.capacity} · {r.room_type}{r.id===entry.room_id?' (current)':''}</option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div style={{ display:'flex',gap:'8px' }}>
            <button onClick={()=>onSave(entry.id,form)}
              style={{ flex:1,background:'#2d4a5a',color:'white',border:'none',padding:'11px',borderRadius:'8px',fontSize:'13px',fontWeight:'700',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Save Changes
            </button>
            <button onClick={()=>{ if(window.confirm('Remove this class?')) onDelete(entry.id); }}
              style={{ padding:'11px 16px',background:'#fef2f2',border:'1px solid #fecaca',color:'#dc2626',borderRadius:'8px',fontSize:'12px',fontWeight:'600',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:'5px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



// ── Searchable dropdown ────────────────────────────────────────────────────
function SearchableSelect({ label, value, onChange, options, placeholder='All' }) {
  const [open,  setOpen]  = React.useState(false);
  const [query, setQuery] = React.useState('');
  const ref = React.useRef(null);

  React.useEffect(()=>{
    const close = e=>{ if(ref.current&&!ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return ()=>document.removeEventListener('mousedown', close);
  },[]);

  const filtered = options.filter(o=>o.label.toLowerCase().includes(query.toLowerCase()));
  const selected = options.find(o=>String(o.value)===String(value));

  return (
    <div ref={ref} style={{ position:'relative',minWidth:'140px' }}>
      <div onClick={()=>{ setOpen(o=>!o); setQuery(''); }}
        style={{ padding:'7px 28px 7px 10px',border:`1px solid ${open?'#2d4a5a':'#dde3e8'}`,borderRadius:'7px',fontSize:'12px',
          fontFamily:'inherit',color:selected?'#1a2e3a':'#7a9aaa',background:'white',cursor:'pointer',
          userSelect:'none',position:'relative',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',
          boxShadow:open?'0 0 0 2px rgba(45,74,90,0.15)':'none',transition:'border 0.15s' }}>
        {selected ? selected.label : placeholder}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#7a9aaa" strokeWidth="2.5"
          style={{ position:'absolute',right:'8px',top:'50%',transform:`translateY(-50%) rotate(${open?180:0}deg)`,transition:'transform 0.15s' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
      {open&&(
        <div style={{ position:'absolute',top:'calc(100% + 4px)',left:0,minWidth:'100%',background:'white',
          border:'1px solid #dde3e8',borderRadius:'8px',boxShadow:'0 8px 24px rgba(0,0,0,0.12)',zIndex:9999,overflow:'hidden' }}>
          {/* Search input */}
          <div style={{ padding:'8px',borderBottom:'1px solid #f0f4f7' }}>
            <div style={{ position:'relative' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#aabbc8" strokeWidth="2.5"
                style={{ position:'absolute',left:'8px',top:'50%',transform:'translateY(-50%)',pointerEvents:'none' }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input autoFocus value={query} onChange={e=>setQuery(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}...`}
                style={{ width:'100%',padding:'5px 8px 5px 26px',border:'1px solid #dde3e8',borderRadius:'6px',
                  fontSize:'11px',fontFamily:'inherit',outline:'none',boxSizing:'border-box',color:'#1a2e3a' }}/>
            </div>
          </div>
          {/* Options */}
          <div style={{ maxHeight:'180px',overflowY:'auto' }}>
            <div onClick={()=>{ onChange(''); setOpen(false); }}
              style={{ padding:'8px 12px',fontSize:'12px',cursor:'pointer',color:'#7a9aaa',fontStyle:'italic',
                background:!value?'#f0f6fa':'white' }}
              onMouseEnter={e=>e.currentTarget.style.background='#f0f6fa'}
              onMouseLeave={e=>e.currentTarget.style.background=!value?'#f0f6fa':'white'}>
              {placeholder}
            </div>
            {filtered.length===0&&(
              <div style={{ padding:'10px 12px',fontSize:'11px',color:'#aabbc8',textAlign:'center' }}>No results</div>
            )}
            {filtered.map(o=>(
              <div key={o.value} onClick={()=>{ onChange(o.value); setOpen(false); setQuery(''); }}
                style={{ padding:'8px 12px',fontSize:'12px',cursor:'pointer',fontWeight:String(o.value)===String(value)?'700':'400',
                  color:String(o.value)===String(value)?'#2d4a5a':'#1a2e3a',
                  background:String(o.value)===String(value)?'#e8f4fd':'white' }}
                onMouseEnter={e=>e.currentTarget.style.background='#f0f6fa'}
                onMouseLeave={e=>e.currentTarget.style.background=String(o.value)===String(value)?'#e8f4fd':'white'}>
                {o.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Timetable Grid — Days vertical, Times horizontal ─────────────────────
function TimetableGrid({ entries, canEdit, teachers, rooms, onDrop, onSaveCard, onDelete }) {
  const [dragOver,  setDragOver]  = useState(null);
  const [editEntry, setEditEntry] = useState(null);
  const dragRef = useRef(null);

  // Build grid keyed by [day][slot]
  const grid = {};
  DAYS.forEach(d=>{ grid[d]={}; SLOTS.forEach(s=>{ grid[d][s.id]=[]; }); });
  entries.forEach(e=>{
    const sl=parseInt(e.time_slot);
    const day=e.day?.trim();
    if(day && grid[day] !== undefined) {
      if(grid[day][sl] === undefined) grid[day][sl] = [];
      grid[day][sl].push(e);
    }
  });

  const onDragStart=(e,entry)=>{ dragRef.current=entry; e.dataTransfer.effectAllowed='move'; e.dataTransfer.setData('text/plain',String(entry.id)); };
  const onDragOver =(e,day,slot)=>{ e.preventDefault(); e.stopPropagation(); setDragOver(`${day}-${slot}`); };
  const onDragLeave=(e)=>{ if(!e.currentTarget.contains(e.relatedTarget)) setDragOver(null); };
  const onDropCell =(e,day,slot)=>{ e.preventDefault(); e.stopPropagation(); setDragOver(null); if(dragRef.current&&onDrop) onDrop(dragRef.current,day,slot); dragRef.current=null; };
  const onDragEnd  =()=>{ dragRef.current=null; setDragOver(null); };

  const DAY_W  = 100; // px for day label column
  const ROW_H  = 100; // px per day row

  return (
    <>
      {editEntry&&(
        <EditCardPopup
          entry={editEntry} teachers={teachers} rooms={rooms}
          onSave={async(id,f)=>{ await onSaveCard(id,f); setEditEntry(null); }}
          onDelete={async id=>{ await onDelete(id); setEditEntry(null); }}
          onClose={()=>setEditEntry(null)}
        />
      )}

      <div style={{ borderRadius:'10px',overflow:'hidden',border:'1px solid #dde3e8' }}>
        <div style={{ width:'100%',overflowX:'auto',WebkitOverflowScrolling:'touch' }}>
          <table style={{ width:'100%',borderCollapse:'collapse',tableLayout:'fixed' }}>
            <colgroup>
              <col style={{ width:'100px' }}/>
              {SLOTS.map(s=><col key={s.id} style={{ width:`${100/SLOTS.length}%` }}/>)}
            </colgroup>
            {/* ── Time header ── */}
            <thead>
              <tr>
                <th style={{ background:'#2d4a5a',padding:'12px 8px',textAlign:'center',border:'1px solid rgba(255,255,255,0.1)' }}>
                  <span style={{ fontSize:'10px',fontWeight:'700',color:'rgba(255,255,255,0.7)',textTransform:'uppercase',letterSpacing:'0.5px' }}>Day / Time</span>
                </th>
                {SLOTS.map(slot=>(
                  <th key={slot.id} style={{ background:'#2d4a5a',padding:'12px 8px',textAlign:'center',border:'1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize:'13px',fontWeight:'700',color:'white' }}>{slot.label}</div>
                    <div style={{ fontSize:'10px',color:'rgba(255,255,255,0.5)',marginTop:'2px' }}>to {SLOTS.find(s=>s.id===slot.id+1)?.label||'2:00'}</div>
                  </th>
                ))}
              </tr>
            </thead>
            {/* ── Day rows ── */}
            <tbody>
              {DAYS.map(day=>{
                // Build row cells — skip slots occupied by a lab's colSpan
                const skipSlots = new Set();
                const rowCells = [];
                SLOTS.forEach(slot=>{
                  if(skipSlots.has(slot.id)) return;
                  const cells = grid[day][slot.id]||[];
                  const labEntry = cells.find(e=>e.is_lab);
                  if(labEntry){
                    // Lab spans 3 columns
                    skipSlots.add(slot.id+1);
                    skipSlots.add(slot.id+2);
                    rowCells.push({ slot, cells, colSpan:3, isLab:true });
                  } else {
                    rowCells.push({ slot, cells, colSpan:1, isLab:false });
                  }
                });

                return (
                  <tr key={day} style={{ borderBottom:'1px solid #e8edf0' }}>
                    <td style={{ background:'#f5f8fa',textAlign:'center',verticalAlign:'middle',padding:'8px 4px',height:`${ROW_H}px`,border:'1px solid #e8edf0',fontWeight:'700',fontSize:'12px',color:'#2d4a5a' }}>
                      {day}
                    </td>
                    {rowCells.map(({ slot, cells, colSpan })=>{
                      const key   = `${day}-${slot.id}`;
                      const isOver= dragOver===key;
                      return (
                        <td key={slot.id} colSpan={colSpan}
                          style={{ padding:'5px',verticalAlign:'top',height:`${ROW_H}px`,border:'1px solid #e8edf0',position:'relative',
                            background:isOver?'#e8f4fd':'white',transition:'background 0.1s',
                            boxShadow:isOver?'inset 0 0 0 2px #4a7a93':'none',boxSizing:'border-box' }}
                          onDragOver={canEdit?e=>onDragOver(e,day,slot.id):undefined}
                          onDrop={canEdit?e=>onDropCell(e,day,slot.id):undefined}
                          onDragLeave={canEdit?onDragLeave:undefined}>

                          {isOver&&cells.length===0&&(
                            <div style={{ height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',color:'#4a7a93',fontWeight:'600',gap:'4px' }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12l7 7 7-7"/></svg>Drop
                            </div>
                          )}

                          {cells.map(entry=>(
                            <div key={entry.id}
                              draggable={canEdit}
                              onDragStart={canEdit?e=>onDragStart(e,entry):undefined}
                              onDragEnd={canEdit?onDragEnd:undefined}
                              onClick={canEdit?()=>setEditEntry(entry):undefined}
                              style={{ background:entry._pending?'#b45309':(entry.is_lab?CELL_GREEN:CELL_NAVY),
                                borderRadius:'7px',padding:'6px 10px',color:'white',fontSize:'10px',lineHeight:'1.4',
                                cursor:canEdit?'pointer':'default',position:'absolute',inset:'4px',
                                opacity:entry._pending?0.85:1,
                                outline:entry._pending?'2px dashed rgba(255,255,255,0.6)':'none',
                                userSelect:'none',overflow:'hidden',
                                boxShadow:'0 2px 6px rgba(0,0,0,0.15)' }}>
                              <div style={{ fontWeight:'800',fontSize:'11px',marginBottom:'2px',overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis' }}>
                                {entry.short_name||entry.subject_name}
                                {entry.is_lab&&<span style={{ marginLeft:'6px',background:'rgba(255,255,255,0.2)',borderRadius:'3px',padding:'0 5px',fontSize:'9px',fontWeight:'700' }}>LAB</span>}
                              </div>
                              <div style={{ opacity:0.85,fontSize:'9px',overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis' }}>{entry.teacher_name?.split(' ').slice(0,3).join(' ')}</div>
                              <div style={{ opacity:0.75,fontSize:'9px',marginTop:'1px' }}>{entry.room_code}</div>
                              <div style={{ opacity:0.6,fontSize:'8.5px',marginTop:'1px',fontStyle:'italic' }}>{entry.slot_label}</div>
                              {canEdit&&(
                                <div style={{ position:'absolute',bottom:'3px',right:'3px',background:'rgba(255,255,255,0.18)',borderRadius:'4px',padding:'1px 5px',fontSize:'8px',fontWeight:'600' }}>
                                  click to edit
                                </div>
                              )}
                            </div>
                          ))}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div style={{ padding:'8px 14px',borderTop:'1px solid #e8edf0',background:'#f8fafc',display:'flex',gap:'16px',alignItems:'center' }}>
          <span style={{ fontSize:'10px',color:'#7a9aaa',fontWeight:'600' }}>Legend:</span>
          <div style={{ display:'flex',alignItems:'center',gap:'5px' }}><div style={{ width:'12px',height:'12px',borderRadius:'3px',background:CELL_NAVY }}/><span style={{ fontSize:'10px',color:'#5a7080' }}>Regular (1 hr)</span></div>
          <div style={{ display:'flex',alignItems:'center',gap:'5px' }}><div style={{ width:'12px',height:'12px',borderRadius:'3px',background:CELL_GREEN }}/><span style={{ fontSize:'10px',color:'#5a7080' }}>Lab (3 hrs)</span></div>
          <div style={{ display:'flex',alignItems:'center',gap:'5px' }}><div style={{ width:'12px',height:'12px',borderRadius:'3px',background:'#1e40af',outline:'1.5px dashed rgba(30,64,175,0.5)',outlineOffset:'-1px' }}/><span style={{ fontSize:'10px',color:'#5a7080' }}>Unsaved drag</span></div>
          {canEdit&&<span style={{ fontSize:'10px',color:'#7a9aaa',marginLeft:'auto' }}>Click any class to edit teacher/room · Drag to reschedule</span>}
        </div>
      </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function TimetablePage({ canEdit=false }) {
  const [batches,       setBatches]       = useState([]);
  const [rooms,         setRooms]         = useState([]);
  const [teachers,      setTeachers]      = useState([]);
  const [batchesData,   setBatchesData]   = useState([]); // full batch objects with room info
  const [entries,       setEntries]       = useState([]);
  const [selBatch,      setSelBatch]      = useState(null);
  const [selSemester,   setSelSemester]   = useState(1);
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterRoom,    setFilterRoom]    = useState('');
  const [searchQuery,   setSearchQuery]   = useState('');
  const [conflicts,     setConflicts]     = useState([]);
  const [addLoading,    setAddLoading]    = useState(false);
  const [saveLoading,   setSaveLoading]   = useState(false);
  const [pendingMoves,  setPendingMoves]  = useState([]);
  const [toast,         setToast]         = useState({ msg:'', type:'' });
  const filterBatch = selBatch;

  const showToast=(msg,type='success')=>{ setToast({msg,type}); setTimeout(()=>setToast({msg:'',type:''}),type==='error'?6000:3000); };

  useEffect(()=>{
    api.get('/office/batches').then(r=>{ setBatches(r.data); setBatchesData(r.data); });
    api.get('/office/rooms').then(r=>setRooms(r.data));
    api.get('/office/teachers').then(r=>setTeachers(r.data));
    // Load saved batch room assignments from sessionStorage
  },[]);

  const loadEntries=useCallback(async()=>{
    if(!selBatch) return;
    try{
      // Load all entries for the selected batch — semester shown as info only, not a filter
      const params = { batch_id: selBatch };
      if(selSemester) params.semester = selSemester;
      const r = await api.get('/timetable', { params });
      setEntries(r.data);
      setPendingMoves([]);
    }
    catch(e){ console.error(e); }
  },[selBatch,selSemester]);

  useEffect(()=>{ loadEntries(); },[loadEntries]);

  const selBatchObj=batches.find(b=>b.id===selBatch);

  const displayEntries=entries
    .map(e=>{ const p=pendingMoves.find(m=>m.entry.id===e.id); return p?{...e,day:p.newDay,time_slot:p.newSlot,_pending:true}:e; })
    .filter(e=>{
      if(filterTeacher&&e.teacher_id&&String(e.teacher_id)!==String(filterTeacher)) return false;
      if(filterRoom&&String(e.room_id)!==String(filterRoom)) return false;
      if(searchQuery){
        const q=searchQuery.toLowerCase();
        const matchSubject = (e.subject_name||e.short_name||'').toLowerCase().includes(q);
        const matchTeacher = !(e.teacher_name) || (e.teacher_name||'').toLowerCase().includes(q);
        const matchRoom    = (e.room_code||'').toLowerCase().includes(q);
        const matchDay     = (e.day||'').toLowerCase().includes(q);
        if(!matchSubject&&!matchTeacher&&!matchRoom&&!matchDay) return false;
      }
      return true;
    });

  const handleAdd=async form=>{
    if(!form.batch_id||!form.subject_id||!form.day||!form.time_slot){ showToast('Please fill all fields','error'); return; }
    if(!form.room_id){ showToast('No room assigned. Set a default room for this batch in Batch Management first.','error'); return; }
    setAddLoading(true); setConflicts([]);
    try{
      await api.post('/timetable',form);
      showToast(form.is_lab?'Lab class added':'Class added');
      const newBatch = parseInt(form.batch_id);
      const newSem   = parseInt(form.semester)||1;
      setSelBatch(newBatch);
      setSelSemester(newSem);
      // Reload ALL entries for this batch — let grid show everything
      const r = await api.get('/timetable', { params: { batch_id: newBatch } });
      setEntries(r.data);
      setPendingMoves([]);
    }
    catch(err){ if(err.response?.data?.conflicts) setConflicts(err.response.data.conflicts); else showToast(err.response?.data?.message||'Error','error'); }
    finally{ setAddLoading(false); }
  };

  const handleDrop=async(entry,newDay,newSlot)=>{
    if(entry.day===newDay&&parseInt(entry.time_slot)===parseInt(newSlot)) return;
    setConflicts([]);
    showToast('Checking conflicts...','info');
    try{
      const res=await api.post('/timetable/check-conflicts',{batch_id:entry.batch_id,teacher_id:entry.teacher_id,room_id:entry.room_id,day:newDay,time_slot:newSlot,exclude_id:entry.id});
      if(res.data.hasConflict&&res.data.conflicts?.length){ setConflicts(res.data.conflicts); showToast(`Conflict — move blocked`,'error'); return; }
      setPendingMoves(prev=>[...prev.filter(p=>p.entry.id!==entry.id),{entry,newDay,newSlot}]);
      showToast(`${entry.short_name||entry.subject_name} → ${newDay} · Save to commit`,'info');
    }catch(_){ showToast('Could not check conflicts','error'); }
  };

  // Save teacher/room changes from popup
  const handleSaveCard=async(id,{teacher_id,room_id})=>{
    try{
      const entry=entries.find(e=>e.id===id);
      await api.put(`/timetable/${id}`,{
        batch_id:entry.batch_id, subject_id:entry.subject_id,
        teacher_id, room_id,
        day:entry.day, time_slot:entry.time_slot, is_lab:entry.is_lab,
        semester:selSemester
      });
      showToast('Class updated'); loadEntries();
    }catch(err){ showToast(err.response?.data?.message||'Error saving','error'); }
  };

  const handleSaveChanges=async()=>{
    if(!pendingMoves.length) return;
    setSaveLoading(true); setConflicts([]);
    let saved=0,failed=0;
    for(const{entry,newDay,newSlot}of pendingMoves){
      try{
        await api.put(`/timetable/${entry.id}`,{batch_id:entry.batch_id,subject_id:entry.subject_id,teacher_id:entry.teacher_id,room_id:entry.room_id,day:newDay,time_slot:newSlot,is_lab:entry.is_lab,semester:selSemester});
        saved++;
      }catch(err){ failed++; const e=err.response?.data?.conflicts; if(e?.length) setConflicts(c=>[...c,...e]); }
    }
    setSaveLoading(false); await loadEntries();
    if(failed===0) showToast(`${saved} change${saved!==1?'s':''} saved`);
    else showToast(`${saved} saved, ${failed} failed`,'error');
  };

  const handleDiscard=()=>{ setPendingMoves([]); showToast('Changes discarded','info'); };
  const handleDelete=async id=>{ setPendingMoves(p=>p.filter(m=>m.entry.id!==id)); try{ await api.delete(`/timetable/${id}`); showToast('Class removed'); loadEntries(); }catch{ showToast('Failed to remove','error'); } };

  const toastBg={success:'#16a34a',error:'#dc2626',info:'#2d4a5a'}[toast.type]||'#16a34a';

  return (
    <div className="page-content">
      {/* Toast */}
      {toast.msg&&(
        <div style={{ position:'fixed',top:'20px',right:'20px',background:toastBg,color:'white',padding:toast.type==='error'?'13px 18px':'10px 16px',borderRadius:'9px',fontWeight:'600',fontSize:'13px',boxShadow:'0 6px 20px rgba(0,0,0,0.2)',zIndex:9999,maxWidth:'400px',display:'flex',alignItems:'center',gap:'9px' }}>
          {toast.type==='error'&&<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
          {toast.msg}
        </div>
      )}

      <div className="card">
        <div className="card-body" style={{ padding:0 }}>

          {/* ── Filter Bar ── */}
          <div style={{ padding:'16px 20px',borderBottom:'1px solid #e0e8ed',background:'white' }}>

            {/* Header row */}
            <div style={{ display:'flex',alignItems:'center',gap:'7px',marginBottom:'12px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2d4a5a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
              <span style={{ fontSize:'12px',fontWeight:'700',color:'#1a2e3a' }}>Timetable Filters</span>
              <div style={{ flex:1,height:'1px',background:'#e0e8ed',marginLeft:'4px' }}/>
              {selBatch&&selBatchObj&&(
                <span style={{ fontSize:'11px',color:'#7a9aaa',background:'#f0f4f7',padding:'3px 10px',borderRadius:'10px' }}>
                  {selBatchObj.batch_name}{selSemester ? ` · Session ${selSemester}` : ''} · {entries.length} class{entries.length!==1?'es':''}
                </span>
              )}
            </div>

            {/* Filter dropdowns */}
            <div style={{ display:'flex',gap:'10px',flexWrap:'wrap',alignItems:'flex-end' }}>
              <div style={{ display:'flex',flexDirection:'column',gap:'4px' }}>
                <span style={{ fontSize:'10px',fontWeight:'700',color:'#5a7080',textTransform:'uppercase',letterSpacing:'0.5px' }}>Batch</span>
                <SearchableSelect label="Batch" placeholder="All Batches"
                  value={selBatch||''}
                  onChange={v=>{ if(pendingMoves.length&&!window.confirm('Switch batch? Unsaved changes will be lost.')) return; setSelBatch(parseInt(v)||null); setSelSemester(1); setSearchQuery(''); }}
                  options={batches.map(b=>({ value:b.id, label:b.batch_name }))}/>
              </div>
              <div style={{ display:'flex',flexDirection:'column',gap:'4px' }}>
                <span style={{ fontSize:'10px',fontWeight:'700',color:'#5a7080',textTransform:'uppercase',letterSpacing:'0.5px' }}>Session</span>
                <SearchableSelect label="Session" placeholder="All Sessions"
                  value={selSemester||''}
                  onChange={v=>{ if(pendingMoves.length&&!window.confirm('Switch session? Unsaved changes will be lost.')) return; setSelSemester(v?parseInt(v):null); }}
                  options={[{ value:1, label:'Session 1 (First Semester)' },{ value:2, label:'Session 2 (Second Semester)' }]}/>
              </div>
              <div style={{ display:'flex',flexDirection:'column',gap:'4px' }}>
                <span style={{ fontSize:'10px',fontWeight:'700',color:'#5a7080',textTransform:'uppercase',letterSpacing:'0.5px' }}>Teacher</span>
                <SearchableSelect label="Teacher" placeholder="All Teachers"
                  value={filterTeacher}
                  onChange={v=>setFilterTeacher(v)}
                  options={teachers.map(t=>({ value:t.id, label:t.full_name }))}/>
              </div>
              <div style={{ display:'flex',flexDirection:'column',gap:'4px' }}>
                <span style={{ fontSize:'10px',fontWeight:'700',color:'#5a7080',textTransform:'uppercase',letterSpacing:'0.5px' }}>Room</span>
                <SearchableSelect label="Room" placeholder="All Rooms"
                  value={filterRoom}
                  onChange={v=>setFilterRoom(v)}
                  options={rooms.map(r=>({ value:r.id, label:`${r.room_id} (Cap: ${r.capacity})` }))}/>
              </div>
              {(filterTeacher||filterRoom||searchQuery)&&(
                <div style={{ display:'flex',flexDirection:'column',gap:'4px' }}>
                  <span style={{ fontSize:'10px',color:'transparent' }}>_</span>
                  <button onClick={()=>{ setFilterTeacher(''); setFilterRoom(''); setSearchQuery(''); }}
                    style={{ padding:'7px 14px',border:'1px solid #fca5a5',borderRadius:'7px',fontSize:'11px',fontWeight:'600',cursor:'pointer',background:'#fef2f2',color:'#dc2626',fontFamily:'inherit' }}>
                    Clear All
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Main Content ── */}
          <div style={{ padding:'16px 20px' }}>
            <ConflictAlert conflicts={conflicts} onClose={()=>setConflicts([])}/>

            {canEdit&&(
              <AddClassForm rooms={rooms} selectedBatch={selBatch} semester={selSemester} batches={batches} onAdd={handleAdd} loading={addLoading}/>
            )}

            {displayEntries.length===0?(
              <div className="empty-state">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <h3>No classes scheduled</h3>
                <p>{selBatch?'No classes for this batch and session yet':'Select a batch above to view its timetable'}</p>
              </div>
            ):(
              <TimetableGrid
                entries={displayEntries} canEdit={canEdit}
                teachers={teachers} rooms={rooms}
                onDrop={canEdit?handleDrop:undefined}
                onSaveCard={canEdit?handleSaveCard:undefined}
                onDelete={canEdit?handleDelete:undefined}
              />
            )}

            {/* ── Save Bar ── */}
            {canEdit&&pendingMoves.length>0&&(
              <div style={{ marginTop:'16px',background:'white',border:'1.5px solid #e0e8ed',borderRadius:'10px',overflow:'hidden',boxShadow:'0 2px 8px rgba(0,0,0,0.07)' }}>
                {conflicts.length>0&&(
                  <div style={{ background:'#fef2f2',borderBottom:'1px solid #fecaca',padding:'10px 16px' }}>
                    <div style={{ fontSize:'12px',fontWeight:'700',color:'#dc2626',marginBottom:'5px' }}>Conflict — resolve before saving</div>
                    {conflicts.map((c,i)=><div key={i} style={{ fontSize:'11px',color:'#9b1c1c',marginBottom:'2px' }}>• {c.message}</div>)}
                  </div>
                )}
                <div style={{ padding:'12px 16px',borderBottom:'1px solid #f0f4f7' }}>
                  <div style={{ fontSize:'11px',fontWeight:'700',color:'#5a7080',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'8px' }}>Pending Changes ({pendingMoves.length})</div>
                  {pendingMoves.map((p,i)=>(
                    <div key={i} style={{ display:'flex',alignItems:'center',gap:'8px',fontSize:'12px',marginBottom:'4px' }}>
                      <div style={{ width:'7px',height:'7px',borderRadius:'50%',background:'#f59e0b',flexShrink:0 }}/>
                      <span style={{ fontWeight:'600',color:'#1a2e3a' }}>{p.entry.subject_name}</span>
                      <span style={{ color:'#aabbc8' }}>from</span>
                      <span style={{ color:'#5a7080' }}>{p.entry.day}</span>
                      <span style={{ color:'#aabbc8' }}>→</span>
                      <span style={{ fontWeight:'600',color:CELL_NAVY }}>{p.newDay} · {SLOTS.find(s=>s.id===parseInt(p.newSlot))?.full}</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding:'12px 16px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                  <button onClick={handleDiscard} style={{ padding:'8px 18px',border:'1px solid #dde3e8',borderRadius:'7px',background:'white',color:'#5a7080',fontSize:'12px',fontWeight:'600',cursor:'pointer',fontFamily:'inherit' }}>Discard All</button>
                  <button onClick={handleSaveChanges} disabled={saveLoading||conflicts.length>0}
                    style={{ padding:'9px 24px',border:'none',borderRadius:'7px',background:conflicts.length>0?'#9ca3af':CELL_NAVY,color:'white',fontSize:'13px',fontWeight:'700',cursor:conflicts.length>0||saveLoading?'not-allowed':'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:'8px' }}>
                    {saveLoading?'Saving...':'Save Changes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}