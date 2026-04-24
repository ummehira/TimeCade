// frontend/src/pages/assistant/AssignmentPage.js
import React, { useState, useEffect } from 'react';
import { BookOpen, Users, Plus, Trash2, Calendar, ChevronDown } from 'lucide-react';
import api from '../../utils/api';

const SEMESTERS = [1,2,3,4,5,6,7,8];

const fieldLabel = { fontSize:'11px',fontWeight:'700',color:'#5a7080',textTransform:'uppercase',letterSpacing:'0.5px',display:'block',marginBottom:'5px' };
const fieldInput = { width:'100%',padding:'8px 10px',border:'1px solid #dde3e8',borderRadius:'6px',fontSize:'12px',fontFamily:'inherit',outline:'none',color:'#1a2e3a',background:'white',boxSizing:'border-box' };
const addBtn    = { background:'#2d4a5a',color:'white',border:'none',padding:'8px 16px',borderRadius:'6px',fontSize:'12px',fontWeight:'600',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:'6px' };

// ── Tab button ─────────────────────────────────────────────────────────────
function TabBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding:'10px 20px', border:'none', background:'none', fontFamily:'inherit',
      fontSize:'13px', fontWeight: active?'700':'500', cursor:'pointer',
      color: active?'#1a2e3a':'#5a7080',
      borderBottom: active?'2px solid #2d4a5a':'2px solid transparent',
      marginBottom:'-1px'
    }}>{children}</button>
  );
}

// ── Step 1: Batch-Subject Assignment ──────────────────────────────────────
function BatchSubjectTab() {
  const [batches,    setBatches]    = useState([]);
  const [subjects,   setSubjects]   = useState([]);
  const [selBatch,   setSelBatch]   = useState('');
  const [selSem,     setSelSem]     = useState(1);
  const [assigned,   setAssigned]   = useState([]);
  const [selSubject, setSelSubject] = useState('');
  const [loading,    setLoading]    = useState(false);
  const [msg,        setMsg]        = useState({ text:'', type:'' });

  useEffect(()=>{
    api.get('/office/batches').then(r=>setBatches(r.data));
    api.get('/office/subjects').then(r=>setSubjects(r.data));
  },[]);

  useEffect(()=>{
    if(!selBatch) return;
    api.get('/assignments/batch-subjects',{params:{batch_id:selBatch,semester:selSem}})
      .then(r=>setAssigned(r.data)).catch(()=>{});
  },[selBatch,selSem]);

  const showMsg=(text,type='success')=>{ setMsg({text,type}); setTimeout(()=>setMsg({text:'',type:''}),3000); };

  const handleAdd = async()=>{
    if(!selBatch||!selSubject||!selSem){ showMsg('Select batch, semester and subject','error'); return; }
    setLoading(true);
    try{
      await api.post('/assignments/batch-subjects',{batch_id:selBatch,subject_id:selSubject,semester:selSem});
      setSelSubject('');
      const r=await api.get('/assignments/batch-subjects',{params:{batch_id:selBatch,semester:selSem}});
      setAssigned(r.data);
      showMsg('Subject assigned to batch');
    }catch(err){ showMsg(err.response?.data?.message||'Error','error'); }
    finally{ setLoading(false); }
  };

  const handleRemove = async(id)=>{
    if(!window.confirm('Remove this subject from batch?')) return;
    await api.delete(`/assignments/batch-subjects/${id}`);
    setAssigned(a=>a.filter(x=>x.id!==id));
    showMsg('Removed');
  };

  const selBatchObj = batches.find(b=>String(b.id)===String(selBatch));
  const assignedIds = assigned.map(a=>String(a.subject_id));
  const available   = subjects.filter(s=>!assignedIds.includes(String(s.id)));

  return (
    <div>
      {msg.text&&<div style={{ padding:'9px 14px',borderRadius:'7px',fontSize:'12px',fontWeight:'600',marginBottom:'14px',background:msg.type==='error'?'#fef2f2':'#f0fdf4',color:msg.type==='error'?'#dc2626':'#16a34a',border:`1px solid ${msg.type==='error'?'#fca5a5':'#86efac'}` }}>{msg.text}</div>}

      {/* Selectors */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'16px' }}>
        <div>
          <label style={fieldLabel}>Select Batch</label>
          <select style={fieldInput} value={selBatch} onChange={e=>{ setSelBatch(e.target.value); setAssigned([]); }}>
            <option value="">-- Choose batch --</option>
            {batches.map(b=><option key={b.id} value={b.id}>{b.batch_name}</option>)}
          </select>
        </div>
        <div>
          <label style={fieldLabel}>Semester</label>
          <div style={{ display:'flex',gap:'5px',flexWrap:'wrap',marginTop:'2px' }}>
            {SEMESTERS.map(s=>(
              <button key={s} onClick={()=>setSelSem(s)}
                style={{ width:'34px',height:'34px',borderRadius:'6px',border:'1px solid',fontSize:'12px',fontWeight:'700',cursor:'pointer',fontFamily:'inherit',
                  background:selSem===s?'#2d4a5a':'white',color:selSem===s?'white':'#4a6070',borderColor:selSem===s?'#2d4a5a':'#c8d8e0' }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {selBatch&&(
        <>
          {/* Add subject */}
          <div style={{ background:'#f8fafc',border:'1px solid #e0e8ed',borderRadius:'9px',padding:'14px',marginBottom:'16px' }}>
            <div style={{ fontSize:'12px',fontWeight:'700',color:'#1a2e3a',marginBottom:'10px' }}>
              Assign Subject to {selBatchObj?.batch_name} — Semester {selSem}
            </div>
            <div style={{ display:'flex',gap:'10px',alignItems:'flex-end' }}>
              <div style={{ flex:1 }}>
                <label style={fieldLabel}>Subject</label>
                <select style={fieldInput} value={selSubject} onChange={e=>setSelSubject(e.target.value)}>
                  <option value="">-- Select subject to add --</option>
                  {available.map(s=><option key={s.id} value={s.id}>{s.name}{s.has_lab?' (Lab)':''}</option>)}
                </select>
              </div>
              <button onClick={handleAdd} disabled={loading} style={addBtn}>
                <Plus size={13}/>{loading?'Adding...':'Add Subject'}
              </button>
            </div>
          </div>

          {/* Assigned subjects */}
          <div style={{ fontSize:'12px',fontWeight:'700',color:'#1a2e3a',marginBottom:'10px' }}>
            Assigned Subjects ({assigned.length})
          </div>
          {assigned.length===0?(
            <div style={{ textAlign:'center',padding:'28px',color:'#aabbc8',fontSize:'13px',border:'1px dashed #dde3e8',borderRadius:'8px' }}>
              No subjects assigned yet for Semester {selSem}
            </div>
          ):(
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'10px' }}>
              {assigned.map(a=>(
                <div key={a.id} style={{ background:'white',border:'1px solid #e0e8ed',borderRadius:'9px',padding:'12px 14px',display:'flex',justifyContent:'space-between',alignItems:'flex-start' }}>
                  <div>
                    <div style={{ fontSize:'13px',fontWeight:'700',color:'#1a2e3a',marginBottom:'4px' }}>{a.subject_name}</div>
                    <div style={{ fontSize:'10px',color:'#7a9aaa',display:'flex',gap:'8px' }}>
                      <span>{a.credit_hours} credits</span>
                      {a.has_lab&&<span style={{ background:'#dcfce7',color:'#166534',borderRadius:'4px',padding:'0 5px',fontWeight:'600' }}>Lab</span>}
                    </div>
                    {a.assigned_teachers?.length>0&&(
                      <div style={{ marginTop:'6px',fontSize:'11px',color:'#5a7080' }}>
                        Teachers: {a.assigned_teachers.map(t=>t.full_name).join(', ')}
                      </div>
                    )}
                  </div>
                  <button onClick={()=>handleRemove(a.id)}
                    style={{ background:'#fef2f2',border:'1px solid #fecaca',color:'#dc2626',borderRadius:'6px',padding:'4px 8px',cursor:'pointer',display:'flex',alignItems:'center',gap:'4px',fontSize:'11px',fontWeight:'600',fontFamily:'inherit' }}>
                    <Trash2 size={11}/> Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Step 2: Teacher-Course Assignment ─────────────────────────────────────
function TeacherCourseTab() {
  const [teachers,   setTeachers]   = useState([]);
  const [subjects,   setSubjects]   = useState([]);
  const [selTeacher, setSelTeacher] = useState('');
  const [selSubject, setSelSubject] = useState('');
  const [assigned,   setAssigned]   = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [viewMode,   setViewMode]   = useState('by-teacher'); // 'by-teacher' | 'by-course'
  const [msg,        setMsg]        = useState({ text:'', type:'' });

  useEffect(()=>{
    api.get('/office/teachers').then(r=>setTeachers(r.data));
    api.get('/office/subjects').then(r=>setSubjects(r.data));
    api.get('/assignments/teacher-subjects').then(r=>setAssigned(r.data)).catch(()=>{});
  },[]);

  const showMsg=(text,type='success')=>{ setMsg({text,type}); setTimeout(()=>setMsg({text:'',type:''}),3000); };

  const reload = ()=> api.get('/assignments/teacher-subjects').then(r=>setAssigned(r.data));

  const handleAdd = async()=>{
    if(!selTeacher||!selSubject){ showMsg('Select both teacher and course','error'); return; }
    setLoading(true);
    try{
      await api.post('/assignments/teacher-subjects',{teacher_id:selTeacher,subject_id:selSubject});
      setSelSubject(''); reload(); showMsg('Teacher assigned to course');
    }catch(err){ showMsg(err.response?.data?.message||'Error','error'); }
    finally{ setLoading(false); }
  };

  const handleRemove = async(id)=>{
    if(!window.confirm('Remove this assignment?')) return;
    await api.delete(`/assignments/teacher-subjects/${id}`);
    reload(); showMsg('Removed');
  };

  // Group by teacher or by course
  const grouped = viewMode==='by-teacher'
    ? teachers.map(t=>({ key:t.id, title:t.full_name, sub:t.teacher_id, items:assigned.filter(a=>a.teacher_id===t.id) })).filter(g=>g.items.length>0)
    : subjects.map(s=>({ key:s.id, title:s.name, sub:s.short_name, items:assigned.filter(a=>a.subject_id===s.id) })).filter(g=>g.items.length>0);

  const assignedPairs = assigned.map(a=>`${a.teacher_id}-${a.subject_id}`);

  return (
    <div>
      {msg.text&&<div style={{ padding:'9px 14px',borderRadius:'7px',fontSize:'12px',fontWeight:'600',marginBottom:'14px',background:msg.type==='error'?'#fef2f2':'#f0fdf4',color:msg.type==='error'?'#dc2626':'#16a34a',border:`1px solid ${msg.type==='error'?'#fca5a5':'#86efac'}` }}>{msg.text}</div>}

      {/* Add assignment */}
      <div style={{ background:'#f8fafc',border:'1px solid #e0e8ed',borderRadius:'9px',padding:'14px',marginBottom:'16px' }}>
        <div style={{ fontSize:'12px',fontWeight:'700',color:'#1a2e3a',marginBottom:'10px' }}>Assign Teacher to Course</div>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr auto',gap:'10px',alignItems:'flex-end' }}>
          <div>
            <label style={fieldLabel}>Teacher</label>
            <select style={fieldInput} value={selTeacher} onChange={e=>setSelTeacher(e.target.value)}>
              <option value="">-- Select Teacher --</option>
              {teachers.map(t=><option key={t.id} value={t.id}>{t.full_name}</option>)}
            </select>
          </div>
          <div>
            <label style={fieldLabel}>Course</label>
            <select style={fieldInput} value={selSubject} onChange={e=>setSelSubject(e.target.value)}>
              <option value="">-- Select Course --</option>
              {subjects.filter(s=>!assignedPairs.includes(`${selTeacher}-${s.id}`)).map(s=>(
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <button onClick={handleAdd} disabled={loading} style={addBtn}>
            <Plus size={13}/>{loading?'Assigning...':'Assign'}
          </button>
        </div>
      </div>

      {/* View toggle */}
      <div style={{ display:'flex',gap:'10px',marginBottom:'14px',alignItems:'center' }}>
        <div style={{ fontSize:'12px',fontWeight:'700',color:'#1a2e3a' }}>View by:</div>
        {[['by-teacher','Teacher'],['by-course','Course']].map(([v,l])=>(
          <button key={v} onClick={()=>setViewMode(v)}
            style={{ padding:'5px 14px',borderRadius:'6px',border:'1px solid',fontSize:'11px',fontWeight:'600',cursor:'pointer',fontFamily:'inherit',
              background:viewMode===v?'#2d4a5a':'white',color:viewMode===v?'white':'#4a6070',borderColor:viewMode===v?'#2d4a5a':'#c8d8e0' }}>
            {l}
          </button>
        ))}
        <span style={{ fontSize:'11px',color:'#aabbc8',marginLeft:'auto' }}>{assigned.length} total assignments</span>
      </div>

      {/* Grouped list */}
      {grouped.length===0?(
        <div style={{ textAlign:'center',padding:'28px',color:'#aabbc8',fontSize:'13px',border:'1px dashed #dde3e8',borderRadius:'8px' }}>
          No assignments yet. Assign teachers to courses above.
        </div>
      ):(
        <div style={{ display:'flex',flexDirection:'column',gap:'10px' }}>
          {grouped.map(g=>(
            <div key={g.key} style={{ border:'1px solid #e0e8ed',borderRadius:'9px',overflow:'hidden' }}>
              <div style={{ background:'#f5f8fa',padding:'10px 14px',display:'flex',alignItems:'center',gap:'8px' }}>
                <div style={{ width:'28px',height:'28px',borderRadius:'6px',background:'#2d4a5a',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'11px',fontWeight:'700',flexShrink:0 }}>
                  {g.title[0]}
                </div>
                <div>
                  <div style={{ fontSize:'13px',fontWeight:'700',color:'#1a2e3a' }}>{g.title}</div>
                  <div style={{ fontSize:'10px',color:'#7a9aaa' }}>{g.sub}</div>
                </div>
                <span style={{ marginLeft:'auto',background:'#e8f4fd',color:'#1a5a7a',borderRadius:'10px',padding:'2px 9px',fontSize:'10px',fontWeight:'700' }}>{g.items.length} {viewMode==='by-teacher'?'course':'teacher'}{g.items.length!==1?'s':''}</span>
              </div>
              <div style={{ padding:'8px 14px',display:'flex',flexWrap:'wrap',gap:'6px' }}>
                {g.items.map(item=>(
                  <div key={item.id} style={{ background:'white',border:'1px solid #dde3e8',borderRadius:'7px',padding:'5px 10px',display:'flex',alignItems:'center',gap:'7px',fontSize:'12px' }}>
                    <span style={{ color:'#1a2e3a',fontWeight:'600' }}>{viewMode==='by-teacher'?item.subject_name:item.teacher_name}</span>
                    <button onClick={()=>handleRemove(item.id)}
                      style={{ background:'none',border:'none',cursor:'pointer',color:'#dc2626',padding:'0',display:'flex',alignItems:'center' }}>
                      <Trash2 size={11}/>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Step 3: Session Management ────────────────────────────────────────────
function SessionTab() {
  const [batches,     setBatches]     = useState([]);
  const [sessions,    setSessions]    = useState([]);
  const [selBatch,    setSelBatch]    = useState('');
  const [form,        setForm]        = useState({ semester:1, session_name:'', start_date:'', end_date:'' });
  const [loading,     setLoading]     = useState(false);
  const [msg,         setMsg]         = useState({ text:'', type:'' });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  useEffect(()=>{ api.get('/office/batches').then(r=>setBatches(r.data)); },[]);
  useEffect(()=>{
    if(!selBatch) return;
    api.get('/assignments/sessions',{params:{batch_id:selBatch}}).then(r=>setSessions(r.data)).catch(()=>{});
  },[selBatch]);

  const showMsg=(text,type='success')=>{ setMsg({text,type}); setTimeout(()=>setMsg({text:'',type:''}),3000); };

  const handleAdd = async()=>{
    if(!selBatch||!form.session_name){ showMsg('Select batch and enter session name','error'); return; }
    setLoading(true);
    try{
      await api.post('/assignments/sessions',{batch_id:selBatch,...form});
      const r=await api.get('/assignments/sessions',{params:{batch_id:selBatch}});
      setSessions(r.data);
      setForm({semester:1,session_name:'',start_date:'',end_date:''});
      showMsg('Session saved');
    }catch(err){ showMsg(err.response?.data?.message||'Error','error'); }
    finally{ setLoading(false); }
  };

  const handleDelete = async(id)=>{
    if(!window.confirm('Delete this session?')) return;
    await api.delete(`/assignments/sessions/${id}`);
    setSessions(s=>s.filter(x=>x.id!==id));
  };

  const selBatchObj = batches.find(b=>String(b.id)===String(selBatch));

  return (
    <div>
      {msg.text&&<div style={{ padding:'9px 14px',borderRadius:'7px',fontSize:'12px',fontWeight:'600',marginBottom:'14px',background:msg.type==='error'?'#fef2f2':'#f0fdf4',color:msg.type==='error'?'#dc2626':'#16a34a',border:`1px solid ${msg.type==='error'?'#fca5a5':'#86efac'}` }}>{msg.text}</div>}

      <div style={{ background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:'8px',padding:'10px 14px',marginBottom:'16px',fontSize:'12px',color:'#1e40af' }}>
        A <strong>Session</strong> represents one semester period for a batch. For example, BSCS-2023 has Semester 1 = "Spring 2024" and Semester 2 = "Fall 2024". Each session can have its own timetable.
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'16px' }}>
        <div>
          <label style={fieldLabel}>Batch</label>
          <select style={fieldInput} value={selBatch} onChange={e=>{ setSelBatch(e.target.value); setSessions([]); }}>
            <option value="">-- Choose batch --</option>
            {batches.map(b=><option key={b.id} value={b.id}>{b.batch_name}</option>)}
          </select>
        </div>
      </div>

      {selBatch&&(
        <>
          <div style={{ background:'#f8fafc',border:'1px solid #e0e8ed',borderRadius:'9px',padding:'14px',marginBottom:'16px' }}>
            <div style={{ fontSize:'12px',fontWeight:'700',color:'#1a2e3a',marginBottom:'10px' }}>Add Session for {selBatchObj?.batch_name}</div>
            <div style={{ display:'grid',gridTemplateColumns:'80px 1fr 1fr 1fr auto',gap:'10px',alignItems:'flex-end' }}>
              <div>
                <label style={fieldLabel}>Semester</label>
                <select style={fieldInput} value={form.semester} onChange={e=>set('semester',e.target.value)}>
                  {SEMESTERS.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={fieldLabel}>Session Name</label>
                <input style={fieldInput} value={form.session_name} onChange={e=>set('session_name',e.target.value)} placeholder="e.g. Spring 2024"/>
              </div>
              <div>
                <label style={fieldLabel}>Start Date</label>
                <input type="date" style={fieldInput} value={form.start_date} onChange={e=>set('start_date',e.target.value)}/>
              </div>
              <div>
                <label style={fieldLabel}>End Date</label>
                <input type="date" style={fieldInput} value={form.end_date} onChange={e=>set('end_date',e.target.value)}/>
              </div>
              <button onClick={handleAdd} disabled={loading} style={addBtn}>
                <Plus size={13}/>{loading?'Saving...':'Save'}
              </button>
            </div>
          </div>

          {sessions.length===0?(
            <div style={{ textAlign:'center',padding:'28px',color:'#aabbc8',fontSize:'13px',border:'1px dashed #dde3e8',borderRadius:'8px' }}>
              No sessions defined for this batch yet
            </div>
          ):(
            <table style={{ width:'100%',borderCollapse:'collapse',fontSize:'12px' }}>
              <thead><tr style={{ background:'#2d4a5a',color:'white' }}>
                {['Semester','Session Name','Start Date','End Date','Classes',''].map(h=>(
                  <th key={h} style={{ padding:'9px 14px',textAlign:'left',fontSize:'10px',fontWeight:'700',textTransform:'uppercase',letterSpacing:'0.5px' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {sessions.map(s=>(
                  <tr key={s.id} style={{ borderBottom:'0.5px solid #e8edf0' }}>
                    <td style={{ padding:'10px 14px' }}><span style={{ background:'#e8f4fd',color:'#1a5a7a',borderRadius:'6px',padding:'2px 9px',fontWeight:'700',fontSize:'11px' }}>Sem {s.semester}</span></td>
                    <td style={{ padding:'10px 14px',fontWeight:'600',color:'#1a2e3a' }}>{s.session_name}</td>
                    <td style={{ padding:'10px 14px',color:'#5a7080' }}>{s.start_date?new Date(s.start_date).toLocaleDateString():'—'}</td>
                    <td style={{ padding:'10px 14px',color:'#5a7080' }}>{s.end_date?new Date(s.end_date).toLocaleDateString():'—'}</td>
                    <td style={{ padding:'10px 14px' }}><span style={{ background:'#f0f4f7',color:'#2d4a5a',borderRadius:'6px',padding:'2px 9px',fontSize:'11px',fontWeight:'600' }}>{s.class_count||0}</span></td>
                    <td style={{ padding:'10px 14px' }}>
                      <button onClick={()=>handleDelete(s.id)} style={{ background:'#fef2f2',border:'1px solid #fecaca',color:'#dc2626',borderRadius:'6px',padding:'4px 10px',cursor:'pointer',fontSize:'11px',fontWeight:'600',fontFamily:'inherit',display:'flex',alignItems:'center',gap:'4px' }}>
                        <Trash2 size={11}/> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function AssignmentPage() {
  const [tab, setTab] = useState('batch-subjects');
  const TABS = [
    { id:'batch-subjects',  label:'Step 1 — Batch Subjects' },
    { id:'teacher-courses', label:'Step 2 — Teacher Courses' },
    { id:'sessions',        label:'Step 3 — Sessions' },
  ];
  return (
    <div className="page-content">
      <div className="card">
        <div className="card-header">
          <h2 style={{ display:'flex',alignItems:'center',gap:'8px' }}><BookOpen size={15}/> Assignment Management</h2>
        </div>
        <div style={{ borderBottom:'1px solid #e0e8ed',display:'flex',padding:'0 22px',background:'white' }}>
          {TABS.map(t=><TabBtn key={t.id} active={tab===t.id} onClick={()=>setTab(t.id)}>{t.label}</TabBtn>)}
        </div>
        <div className="card-body">
          {tab==='batch-subjects'  && <BatchSubjectTab/>}
          {tab==='teacher-courses' && <TeacherCourseTab/>}
          {tab==='sessions'        && <SessionTab/>}
        </div>
      </div>
    </div>
  );
}