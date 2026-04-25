// frontend/src/pages/assistant/OfficeMgmtPage.js
import React, { useState, useEffect } from 'react';
import { GraduationCap, Users, BookOpen, Building2, Clock, Plus, Pencil, Check, X, Trash2 } from 'lucide-react';
import api from '../../utils/api';
import { useResponsive } from '../../hooks/useResponsive';

const fl = { fontSize:'10px',fontWeight:'700',textTransform:'uppercase',letterSpacing:'0.5px',color:'#5a7080',display:'block',marginBottom:'5px' };
const fi = { width:'100%',padding:'9px 11px',border:'1px solid #dde3e8',borderRadius:'7px',fontSize:'12px',fontFamily:'inherit',color:'#1a2e3a',outline:'none',background:'white',boxSizing:'border-box' };
const btn = { background:'#2d4a5a',color:'white',border:'none',padding:'9px 20px',borderRadius:'7px',fontSize:'12px',fontWeight:'700',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:'6px' };
const card = { background:'#f8fafc',border:'1px solid #e0e8ed',borderRadius:'10px',padding:'18px 20px',marginBottom:'20px' };
const msg  = ok => ({ padding:'9px 14px',borderRadius:'7px',fontSize:'12px',fontWeight:'600',marginBottom:'14px',background:ok?'#dcfce7':'#fef2f2',color:ok?'#16a34a':'#dc2626',border:`1px solid ${ok?'#86efac':'#fecaca'}`,display:'flex',alignItems:'center',gap:'7px' });

// Reusable checklist for multi-select
function Checklist({ items, selected, onToggle, labelKey='name', emptyText='No items found', maxHeight=160 }) {
  return (
    <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'5px',maxHeight,overflowY:'auto',padding:'2px' }}>
      {items.length===0&&<span style={{ fontSize:'11px',color:'#aabbc8',padding:'6px' }}>{emptyText}</span>}
      {items.map(item=>(
        <label key={item.id}
          style={{ display:'flex',alignItems:'center',gap:'8px',padding:'7px 10px',borderRadius:'7px',
            border:`1px solid ${selected.includes(item.id)?'#2d4a5a':'#dde3e8'}`,
            background:selected.includes(item.id)?'#e8f4fd':'white',
            cursor:'pointer',fontSize:'12px',fontWeight:selected.includes(item.id)?'600':'400',color:'#1a2e3a',transition:'all 0.1s' }}>
          <input type="checkbox" checked={selected.includes(item.id)} onChange={()=>onToggle(item.id)}
            style={{ accentColor:'#2d4a5a',width:'14px',height:'14px',flexShrink:0,cursor:'pointer' }}/>
          <span style={{ flex:1 }}>{item[labelKey]}</span>
          {item.has_lab&&<span style={{ fontSize:'9px',background:'#dcfce7',color:'#166534',borderRadius:'3px',padding:'1px 5px',fontWeight:'700',flexShrink:0 }}>Lab</span>}
        </label>
      ))}
    </div>
  );
}

// Section header inside a form card
function SectionLabel({ children, count }) {
  return (
    <div style={{ display:'flex',alignItems:'center',gap:'8px',marginBottom:'10px' }}>
      <div style={{ fontSize:'11px',fontWeight:'700',color:'#2d4a5a',textTransform:'uppercase',letterSpacing:'0.5px' }}>{children}</div>
      {count>0&&<span style={{ background:'#2d4a5a',color:'white',fontSize:'10px',fontWeight:'700',borderRadius:'10px',padding:'1px 9px' }}>{count} selected</span>}
    </div>
  );
}

export default function OfficeMgmtPage({ tab: propTab }) {
  const [tab, setTab]             = useState(propTab||'batches');
  const [pendingCount,setPending] = useState(0);
  useEffect(()=>{ if(propTab) setTab(propTab); },[propTab]);
  useEffect(()=>{ api.get('/approvals/pending').then(r=>setPending(r.data.length)).catch(()=>{}); },[]);

  const TABS = [
    { id:'batches',    label:'Batch Management',   icon:GraduationCap },
    { id:'teachers',   label:'Teacher Catalogue',  icon:Users },
    { id:'courses',    label:'Course Management',  icon:BookOpen },
    { id:'classrooms', label:'Classroom Status',   icon:Building2 },
    { id:'enrollment', label:'Student Enrollment', icon:Users },
    { id:'approvals',  label:'Pending Approvals',  icon:Clock },
  ];

  return (
    <div className="page-content">
      <div className="card">
        <div className="card-body" style={{ padding:0 }}>
          {/* Tab bar */}
          <div style={{ display:'flex',borderBottom:'1px solid #e0e8ed',padding:'0 20px',background:'white',overflowX:'auto' }}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{
                display:'flex',alignItems:'center',gap:'6px',padding:'13px 16px',border:'none',background:'none',
                fontFamily:'inherit',fontSize:'12.5px',fontWeight:tab===t.id?'700':'500',cursor:'pointer',
                color:tab===t.id?'#1a2e3a':'#5a7080',whiteSpace:'nowrap',
                borderBottom:tab===t.id?'2px solid #2d4a5a':'2px solid transparent',marginBottom:'-1px'
              }}>
                <t.icon size={14}/>
                {t.label}
                {t.id==='approvals'&&pendingCount>0&&<span style={{ background:'#ef4444',color:'white',fontSize:'9px',fontWeight:'700',borderRadius:'10px',padding:'1px 6px' }}>{pendingCount}</span>}
              </button>
            ))}
          </div>
          <div style={{ padding:'20px' }}>
            {tab==='batches'    && <BatchTab/>}
            {tab==='teachers'   && <TeacherTab/>}
            {tab==='courses'    && <CourseTab/>}
            {tab==='classrooms' && <ClassroomTab/>}
            {tab==='enrollment' && <EnrollmentTab/>}
            {tab==='approvals'  && <ApprovalsTab onCountChange={setPending}/>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── BATCH TAB ─────────────────────────────────────────────────────────────
function BatchTab() {
  const { isMobile } = useResponsive();
  const [batches,    setBatches]    = useState([]);
  const [depts,      setDepts]      = useState([]);
  const [subjects,   setSubjects]   = useState([]);
  const [selCourses, setSelCourses] = useState([]);
  const [rooms,      setRooms]      = useState([]);
  const [selRoom,    setSelRoom]    = useState('');
  const [form, setForm] = useState({ batch_name:'',major:'',major_code:'',year:new Date().getFullYear(),student_count:45,department_id:'' });
  const [m, setM] = useState(null);
  // Edit state
  const [editBatch,   setEditBatch]   = useState(null); // batch being edited
  const [editForm,    setEditForm]    = useState({});
  const [editCourses, setEditCourses] = useState([]); // current assigned courses for edit
  const [editSel,     setEditSel]     = useState([]); // selected courses in edit panel
  const MAJORS=[{l:'Computer Science',c:'CS'},{l:'Software Engineering',c:'SE'},{l:'Data Science',c:'DS'}];

  const loadData = () => {
    api.get('/office/batches').then(r=>setBatches(r.data));
    api.get('/office/departments').then(r=>setDepts(r.data));
    api.get('/office/subjects').then(r=>setSubjects(r.data));
    api.get('/office/rooms').then(r=>setRooms(r.data));
  };
  useEffect(()=>{ loadData(); },[]);

  const handleMajor = code => {
    const maj=MAJORS.find(x=>x.c===code); if(!maj) return;
    const dep=depts.find(x=>x.code===code);
    setForm(f=>({...f,major:maj.l,major_code:maj.c,department_id:dep?.id||''}));
    setSelCourses([]);
  };

  const toggle = id => setSelCourses(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);

  const handleSubmit = async e => {
    e.preventDefault();
    if(!form.major_code){ setM({ok:false,text:'Please select a major.'}); return; }
    if(selCourses.length===0){ setM({ok:false,text:'Please assign at least one course to this batch.'}); return; }
    try{
      const r=await api.post('/office/batches',{...form,batch_name:form.batch_name||`BS${form.major_code}-${form.year}`,default_room_id:selRoom||null});
      for(const sid of selCourses){
        try{ await api.post('/assignments/batch-subjects',{batch_id:r.data.id,subject_id:sid,semester:1}); }catch(_){}
      }
      loadData();
      setM({ok:true,text:`Batch added with ${selCourses.length} course(s).`});
      setForm(f=>({...f,batch_name:''})); setSelCourses([]); setSelRoom('');
    }catch(err){ setM({ok:false,text:err.response?.data?.message||'Error'}); }
    setTimeout(()=>setM(null),3500);
  };

  // Open edit panel for a batch
  const openEdit = async b => {
    setEditBatch(b);
    setEditForm({ batch_name:b.batch_name, student_count:b.student_count, room_id:b.default_room_id||'' });
    // Load assigned courses
    try{
      const r=await api.get('/assignments/batch-subjects',{params:{batch_id:b.id}});
      const ids=r.data.map(x=>x.subject_id);
      setEditCourses(r.data);
      setEditSel(ids);
    }catch(_){ setEditCourses([]); setEditSel([]); }
  };

  const handleEditSave = async () => {
    try{
      // Update batch info
      await api.put(`/office/batches/${editBatch.id}`,{
        batch_name: editForm.batch_name||editBatch.batch_name,
        major: editBatch.major, major_code: editBatch.major_code,
        year: editBatch.year, semester: editBatch.semester,
        student_count: editForm.student_count||editBatch.student_count,
        department_id: editBatch.department_id,
        default_room_id: editForm.room_id||null
      });

      // Sync courses — remove deselected, add newly selected
      const current = editCourses.map(c=>c.subject_id);
      const toAdd    = editSel.filter(id=>!current.includes(id));
      const toRemove = editCourses.filter(c=>!editSel.includes(c.subject_id));

      for(const sid of toAdd){
        try{ await api.post('/assignments/batch-subjects',{batch_id:editBatch.id,subject_id:sid,semester:1}); }catch(_){}
      }
      for(const c of toRemove){
        try{ await api.delete(`/assignments/batch-subjects/${c.id}`); }catch(_){}
      }

      loadData();
      setM({ok:true,text:'Batch updated successfully.'});
      setEditBatch(null);
    }catch(err){ setM({ok:false,text:err.response?.data?.message||'Error saving changes.'}); }
    setTimeout(()=>setM(null),3500);
  };

  return (
    <div>
      {m&&<div style={msg(m.ok)}>{m.ok?<Check size={13}/>:<X size={13}/>} {m.text}</div>}

      {/* ── Edit Panel (shown when a batch is selected for editing) ── */}
      {editBatch&&(
        <div style={{ ...card,border:'2px solid #2d4a5a',marginBottom:'20px' }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px' }}>
            <div style={{ fontSize:'14px',fontWeight:'700',color:'#1a2e3a',display:'flex',alignItems:'center',gap:'8px' }}>
              <Pencil size={15}/> Editing: {editBatch.batch_name}
            </div>
            <button onClick={()=>setEditBatch(null)}
              style={{ background:'#f0f4f7',border:'1px solid #dde3e8',color:'#5a7080',borderRadius:'6px',padding:'5px 12px',fontSize:'11px',fontWeight:'600',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:'4px' }}>
              <X size={12}/> Cancel
            </button>
          </div>

          {/* Editable fields */}
          <div style={{ display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:'12px',marginBottom:'16px' }}>
            <div>
              <label style={fl}>Batch Name</label>
              <input style={fi} value={editForm.batch_name} onChange={e=>setEditForm(f=>({...f,batch_name:e.target.value}))}/>
            </div>
            <div>
              <label style={fl}>No. of Students</label>
              <input style={fi} type="number" value={editForm.student_count} onChange={e=>setEditForm(f=>({...f,student_count:parseInt(e.target.value)}))}/>
            </div>
          </div>

          {/* Read-only info */}
          <div style={{ display:'flex',gap:'12px',marginBottom:'16px',flexWrap:'wrap' }}>
            <span style={{ background:'#e8f4fd',color:'#1a5a7a',border:'1px solid #b8d9f5',borderRadius:'8px',padding:'4px 12px',fontSize:'11px',fontWeight:'600' }}>Major: {editBatch.major}</span>
            <span style={{ background:'#f0f4f7',color:'#2d4a5a',border:'1px solid #c8d8e0',borderRadius:'8px',padding:'4px 12px',fontSize:'11px',fontWeight:'600' }}>Year: {editBatch.year}</span>
          </div>

          {/* Room assignment in edit */}
          <div style={{ marginBottom:'16px' }}>
            <label style={fl}>Default Classroom</label>
            <select value={editForm.room_id||''} onChange={e=>setEditForm(f=>({...f,room_id:e.target.value}))} style={fi}>
              <option value="">-- No default room --</option>
              {rooms.map(r=>(
                <option key={r.id} value={r.id}>{r.room_id} — Capacity {r.capacity} · {r.room_type==='lab'?'Lab':'Classroom'}</option>
              ))}
            </select>
          </div>

          {/* Course assignment */}
          <div style={{ border:'2px solid #dde3e8',borderRadius:'9px',padding:'16px',marginBottom:'16px',background:'white' }}>
            <SectionLabel count={editSel.length}>Assigned Courses</SectionLabel>
            <Checklist items={subjects} selected={editSel}
              onToggle={id=>setEditSel(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id])}
              labelKey="name" emptyText="No courses available" maxHeight={200}/>
          </div>

          <div style={{ display:'flex',gap:'10px' }}>
            <button onClick={handleEditSave} style={{ ...btn,background:'#16a34a' }}>
              <Check size={13}/> Save Changes
            </button>
            <button onClick={()=>setEditBatch(null)}
              style={{ padding:'9px 18px',border:'1px solid #dde3e8',borderRadius:'7px',background:'white',color:'#5a7080',fontSize:'12px',fontWeight:'600',cursor:'pointer',fontFamily:'inherit' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Add New Batch ── */}
      {!editBatch&&(
        <div style={card}>
          <div style={{ fontSize:'14px',fontWeight:'700',color:'#1a2e3a',marginBottom:'16px',display:'flex',alignItems:'center',gap:'8px' }}><Plus size={15}/> Add New Batch</div>
          <form onSubmit={handleSubmit}>
            <div style={{ display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr 1fr 1fr 1fr',gap:'12px',marginBottom:'16px' }}>
              <div><label style={fl}>Batch Name</label><input style={fi} placeholder="e.g. BSCS-2025" value={form.batch_name} onChange={e=>setForm(f=>({...f,batch_name:e.target.value}))}/></div>
              <div><label style={fl}>Major *</label>
                <select style={fi} required value={form.major_code} onChange={e=>handleMajor(e.target.value)}>
                  <option value="">Select Major</option>{MAJORS.map(m=><option key={m.c} value={m.c}>{m.l}</option>)}
                </select>
              </div>
              <div><label style={fl}>Year *</label><input style={fi} type="number" min="2022" max="2030" value={form.year} onChange={e=>setForm(f=>({...f,year:parseInt(e.target.value)}))} required/></div>
              <div>
                <label style={fl}>Default Room</label>
                <select value={selRoom} onChange={e=>setSelRoom(e.target.value)} style={fi}>
                  <option value="">-- None --</option>
                  {rooms.map(r=><option key={r.id} value={r.id}>{r.room_id} (Cap: {r.capacity})</option>)}
                </select>
              </div>
              <div><label style={fl}>No. of Students</label><input style={fi} type="number" value={form.student_count} onChange={e=>setForm(f=>({...f,student_count:parseInt(e.target.value)}))}/></div>
            </div>
            <div style={{ border:'2px solid #dde3e8',borderRadius:'9px',padding:'16px',marginBottom:'16px',background:'white' }}>
              <SectionLabel count={selCourses.length}>Assign Courses to this Batch *</SectionLabel>
              {!form.major_code?(
                <div style={{ padding:'16px',textAlign:'center',color:'#aabbc8',fontSize:'12px',border:'1px dashed #e0e8ed',borderRadius:'7px' }}>Select a major first to assign courses</div>
              ):(
                <Checklist items={subjects} selected={selCourses} onToggle={toggle} labelKey="name" emptyText="No courses found"/>
              )}
            </div>
            <button type="submit" style={btn}><Plus size={13}/> Add Batch</button>
          </form>
        </div>
      )}

      {/* ── Existing Batches ── */}
      <div style={{ fontSize:'13px',fontWeight:'700',color:'#1a2e3a',marginBottom:'12px',display:'flex',alignItems:'center',gap:'6px' }}><GraduationCap size={14}/> Existing Batches <span style={{ fontSize:'11px',color:'#7a9aaa',fontWeight:'400' }}>— click Edit to manage courses</span></div>
      <div style={{ borderRadius:'10px',overflow:'hidden',border:'1px solid #e0e8ed' }}>
        <table style={{ width:'100%',borderCollapse:'collapse',fontSize:'12px' }}>
          <thead><tr style={{ background:'#2d4a5a',color:'white' }}>
            {['Batch','Major','Year','Students','Action'].map(h=>(
              <th key={h} style={{ padding:'10px 14px',textAlign:'left',fontSize:'10px',fontWeight:'700',textTransform:'uppercase',letterSpacing:'0.5px' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {batches.map(b=>(
              <tr key={b.id} style={{ borderBottom:'0.5px solid #e8edf0',background:editBatch?.id===b.id?'#f0f6fa':'white' }}>
                <td style={{ padding:'10px 14px',fontWeight:'700',color:'#1a2e3a' }}>{b.batch_name}</td>
                <td style={{ padding:'10px 14px' }}><span style={{ background:'#e8f4fd',color:'#1a5a7a',border:'1px solid #b8d9f5',borderRadius:'10px',padding:'2px 9px',fontSize:'10px',fontWeight:'600' }}>{b.major}</span></td>
                <td style={{ padding:'10px 14px',color:'#5a7080' }}>{b.year}</td>
                <td style={{ padding:'10px 14px',color:'#5a7080' }}>{b.student_count}</td>
                <td style={{ padding:'10px 14px' }}>
                  <button onClick={()=>openEdit(b)}
                    style={{ background:editBatch?.id===b.id?'#2d4a5a':'transparent',color:editBatch?.id===b.id?'white':'#2d4a5a',border:'1px solid #2d4a5a',padding:'5px 14px',borderRadius:'6px',fontSize:'11px',fontWeight:'600',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:'5px' }}>
                    <Pencil size={11}/> {editBatch?.id===b.id?'Editing':'Edit'}
                  </button>
                </td>
              </tr>
            ))}
            {batches.length===0&&<tr><td colSpan="5" style={{ padding:'28px',textAlign:'center',color:'#aabbc8' }}>No batches found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── TEACHER TAB ───────────────────────────────────────────────────────────
function TeacherTab() {
  const { isMobile } = useResponsive();
  const [teachers,   setTeachers]  = useState([]);
  const [depts,      setDepts]     = useState([]);
  const [subjects,   setSubjects]  = useState([]);
  const [selCourses, setSelCourses]= useState([]);
  const [form, setForm] = useState({ teacher_id:'',full_name:'',department_id:'',specialization:'' });
  const [editId, setEditId]   = useState(null);
  const [editForm, setEditForm]= useState({});
  const [m, setM] = useState(null);

  useEffect(()=>{
    api.get('/office/teachers').then(r=>setTeachers(r.data));
    api.get('/office/departments').then(r=>setDepts(r.data));
    api.get('/office/subjects').then(r=>setSubjects(r.data));
  },[]);

  const toggle = id => setSelCourses(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);

  const handleAdd = async e => {
    e.preventDefault();
    if(selCourses.length===0){ setM({ok:false,text:'Please assign at least one course to this teacher.'}); return; }
    try{
      await api.post('/office/teachers',form);
      const tRes=await api.get('/office/teachers');
      const newT=tRes.data.find(t=>t.teacher_id===form.teacher_id);
      if(newT){
        for(const sid of selCourses){
          try{ await api.post('/assignments/teacher-subjects',{teacher_id:newT.id,subject_id:sid}); }catch(_){}
        }
      }
      setTeachers(tRes.data);
      setM({ok:true,text:`Teacher added with ${selCourses.length} course(s).`});
      setForm({teacher_id:'',full_name:'',department_id:'',specialization:''}); setSelCourses([]);
    }catch(err){ setM({ok:false,text:err.response?.data?.message||'Error'}); }
    setTimeout(()=>setM(null),3500);
  };

  const handleEdit = async id => {
    try{ await api.put(`/office/teachers/${id}`,editForm); api.get('/office/teachers').then(r=>setTeachers(r.data)); setEditId(null); }
    catch(e){ alert('Error updating'); }
  };

  return (
    <div>
      <div style={card}>
        <div style={{ fontSize:'14px',fontWeight:'700',color:'#1a2e3a',marginBottom:'16px',display:'flex',alignItems:'center',gap:'8px' }}><Plus size={15}/> Add New Teacher</div>
        {m&&<div style={msg(m.ok)}>{m.ok?<Check size={13}/>:<X size={13}/>} {m.text}</div>}
        <form onSubmit={handleAdd}>
          <div style={{ display:'grid',gridTemplateColumns:isMobile?'1fr 1fr':'1fr 1fr 1fr 1fr',gap:'12px',marginBottom:'16px' }}>
            <div><label style={fl}>Teacher ID *</label><input style={fi} placeholder="e.g. T037" value={form.teacher_id} onChange={e=>setForm(f=>({...f,teacher_id:e.target.value}))} required/></div>
            <div><label style={fl}>Full Name *</label><input style={fi} placeholder="Ms. Jane Doe" value={form.full_name} onChange={e=>setForm(f=>({...f,full_name:e.target.value}))} required/></div>
            <div><label style={fl}>Department *</label>
              <select style={fi} required value={form.department_id} onChange={e=>setForm(f=>({...f,department_id:e.target.value}))}>
                <option value="">Select</option>{depts.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div><label style={fl}>Specialization</label><input style={fi} placeholder="e.g. AI / ML" value={form.specialization} onChange={e=>setForm(f=>({...f,specialization:e.target.value}))}/></div>
          </div>

          {/* Course assignment — required */}
          <div style={{ border:'2px solid #dde3e8',borderRadius:'9px',padding:'16px',marginBottom:'16px',background:'white' }}>
            <SectionLabel count={selCourses.length}>Assign Courses to this Teacher *</SectionLabel>
            <Checklist items={subjects} selected={selCourses} onToggle={toggle} labelKey="name" emptyText="No courses available"/>
          </div>

          <button type="submit" style={btn}><Plus size={13}/> Add Teacher</button>
        </form>
      </div>

      {/* Teacher directory */}
      <div style={{ fontSize:'13px',fontWeight:'700',color:'#1a2e3a',marginBottom:'12px',display:'flex',alignItems:'center',gap:'6px' }}><Users size={14}/> Teacher Directory</div>
      <div style={{ borderRadius:'10px',overflow:'hidden',border:'1px solid #e0e8ed' }}>
        <table style={{ width:'100%',borderCollapse:'collapse',fontSize:'12px' }}>
          <thead><tr style={{ background:'#2d4a5a',color:'white' }}>
            {['ID','Full Name','Department','Courses Teaching','Action'].map(h=>(
              <th key={h} style={{ padding:'10px 14px',textAlign:'left',fontSize:'10px',fontWeight:'700',textTransform:'uppercase',letterSpacing:'0.5px' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {teachers.map(t=>(
              <tr key={t.id} style={{ borderBottom:'0.5px solid #e8edf0' }}>
                {editId===t.id?(
                  <>
                    <td style={{ padding:'8px 14px' }}><strong style={{ fontFamily:'monospace',color:'#2d4a5a' }}>{t.teacher_id}</strong></td>
                    <td style={{ padding:'8px 14px' }}><input style={{...fi,padding:'6px 9px'}} value={editForm.full_name} onChange={e=>setEditForm(f=>({...f,full_name:e.target.value}))}/></td>
                    <td style={{ padding:'8px 14px' }}><select style={{...fi,padding:'6px 9px'}} value={editForm.department_id} onChange={e=>setEditForm(f=>({...f,department_id:e.target.value}))}>{depts.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></td>
                    <td style={{ padding:'8px 14px' }}><input style={{...fi,padding:'6px 9px'}} placeholder="Specialization" value={editForm.specialization||''} onChange={e=>setEditForm(f=>({...f,specialization:e.target.value}))}/></td>
                    <td style={{ padding:'8px 14px' }}>
                      <div style={{ display:'flex',gap:'5px' }}>
                        <button onClick={()=>handleEdit(t.id)} style={{ background:'#16a34a',color:'white',border:'none',padding:'5px 12px',borderRadius:'6px',fontSize:'11px',fontWeight:'600',cursor:'pointer',display:'flex',alignItems:'center',gap:'4px' }}><Check size={11}/> Save</button>
                        <button onClick={()=>setEditId(null)} style={{ background:'#f0f4f7',color:'#5a7080',border:'1px solid #dde3e8',padding:'5px 9px',borderRadius:'6px',fontSize:'11px',cursor:'pointer' }}><X size={11}/></button>
                      </div>
                    </td>
                  </>
                ):(
                  <>
                    <td style={{ padding:'10px 14px' }}><strong style={{ fontFamily:'monospace',color:'#2d4a5a' }}>{t.teacher_id}</strong></td>
                    <td style={{ padding:'10px 14px',fontWeight:'600',color:'#1a2e3a' }}>{t.full_name}</td>
                    <td style={{ padding:'10px 14px' }}><span style={{ background:'#e8f4fd',color:'#1a5a7a',border:'1px solid #b8d9f5',borderRadius:'10px',padding:'2px 9px',fontSize:'10px',fontWeight:'600' }}>{t.department_name}</span></td>
                    <td style={{ padding:'10px 14px' }}>
                      <div style={{ display:'flex',flexWrap:'wrap',gap:'4px' }}>
                        {t.subjects?.slice(0,3).map((s,i)=><span key={i} style={{ background:'#f0f4f7',color:'#2d4a5a',borderRadius:'8px',padding:'2px 8px',fontSize:'10px',fontWeight:'600' }}>{s}</span>)}
                        {t.subjects?.length>3&&<span style={{ background:'#e8f4fd',color:'#1a5a7a',borderRadius:'8px',padding:'2px 8px',fontSize:'10px',fontWeight:'600' }}>+{t.subjects.length-3}</span>}
                        {(!t.subjects||!t.subjects.length)&&<span style={{ fontSize:'11px',color:'#aabbc8' }}>None assigned</span>}
                      </div>
                    </td>
                    <td style={{ padding:'10px 14px' }}>
                      <button onClick={()=>{ setEditId(t.id); setEditForm({full_name:t.full_name,department_id:t.department_id||'',specialization:t.specialization||''}); }}
                        style={{ background:'transparent',border:'1px solid #2d4a5a',color:'#2d4a5a',padding:'5px 12px',borderRadius:'6px',fontSize:'11px',fontWeight:'600',cursor:'pointer',display:'flex',alignItems:'center',gap:'4px' }}>
                        <Pencil size={11}/> Edit
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {teachers.length===0&&<tr><td colSpan="5" style={{ padding:'28px',textAlign:'center',color:'#aabbc8' }}>No teachers found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── COURSE TAB ────────────────────────────────────────────────────────────
function CourseTab() {
  const { isMobile } = useResponsive();
  const [subjects,    setSubjects]  = useState([]);
  const [depts,       setDepts]     = useState([]);
  const [teachers,    setTeachers]  = useState([]);
  const [selTeachers, setSelTeach]  = useState([]);
  const [form, setForm] = useState({ code:'',name:'',short_name:'',credit_hours:3,department_id:'',has_lab:false });
  const [m, setM]       = useState(null);
  // Edit state
  const [editCourse,    setEditCourse]   = useState(null);
  const [editForm,      setEditForm]     = useState({});
  const [editTeachers,  setEditTeachers] = useState([]); // currently assigned teacher-subject rows
  const [editSelT,      setEditSelT]     = useState([]); // selected teacher ids in edit

  const loadData = () => {
    api.get('/office/subjects').then(r=>setSubjects(r.data));
    api.get('/office/departments').then(r=>setDepts(r.data));
    api.get('/office/teachers').then(r=>setTeachers(r.data));
  };
  useEffect(()=>{ loadData(); },[]);

  const toggle = id => setSelTeach(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);

  const handleSubmit = async e => {
    e.preventDefault();
    if(selTeachers.length===0){ setM({ok:false,text:'Please assign at least one teacher to this course.'}); return; }
    try{
      const r=await api.post('/office/subjects',form);
      for(const tid of selTeachers){
        try{ await api.post('/assignments/teacher-subjects',{teacher_id:tid,subject_id:r.data.id}); }catch(_){}
      }
      loadData();
      setM({ok:true,text:`Course added with ${selTeachers.length} teacher(s).`});
      setForm({code:'',name:'',short_name:'',credit_hours:3,department_id:'',has_lab:false}); setSelTeach([]);
    }catch(err){ setM({ok:false,text:err.response?.data?.message||'Error'}); }
    setTimeout(()=>setM(null),3500);
  };

  const openEdit = async s => {
    setEditCourse(s);
    setEditForm({ code:s.code, name:s.name, short_name:s.short_name, credit_hours:s.credit_hours, department_id:s.department_id||'', has_lab:s.has_lab });
    try{
      const r=await api.get('/assignments/teacher-subjects',{params:{subject_id:s.id}});
      setEditTeachers(r.data);
      setEditSelT(r.data.map(x=>x.teacher_id));
    }catch(_){ setEditTeachers([]); setEditSelT([]); }
  };

  const handleEditSave = async () => {
    try{
      await api.put(`/office/subjects/${editCourse.id}`,{ ...editForm, code:editForm.code||editCourse.code });
      // Sync teachers
      const current = editTeachers.map(t=>t.teacher_id);
      const toAdd   = editSelT.filter(id=>!current.includes(id));
      const toRemove= editTeachers.filter(t=>!editSelT.includes(t.teacher_id));
      for(const tid of toAdd){
        try{ await api.post('/assignments/teacher-subjects',{teacher_id:tid,subject_id:editCourse.id}); }catch(_){}
      }
      for(const t of toRemove){
        try{ await api.delete(`/assignments/teacher-subjects/${t.id}`); }catch(_){}
      }
      loadData();
      setM({ok:true,text:'Course updated successfully.'});
      setEditCourse(null);
    }catch(err){ setM({ok:false,text:err.response?.data?.message||'Error saving.'}); }
    setTimeout(()=>setM(null),3500);
  };

  return (
    <div>
      {m&&<div style={msg(m.ok)}>{m.ok?<Check size={13}/>:<X size={13}/>} {m.text}</div>}

      {/* ── Edit Panel ── */}
      {editCourse&&(
        <div style={{ ...card,border:'2px solid #2d4a5a',marginBottom:'20px' }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px' }}>
            <div style={{ fontSize:'14px',fontWeight:'700',color:'#1a2e3a',display:'flex',alignItems:'center',gap:'8px' }}>
              <Pencil size={15}/> Editing: {editCourse.name}
            </div>
            <button onClick={()=>setEditCourse(null)}
              style={{ background:'#f0f4f7',border:'1px solid #dde3e8',color:'#5a7080',borderRadius:'6px',padding:'5px 12px',fontSize:'11px',fontWeight:'600',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:'4px' }}>
              <X size={12}/> Cancel
            </button>
          </div>

          <div style={{ display:'grid',gridTemplateColumns:'1fr 2fr 1fr 1fr 1fr',gap:'12px',marginBottom:'12px' }}>
            <div><label style={fl}>Code</label><input style={fi} value={editForm.code||editCourse.code} onChange={e=>setEditForm(f=>({...f,code:e.target.value}))}/></div>
            <div><label style={fl}>Course Name</label><input style={fi} value={editForm.name} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))}/></div>
            <div><label style={fl}>Short Name</label><input style={fi} value={editForm.short_name} onChange={e=>setEditForm(f=>({...f,short_name:e.target.value}))}/></div>
            <div><label style={fl}>Credit Hours</label><input style={fi} type="number" min="1" max="6" value={editForm.credit_hours} onChange={e=>setEditForm(f=>({...f,credit_hours:parseInt(e.target.value)}))}/></div>
            <div><label style={fl}>Department</label><select style={fi} value={editForm.department_id} onChange={e=>setEditForm(f=>({...f,department_id:e.target.value}))}><option value="">Select</option>{depts.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
          </div>
          <label style={{ display:'flex',alignItems:'center',gap:'8px',fontSize:'12px',color:'#1a2e3a',fontWeight:'500',marginBottom:'16px',cursor:'pointer' }}>
            <input type="checkbox" checked={editForm.has_lab} onChange={e=>setEditForm(f=>({...f,has_lab:e.target.checked}))} style={{ width:'14px',height:'14px',accentColor:'#2d4a5a',cursor:'pointer' }}/>
            This course includes a Lab session (3-hour slot)
          </label>

          <div style={{ border:'2px solid #dde3e8',borderRadius:'9px',padding:'16px',marginBottom:'16px',background:'white' }}>
            <SectionLabel count={editSelT.length}>Assigned Teachers</SectionLabel>
            <Checklist items={teachers} selected={editSelT}
              onToggle={id=>setEditSelT(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id])}
              labelKey="full_name" emptyText="No teachers found" maxHeight={180}/>
          </div>

          <div style={{ display:'flex',gap:'10px' }}>
            <button onClick={handleEditSave} style={{ ...btn,background:'#16a34a' }}><Check size={13}/> Save Changes</button>
            <button onClick={()=>setEditCourse(null)} style={{ padding:'9px 18px',border:'1px solid #dde3e8',borderRadius:'7px',background:'white',color:'#5a7080',fontSize:'12px',fontWeight:'600',cursor:'pointer',fontFamily:'inherit' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── Add New Course ── */}
      {!editCourse&&(
        <div style={card}>
          <div style={{ fontSize:'14px',fontWeight:'700',color:'#1a2e3a',marginBottom:'16px',display:'flex',alignItems:'center',gap:'8px' }}><Plus size={15}/> Add New Course</div>
          <form onSubmit={handleSubmit}>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 2fr 1fr 1fr 1fr',gap:'12px',marginBottom:'12px' }}>
              <div><label style={fl}>Code *</label><input style={fi} placeholder="OOP" value={form.code} onChange={e=>setForm(f=>({...f,code:e.target.value}))} required/></div>
              <div><label style={fl}>Course Name *</label><input style={fi} placeholder="Object Oriented Programming" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required/></div>
              <div><label style={fl}>Short Name</label><input style={fi} placeholder="OOP" value={form.short_name} onChange={e=>setForm(f=>({...f,short_name:e.target.value}))}/></div>
              <div><label style={fl}>Credit Hours</label><input style={fi} type="number" min="1" max="6" value={form.credit_hours} onChange={e=>setForm(f=>({...f,credit_hours:parseInt(e.target.value)}))}/></div>
              <div><label style={fl}>Department</label><select style={fi} value={form.department_id} onChange={e=>setForm(f=>({...f,department_id:e.target.value}))}><option value="">Select</option>{depts.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
            </div>
            <label style={{ display:'flex',alignItems:'center',gap:'8px',fontSize:'12px',color:'#1a2e3a',fontWeight:'500',marginBottom:'16px',cursor:'pointer' }}>
              <input type="checkbox" checked={form.has_lab} onChange={e=>setForm(f=>({...f,has_lab:e.target.checked}))} style={{ width:'14px',height:'14px',accentColor:'#2d4a5a',cursor:'pointer' }}/>
              This course includes a Lab session (3-hour slot)
            </label>
            <div style={{ border:'2px solid #dde3e8',borderRadius:'9px',padding:'16px',marginBottom:'16px',background:'white' }}>
              <SectionLabel count={selTeachers.length}>Assign Teachers to this Course *</SectionLabel>
              <Checklist items={teachers} selected={selTeachers} onToggle={toggle} labelKey="full_name" emptyText="No teachers found"/>
            </div>
            <button type="submit" style={btn}><Plus size={13}/> Add Course</button>
          </form>
        </div>
      )}

      {/* ── Course Directory ── */}
      <div style={{ fontSize:'13px',fontWeight:'700',color:'#1a2e3a',marginBottom:'12px',display:'flex',alignItems:'center',gap:'6px' }}><BookOpen size={14}/> Course Directory <span style={{ fontSize:'11px',color:'#7a9aaa',fontWeight:'400' }}>— click Edit to manage teachers</span></div>
      <div style={{ borderRadius:'10px',overflow:'hidden',border:'1px solid #e0e8ed' }}>
        <table style={{ width:'100%',borderCollapse:'collapse',fontSize:'12px' }}>
          <thead><tr style={{ background:'#2d4a5a',color:'white' }}>
            {['Code','Course Name','Short Name','Credits','Dept','Lab','Action'].map(h=>(
              <th key={h} style={{ padding:'10px 14px',textAlign:'left',fontSize:'10px',fontWeight:'700',textTransform:'uppercase',letterSpacing:'0.5px' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {subjects.map(s=>(
              <tr key={s.id} style={{ borderBottom:'0.5px solid #e8edf0',background:editCourse?.id===s.id?'#f0f6fa':'white' }}>
                <td style={{ padding:'10px 14px' }}><strong style={{ fontFamily:'monospace',color:'#2d4a5a' }}>{s.code}</strong></td>
                <td style={{ padding:'10px 14px',fontWeight:'600',color:'#1a2e3a' }}>{s.name}</td>
                <td style={{ padding:'10px 14px' }}><span style={{ background:'#e8f4fd',color:'#1a5a7a',border:'1px solid #b8d9f5',borderRadius:'10px',padding:'2px 9px',fontSize:'10px',fontWeight:'600' }}>{s.short_name}</span></td>
                <td style={{ padding:'10px 14px',textAlign:'center',color:'#5a7080' }}>{s.credit_hours}</td>
                <td style={{ padding:'10px 14px',color:'#5a7080' }}>{s.department_name||'—'}</td>
                <td style={{ padding:'10px 14px',textAlign:'center' }}>{s.has_lab?<Check size={14} color="#16a34a"/>:<X size={14} color="#aabbc8"/>}</td>
                <td style={{ padding:'10px 14px' }}>
                  <button onClick={()=>openEdit(s)}
                    style={{ background:editCourse?.id===s.id?'#2d4a5a':'transparent',color:editCourse?.id===s.id?'white':'#2d4a5a',border:'1px solid #2d4a5a',padding:'5px 14px',borderRadius:'6px',fontSize:'11px',fontWeight:'600',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:'5px' }}>
                    <Pencil size={11}/> {editCourse?.id===s.id?'Editing':'Edit'}
                  </button>
                </td>
              </tr>
            ))}
            {subjects.length===0&&<tr><td colSpan="7" style={{ padding:'28px',textAlign:'center',color:'#aabbc8' }}>No courses found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── CLASSROOM TAB ─────────────────────────────────────────────────────────
function ClassroomTab() {
  const { isMobile } = useResponsive();
  const [rooms,setRooms]       = useState([]);
  const [form,setForm]         = useState({ room_id:'',room_name:'',capacity:50,room_type:'classroom' });
  const [editId,setEditId]     = useState(null);
  const [editForm,setEditForm] = useState({});
  const [m,setM]               = useState(null);

  useEffect(()=>{ api.get('/office/rooms').then(r=>setRooms(r.data)); },[]);
  const handleAdd = async e=>{ e.preventDefault(); try{ const r=await api.post('/office/rooms',{...form,room_name:form.room_name||form.room_id}); setRooms(rs=>[...rs,r.data]); setM({ok:true,text:'Classroom added.'}); setForm({room_id:'',room_name:'',capacity:50,room_type:'classroom'}); }catch(err){setM({ok:false,text:err.response?.data?.message||'Error'});} setTimeout(()=>setM(null),3000); };
  const handleUpd = async id=>{ try{ const r=await api.put(`/office/rooms/${id}`,editForm); setRooms(rs=>rs.map(x=>x.id===id?r.data:x)); setEditId(null); }catch(e){alert('Error');} };

  return (
    <div>
      <div style={card}>
        <div style={{ fontSize:'14px',fontWeight:'700',color:'#1a2e3a',marginBottom:'16px',display:'flex',alignItems:'center',gap:'8px' }}><Plus size={15}/> Add New Classroom</div>
        {m&&<div style={msg(m.ok)}>{m.ok?<Check size={13}/>:<X size={13}/>} {m.text}</div>}
        <form onSubmit={handleAdd}>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'14px' }}>
            <div><label style={fl}>Room ID *</label><input style={fi} placeholder="C-60" value={form.room_id} onChange={e=>setForm(f=>({...f,room_id:e.target.value}))} required/></div>
            <div><label style={fl}>Room Name</label><input style={fi} placeholder="Room 60" value={form.room_name} onChange={e=>setForm(f=>({...f,room_name:e.target.value}))}/></div>
            <div><label style={fl}>Capacity *</label><input style={fi} type="number" placeholder="60" value={form.capacity} onChange={e=>setForm(f=>({...f,capacity:parseInt(e.target.value)}))} required/></div>
            <div><label style={fl}>Type</label><select style={fi} value={form.room_type} onChange={e=>setForm(f=>({...f,room_type:e.target.value}))}><option value="classroom">Classroom</option><option value="lab">Lab</option><option value="auditorium">Auditorium</option></select></div>
          </div>
          <button type="submit" style={btn}><Plus size={13}/> Add Classroom</button>
        </form>
      </div>

      <div style={{ fontSize:'13px',fontWeight:'700',color:'#1a2e3a',marginBottom:'12px',display:'flex',alignItems:'center',gap:'6px' }}><Building2 size={14}/> Classroom Status</div>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:'12px' }}>
        {rooms.map(r=>(
          <div key={r.id} style={{ background:'white', border:`1.5px solid ${editId===r.id?'#2d4a5a':'#c8d8e0'}`,borderRadius:'10px',padding:'14px',overflow:'hidden',transition:'all 0.15s' }}>
            {editId===r.id?(
              <div>
                <div style={{ fontSize:'13px',fontWeight:'700',color:'#1a2e3a',marginBottom:'12px',display:'flex',alignItems:'center',gap:'6px' }}><Pencil size={12}/> {r.room_id}</div>
                <div style={{ marginBottom:'8px' }}>
                  <label style={fl}>Capacity</label>
                  <input style={fi} type="number" value={editForm.capacity} onChange={e=>setEditForm(f=>({...f,capacity:parseInt(e.target.value)}))}/>
                </div>
                <div style={{ marginBottom:'12px' }}>
                  <label style={fl}>Type</label>
                  <select style={fi} value={editForm.room_type} onChange={e=>setEditForm(f=>({...f,room_type:e.target.value}))}>
                    <option value="classroom">Classroom</option>
                    <option value="lab">Lab</option>
                    <option value="auditorium">Auditorium</option>
                  </select>
                </div>
                <div style={{ display:'flex',gap:'6px' }}>
                  <button onClick={()=>handleUpd(r.id)} style={{ flex:1,background:'#16a34a',color:'white',border:'none',padding:'7px',borderRadius:'6px',fontSize:'11px',fontWeight:'700',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'4px' }}><Check size={11}/> Save</button>
                  <button onClick={()=>setEditId(null)} style={{ background:'#f0f4f7',color:'#5a7080',border:'1px solid #dde3e8',padding:'7px 10px',borderRadius:'6px',fontSize:'11px',cursor:'pointer',display:'flex',alignItems:'center',gap:'3px' }}><X size={11}/></button>
                </div>
              </div>
            ):(
              <>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px' }}>
                  <div style={{ fontSize:'15px',fontWeight:'800',color:'#1a2e3a' }}>{r.room_id}</div>
                  <span style={{ background:r.is_available?'#dcfce7':'#fef2f2',color:r.is_available?'#16a34a':'#dc2626',fontSize:'9px',fontWeight:'700',padding:'2px 8px',borderRadius:'8px' }}>{r.is_available?'Free':'Busy'}</span>
                </div>
                <div style={{ fontSize:'11px',color:'#5a7080',marginBottom:'2px' }}>Capacity: <strong style={{ color:'#1a2e3a' }}>{r.capacity}</strong></div>
                <div style={{ fontSize:'11px',color:'#5a7080',marginBottom:'12px',textTransform:'capitalize' }}>
                  Type: <strong style={{ color:'#1a2e3a' }}>{r.room_type}</strong>
                </div>
                <button onClick={()=>{ setEditId(r.id); setEditForm({capacity:r.capacity,room_type:r.room_type}); }}
                  style={{ width:'100%',background:'#2d4a5a',color:'white',border:'none',padding:'7px',borderRadius:'6px',fontSize:'11px',fontWeight:'700',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'5px' }}>
                  <Pencil size={11}/> Edit
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ENROLLMENT TAB ────────────────────────────────────────────────────────
function EnrollmentTab() {
  const { isMobile } = useResponsive();
  const [batches,  setBatches]  = useState([]);
  const [depts,    setDepts]    = useState([]);
  const [students, setStudents] = useState([]);
  const [filterBatch, setFilterB] = useState('');
  const [subTab,   setSubTab]   = useState('manual');
  const [m,        setM]        = useState(null);
  const [editStu,  setEditStu]  = useState(null); // student being edited
  const [editForm, setEditForm] = useState({});
  const showMsg=(ok,text)=>{ setM({ok,text}); setTimeout(()=>setM(null),5000); };
  useEffect(()=>{
    api.get('/office/batches').then(r=>setBatches(r.data));
    api.get('/office/departments').then(r=>setDepts(r.data));
  },[]);
  // Load students — always fetch fresh from server
  const loadStudents=React.useCallback((bid)=>{
    const batchId = bid !== undefined ? bid : filterBatch;
    const p = batchId ? {batch_id:batchId} : {};
    api.get('/enrollment',{params:p}).then(r=>setStudents(r.data)).catch(()=>{});
  },[filterBatch]);
  useEffect(()=>{ loadStudents(); },[filterBatch]);

  const handleEditSave = async()=>{
    try{
      await api.put(`/enrollment/${editStu.id}`,editForm);
      setEditStu(null); loadStudents();
      showMsg(true,'Student updated.');
    }catch(err){ showMsg(false,err.response?.data?.message||'Error'); }
  };

  return (
    <div>
      {m&&<div style={msg(m.ok)}>{m.ok?<Check size={13}/>:<X size={13}/>} {m.text}</div>}
      <div style={{ display:'flex',gap:'3px',background:'#f0f4f7',borderRadius:'8px',padding:'3px',marginBottom:'18px',width:'fit-content' }}>
        {[['manual','Manual Add'],['bulk','Bulk Upload']].map(([id,label])=>(
          <button key={id} onClick={()=>setSubTab(id)} style={{ padding:'7px 18px',border:'none',borderRadius:'6px',fontFamily:'inherit',fontSize:'12px',fontWeight:subTab===id?'700':'500',cursor:'pointer',background:subTab===id?'white':'transparent',color:subTab===id?'#1a2e3a':'#5a7080',boxShadow:subTab===id?'0 1px 4px rgba(0,0,0,0.08)':'none' }}>{label}</button>
        ))}
      </div>
      {subTab==='manual'&&<div style={card}><div style={{ fontSize:'14px',fontWeight:'700',color:'#1a2e3a',marginBottom:'14px',display:'flex',alignItems:'center',gap:'7px' }}><Plus size={14}/> Add Student</div><EnrollManual batches={batches} depts={depts} onSuccess={()=>{ showMsg(true,'Student enrolled.'); loadStudents(); }} onError={t=>showMsg(false,t)}/></div>}
      {subTab==='bulk'&&<EnrollBulk batches={batches} onSuccess={(r,bid)=>{ showMsg(true,r); loadStudents(bid||''); }} onError={t=>showMsg(false,t)}/>}
      {/* Edit student panel */}
      {editStu&&(
        <div style={{ marginTop:'16px',border:'2px solid #2d4a5a',borderRadius:'10px',padding:'16px',background:'#f8fafc' }}>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px' }}>
            <div style={{ fontSize:'13px',fontWeight:'700',color:'#1a2e3a',display:'flex',alignItems:'center',gap:'7px' }}><Pencil size={14}/> Editing: {editStu.student_id} — {editStu.full_name}</div>
            <button onClick={()=>setEditStu(null)} style={{ background:'#f0f4f7',border:'1px solid #dde3e8',color:'#5a7080',borderRadius:'6px',padding:'4px 10px',fontSize:'11px',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:'4px' }}><X size={11}/> Cancel</button>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:isMobile?'1fr 1fr':'1fr 1fr 1fr 1fr',gap:'10px',marginBottom:'12px' }}>
            <div><label style={fl}>Full Name</label><input style={fi} value={editForm.full_name||''} onChange={e=>setEditForm(f=>({...f,full_name:e.target.value}))}/></div>
            <div><label style={fl}>Email</label><input style={fi} type="email" value={editForm.email||''} onChange={e=>setEditForm(f=>({...f,email:e.target.value}))}/></div>
            <div><label style={fl}>Batch</label><select style={fi} value={editForm.batch_id||''} onChange={e=>setEditForm(f=>({...f,batch_id:e.target.value}))}><option value="">Select</option>{batches.map(b=><option key={b.id} value={b.id}>{b.batch_name}</option>)}</select></div>
            <div><label style={fl}>Department</label><select style={fi} value={editForm.department_id||''} onChange={e=>setEditForm(f=>({...f,department_id:e.target.value}))}><option value="">Select</option>{depts.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
          </div>
          <button onClick={handleEditSave} style={{ ...btn,background:'#16a34a' }}><Check size={13}/> Save Changes</button>
        </div>
      )}

      <div style={{ marginTop:'20px' }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px' }}>
          <div style={{ fontSize:'13px',fontWeight:'700',color:'#1a2e3a',display:'flex',alignItems:'center',gap:'6px' }}>
            <Users size={14}/> Enrolled Students
            <span style={{ fontSize:'11px',color:'#7a9aaa',fontWeight:'400' }}>({students.length} total)</span>
          </div>
          <select value={filterBatch} onChange={e=>setFilterB(e.target.value)} style={{ padding:'6px 10px',border:'1px solid #dde3e8',borderRadius:'6px',fontSize:'12px',fontFamily:'inherit',color:'#1a2e3a',outline:'none' }}>
            <option value="">All Batches</option>{batches.map(b=><option key={b.id} value={b.id}>{b.batch_name}</option>)}
          </select>
        </div>
        <div style={{ borderRadius:'10px',overflow:'hidden',border:'1px solid #e0e8ed' }}>
          <table style={{ width:'100%',borderCollapse:'collapse',fontSize:'12px' }}>
            <thead><tr style={{ background:'#2d4a5a',color:'white' }}>
              {['Student ID','Full Name','Batch','Department','Enrolled On','Action'].map(h=>(
                <th key={h} style={{ padding:'10px 14px',textAlign:'left',fontSize:'10px',fontWeight:'700',textTransform:'uppercase',letterSpacing:'0.5px' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {students.map(s=>(
                <tr key={s.id} style={{ borderBottom:'0.5px solid #e8edf0',background:editStu?.id===s.id?'#f0f6fa':'white' }}>
                  <td style={{ padding:'9px 14px' }}><strong style={{ fontFamily:'monospace',color:'#2d4a5a' }}>{s.student_id}</strong></td>
                  <td style={{ padding:'9px 14px',fontWeight:'600',color:'#1a2e3a' }}>{s.full_name}</td>
                  <td style={{ padding:'9px 14px' }}><span style={{ background:'#e8f4fd',color:'#1a5a7a',border:'1px solid #b8d9f5',borderRadius:'10px',padding:'2px 9px',fontSize:'10px',fontWeight:'600' }}>{s.batch_name||'—'}</span></td>
                  <td style={{ padding:'9px 14px',color:'#5a7080' }}>{s.department_name||'—'}</td>
                  <td style={{ padding:'9px 14px',color:'#8fa5b0',fontSize:'11px' }}>{new Date(s.enrollment_date||s.created_at).toLocaleDateString()}</td>
                  <td style={{ padding:'9px 14px' }}>
                    <button onClick={()=>{ setEditStu(s); setEditForm({full_name:s.full_name,email:s.email||'',batch_id:s.batch_id||'',department_id:s.department_id||''}); }}
                      style={{ background:'transparent',border:'1px solid #2d4a5a',color:'#2d4a5a',padding:'4px 12px',borderRadius:'6px',fontSize:'11px',fontWeight:'600',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:'4px' }}>
                      <Pencil size={11}/> Edit
                    </button>
                  </td>
                </tr>
              ))}
              {students.length===0&&<tr><td colSpan="6" style={{ padding:'28px',textAlign:'center',color:'#aabbc8' }}>No students enrolled yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function EnrollManual({ batches, depts, onSuccess, onError }) {
  const { isMobile } = useResponsive();
  const [form,setForm]=useState({student_id:'',first_name:'',last_name:'',email:'',batch_id:'',department_id:''});
  const [loading,setLoading]=useState(false);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const handleSubmit=async e=>{ e.preventDefault(); if(!form.student_id||!form.first_name||!form.last_name||!form.batch_id){onError('Student ID, First Name, Last Name and Batch are required.');return;} setLoading(true); try{ await api.post('/enrollment',{...form,full_name:`${form.first_name} ${form.last_name}`.trim()}); onSuccess(); setForm({student_id:'',first_name:'',last_name:'',email:'',batch_id:'',department_id:''}); }catch(err){onError(err.response?.data?.message||'Error');} finally{setLoading(false);} };
  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px',marginBottom:'10px' }}>
        <div><label style={fl}>First Name *</label><input style={fi} placeholder="Fatima" value={form.first_name} onChange={e=>set('first_name',e.target.value)} required/></div>
        <div><label style={fl}>Last Name *</label><input style={fi} placeholder="Khan" value={form.last_name} onChange={e=>set('last_name',e.target.value)} required/></div>
        <div><label style={fl}>Student ID *</label><input style={fi} placeholder="STU2025001" value={form.student_id} onChange={e=>set('student_id',e.target.value)} required/></div>
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px',marginBottom:'14px' }}>
        <div><label style={fl}>Email</label><input style={fi} type="email" placeholder="fatima@juw.edu.pk" value={form.email} onChange={e=>set('email',e.target.value)}/></div>
        <div><label style={fl}>Batch *</label><select style={fi} required value={form.batch_id} onChange={e=>set('batch_id',e.target.value)}><option value="">Select Batch</option>{batches.map(b=><option key={b.id} value={b.id}>{b.batch_name}</option>)}</select></div>
        <div><label style={fl}>Department</label><select style={fi} value={form.department_id} onChange={e=>set('department_id',e.target.value)}><option value="">Select</option>{depts.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
      </div>
      <button type="submit" style={btn} disabled={loading}><Plus size={13}/> {loading?'Adding...':'Add Student'}</button>
    </form>
  );
}

function EnrollBulk({ batches, onSuccess, onError }) {
  const { isMobile } = useResponsive();
  const [batchId,setBatchId]=useState('');
  const [file,setFile]=useState(null);
  const [loading,setLoading]=useState(false);
  const [result,setResult]=useState(null);
  const [dragOver,setDragOver]=useState(false);
  const fileRef=React.useRef();
  const handleFile=f=>{ if(!f)return; const ext=f.name.split('.').pop().toLowerCase(); if(!['csv','xlsx','xls'].includes(ext)){onError('Only CSV, XLSX or XLS files.');return;} setFile(f);setResult(null); };
  const downloadTemplate=()=>{ const csv='first_name,last_name,email,student_id,department\nFatima,Khan,fatima@juw.edu.pk,STU2025001,Computer Science\n'; const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a');a.href=url;a.download='students_template.csv';a.click();URL.revokeObjectURL(url); };
  const handleUpload=async()=>{
    if(!file){onError('Select a file.');return;}
    if(!batchId){onError('Select a batch.');return;}
    setLoading(true); setResult(null);
    try{
      const fd=new FormData();
      fd.append('file',file);
      fd.append('batch_id',batchId);
      const res=await api.post('/enrollment/bulk',fd,{headers:{'Content-Type':'multipart/form-data'}});
      setResult(res.data);
      setFile(null);
      if(fileRef.current) fileRef.current.value='';
      onSuccess(`Enrolled ${res.data.enrolled} of ${res.data.total} students.`, batchId);
    }catch(err){
      console.error('Bulk upload error:',err);
      const msg = err.response?.data?.message || 'Upload failed.';
      onError(msg);
    }finally{ setLoading(false); }
  };
  return (
    <div style={card}>
      <div style={{ fontSize:'14px',fontWeight:'700',color:'#1a2e3a',marginBottom:'14px' }}>Bulk Upload (Excel / CSV)</div>
      <div style={{ background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:'8px',padding:'12px 14px',marginBottom:'14px',fontSize:'12px',color:'#1e40af' }}>
        <strong>Required columns:</strong>
        <div style={{ display:'flex',gap:'5px',flexWrap:'wrap',marginTop:'6px' }}>{['first_name','last_name','email','student_id','department'].map(c=><code key={c} style={{ background:'#dbeafe',padding:'2px 7px',borderRadius:'4px',fontSize:'11px' }}>{c}</code>)}</div>
      </div>
      <div style={{ display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:'16px' }}>
        <div>
          <div style={{ marginBottom:'12px' }}><label style={fl}>Select Batch</label><select style={fi} value={batchId} onChange={e=>setBatchId(e.target.value)}><option value="">Select Batch</option>{batches.map(b=><option key={b.id} value={b.id}>{b.batch_name}</option>)}</select></div>
          <div onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onDrop={e=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0]);}} onClick={()=>fileRef.current?.click()}
            style={{ border:`2px dashed ${dragOver?'#2d4a5a':'#c8d8e0'}`,borderRadius:'8px',padding:'20px',textAlign:'center',cursor:'pointer',background:dragOver?'#e8f4fd':'#f8fafc',marginBottom:'12px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8fa5b0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin:'0 auto 8px',display:'block' }}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
            {file?<div><div style={{ fontSize:'12px',fontWeight:'700',color:'#16a34a' }}>{file.name}</div><div style={{ fontSize:'10px',color:'#7a9aaa' }}>{(file.size/1024).toFixed(1)} KB</div></div>:<div><div style={{ fontSize:'12px',fontWeight:'600',color:'#2d4a5a' }}>Drop file or click to browse</div><div style={{ fontSize:'10px',color:'#8fa5b0',marginTop:'3px' }}>.xlsx .xls .csv</div></div>}
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display:'none' }} onChange={e=>handleFile(e.target.files[0])}/>
          </div>
          <div style={{ display:'flex',gap:'8px' }}>
            <button onClick={handleUpload} disabled={!file||!batchId||loading} style={{ ...btn,opacity:(!file||!batchId||loading)?0.4:1,cursor:(!file||!batchId||loading)?'not-allowed':'pointer' }}>Upload & Enroll</button>
            <button onClick={downloadTemplate} style={{ padding:'8px 14px',border:'1px solid #dde3e8',borderRadius:'7px',fontSize:'12px',fontWeight:'600',cursor:'pointer',background:'white',color:'#2d4a5a',fontFamily:'inherit' }}>Template</button>
          </div>
        </div>
        <div style={{ background:'#f8fafc',border:'1px solid #e0e8ed',borderRadius:'8px',padding:'14px' }}>
          {result?(
            <div>
              <div style={{ fontSize:'12px',fontWeight:'700',color:'#1a2e3a',marginBottom:'10px' }}>Upload Result</div>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px' }}>
                {[['Total',result.total,'#2d4a5a'],['Enrolled',result.enrolled,'#16a34a'],['Skipped',result.skipped,'#d97706']].map(([l,v,c])=>(
                  <div key={l} style={{ background:'white',borderRadius:'7px',padding:'10px',textAlign:'center',border:'1px solid #e0e8ed' }}>
                    <div style={{ fontSize:'22px',fontWeight:'800',color:c }}>{v}</div>
                    <div style={{ fontSize:'9px',color:'#7a9aaa',fontWeight:'600',textTransform:'uppercase' }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          ):(
            <div style={{ textAlign:'center',padding:'20px',color:'#aabbc8' }}>
              <div style={{ fontSize:'12px',fontWeight:'600',marginBottom:'6px' }}>Upload a file to see results</div>
              <div style={{ fontSize:'11px' }}>Default password = student ID (lowercase)</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── APPROVALS TAB ─────────────────────────────────────────────────────────
function SummaryItem({ label, value }) {
  return <div><div style={{ fontSize:'10px',color:'#7a9aaa',fontWeight:'600',textTransform:'capitalize',marginBottom:'2px' }}>{label}</div><div style={{ fontSize:'13px',fontWeight:'600',color:'#1a2e3a' }}>{value}</div></div>;
}

function ApprovalsTab({ onCountChange }) {
  const { isMobile } = useResponsive();
  const [requests,setRequests]=useState([]);
  const [loading,setLoading]=useState(true);
  const [reviewing,setReviewing]=useState(null);
  const [note,setNote]=useState('');

  const load=()=>{ setLoading(true); api.get('/approvals').then(r=>{ setRequests(r.data); onCountChange?.(r.data.filter(x=>x.status==='pending').length); }).finally(()=>setLoading(false)); };
  useEffect(()=>{ load(); },[]);
  const approve=async id=>{ await api.post(`/approvals/${id}/approve`,{review_note:note||'Approved'}); setReviewing(null);setNote('');load(); };
  const reject=async id=>{ if(!note.trim()){alert('Please provide a rejection reason.');return;} await api.post(`/approvals/${id}/reject`,{review_note:note}); setReviewing(null);setNote('');load(); };

  const pending=requests.filter(r=>r.status==='pending');

  const renderSummary=req=>{
    const d=req.request_data||{};
    const type=req.request_type;
    const isTeacher=req.requested_by_juw?.startsWith('T');
    const who=isTeacher?`${req.requested_by_name||'Teacher'}`:'Office Assistant';
    const grid={ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:'10px' };

    if(type==='update') return (
      <div>
        <div style={{ fontSize:'13px',fontWeight:'700',color:'#1a2e3a',marginBottom:'10px' }}>{who} wants to reschedule a class</div>
        {d.teacher_reason&&<div style={{ background:'#fef3c7',border:'1px solid #fde68a',borderRadius:'7px',padding:'8px 12px',marginBottom:'10px',fontSize:'12px',color:'#92400e' }}><strong>Reason:</strong> {d.teacher_reason}</div>}
        <div style={{ fontSize:'10px',fontWeight:'700',color:'#dc2626',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'5px' }}>From</div>
        <div style={{ ...grid,background:'#fef2f2',border:'1px solid #fecaca',borderRadius:'8px',padding:'10px',marginBottom:'10px' }}>
          <SummaryItem label="Subject" value={d.old_subject_name||d.subject_name||'—'}/><SummaryItem label="Day" value={d.old_day||'—'}/><SummaryItem label="Time" value={d.old_slot_label||'—'}/><SummaryItem label="Room" value={d.old_room_code||'—'}/>
        </div>
        <div style={{ fontSize:'10px',fontWeight:'700',color:'#16a34a',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'5px' }}>To</div>
        <div style={{ ...grid,background:'#f0fdf4',border:'1px solid #86efac',borderRadius:'8px',padding:'10px' }}>
          <SummaryItem label="Subject" value={d.subject_name||'—'}/><SummaryItem label="Day" value={d.day||'—'}/><SummaryItem label="Time" value={d.slot_label||'—'}/><SummaryItem label="Room" value={d.room_code||'—'}/>
        </div>
      </div>
    );
    if(type==='create') return (
      <div>
        <div style={{ fontSize:'13px',fontWeight:'700',color:'#1a2e3a',marginBottom:'10px' }}>{who} wants to add a new class</div>
        <div style={{ ...grid,background:'#f0fdf4',border:'1px solid #86efac',borderRadius:'8px',padding:'10px' }}>
          <SummaryItem label="Subject" value={d.subject_name||'—'}/><SummaryItem label="Teacher" value={d.teacher_name||'—'}/><SummaryItem label="Batch" value={d.batch_name||'—'}/><SummaryItem label="Room" value={d.room_code||'—'}/><SummaryItem label="Day" value={d.day||'—'}/><SummaryItem label="Time" value={d.slot_label||'—'}/>
        </div>
      </div>
    );
    if(type==='delete') return (
      <div>
        <div style={{ fontSize:'13px',fontWeight:'700',color:'#1a2e3a',marginBottom:'10px' }}>{who} wants to remove a class</div>
        <div style={{ ...grid,background:'#fef2f2',border:'1px solid #fecaca',borderRadius:'8px',padding:'10px' }}>
          <SummaryItem label="Subject" value={d.subject_name||'—'}/><SummaryItem label="Teacher" value={d.teacher_name||'—'}/><SummaryItem label="Batch" value={d.batch_name||'—'}/><SummaryItem label="Room" value={d.room_code||'—'}/><SummaryItem label="Day" value={d.day||'—'}/><SummaryItem label="Time" value={d.slot_label||'—'}/>
        </div>
      </div>
    );
    return <div style={{ fontSize:'12px',color:'#5a7080' }}>Request details unavailable.</div>;
  };

  const typeColor=t=>({create:'#16a34a',update:'#d97706',delete:'#dc2626'}[t]||'#5a7080');
  const typeLabel=t=>({create:'Add Class',update:'Reschedule',delete:'Remove Class'}[t]||t);

  return (
    <div>
      <div style={{ fontSize:'13px',fontWeight:'700',color:'#1a2e3a',marginBottom:'16px' }}>Pending Requests ({pending.length})</div>
      {loading?<div style={{ textAlign:'center',padding:'32px' }}><div className="spinner" style={{ margin:'0 auto' }}></div></div>:
       pending.length===0?<div className="empty-state"><Check size={36}/><h3>All caught up</h3><p>No pending approval requests.</p></div>:
       pending.map(req=>(
        <div key={req.id} style={{ background:'white',border:'1px solid #e0e8ed',borderRadius:'12px',marginBottom:'14px',overflow:'hidden' }}>
          <div style={{ background:'#f8fafc',borderBottom:'1px solid #e0e8ed',padding:'11px 16px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
            <div style={{ display:'flex',alignItems:'center',gap:'8px' }}>
              <span style={{ background:typeColor(req.request_type)+'20',color:typeColor(req.request_type),border:`1px solid ${typeColor(req.request_type)}50`,fontSize:'10px',fontWeight:'700',padding:'3px 10px',borderRadius:'10px' }}>{typeLabel(req.request_type)}</span>
              <span style={{ background:'#fef3c7',color:'#d97706',border:'1px solid #fde68a',fontSize:'10px',fontWeight:'700',padding:'3px 10px',borderRadius:'10px' }}>Pending</span>
            </div>
            <div style={{ fontSize:'11px',color:'#8fa5b0' }}>{new Date(req.created_at).toLocaleString()}</div>
          </div>
          <div style={{ padding:'14px 16px' }}>
            <div style={{ fontSize:'12px',color:'#5a7080',marginBottom:'12px',display:'flex',alignItems:'center',gap:'6px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5a7080" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Requested by: <strong style={{ color:'#1a2e3a' }}>{req.requested_by_name}</strong>
              <span style={{ fontFamily:'monospace',fontSize:'11px',color:'#4a7a93' }}>({req.requested_by_juw})</span>
            </div>
            <div style={{ background:'#f8fafc',border:'1px solid #e0e8ed',borderRadius:'8px',padding:'14px',marginBottom:'14px' }}>{renderSummary(req)}</div>
            {reviewing===req.id?(
              <div style={{ background:'#f8fafc',border:'1px solid #e0e8ed',borderRadius:'8px',padding:'12px' }}>
                <div style={{ fontSize:'11px',fontWeight:'700',color:'#5a7080',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'7px' }}>Review Note</div>
                <textarea placeholder="Add a note (required for rejection)..." value={note} onChange={e=>setNote(e.target.value)}
                  style={{ width:'100%',padding:'8px 10px',border:'1px solid #dde3e8',borderRadius:'6px',fontSize:'12px',fontFamily:'inherit',resize:'vertical',minHeight:'56px',marginBottom:'10px',outline:'none',boxSizing:'border-box' }}/>
                <div style={{ display:'flex',gap:'8px' }}>
                  <button onClick={()=>approve(req.id)} style={{ flex:1,background:'#16a34a',color:'white',border:'none',padding:'9px',borderRadius:'7px',fontSize:'12px',fontWeight:'700',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px' }}><Check size={13}/> Approve</button>
                  <button onClick={()=>reject(req.id)} style={{ flex:1,background:'#ef4444',color:'white',border:'none',padding:'9px',borderRadius:'7px',fontSize:'12px',fontWeight:'700',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px' }}><X size={13}/> Reject</button>
                  <button onClick={()=>{ setReviewing(null);setNote(''); }} style={{ background:'white',color:'#5a7080',border:'1px solid #dde3e8',padding:'9px 14px',borderRadius:'7px',fontSize:'12px',cursor:'pointer',fontFamily:'inherit' }}>Cancel</button>
                </div>
              </div>
            ):(
              <button onClick={()=>setReviewing(req.id)} style={{ background:'#2d4a5a',color:'white',border:'none',padding:'9px 22px',borderRadius:'7px',fontSize:'12px',fontWeight:'700',cursor:'pointer',fontFamily:'inherit' }}>Review Request</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}