// frontend/src/pages/assistant/OfficeMgmtPage.js
import React, { useState, useEffect } from 'react';
import { GraduationCap, Users, BookOpen, Building2, Clock, Plus, Pencil, Check, X, Trash2, Search } from 'lucide-react';
import api from '../../utils/api';
import { useResponsive } from '../../hooks/useResponsive';

const fl = { fontSize:'10px',fontWeight:'700',textTransform:'uppercase',letterSpacing:'0.5px',color:'#5a7080',display:'block',marginBottom:'5px' };
const fi = { width:'100%',padding:'9px 11px',border:'1px solid #dde3e8',borderRadius:'7px',fontSize:'12px',fontFamily:'inherit',color:'#1a2e3a',outline:'none',background:'white',boxSizing:'border-box' };
const btn = { background:'#2d4a5a',color:'white',border:'none',padding:'9px 20px',borderRadius:'7px',fontSize:'12px',fontWeight:'700',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:'6px' };
const card = { background:'#f8fafc',border:'1px solid #e0e8ed',borderRadius:'10px',padding:'18px 20px',marginBottom:'20px' };
const msg  = ok => ({ padding:'9px 14px',borderRadius:'7px',fontSize:'12px',fontWeight:'600',marginBottom:'14px',background:ok?'#dcfce7':'#fef2f2',color:ok?'#16a34a':'#dc2626',border:`1px solid ${ok?'#86efac':'#fecaca'}`,display:'flex',alignItems:'center',gap:'7px' });

function SearchBar({ value, onChange, placeholder='Search...' }) {
  return (
    <div style={{ position:'relative',marginBottom:'14px' }}>
      <Search size={13} style={{ position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',color:'#aabbc8',pointerEvents:'none' }}/>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{ ...fi,paddingLeft:'30px',paddingTop:'7px',paddingBottom:'7px' }}/>
      {value&&<button onClick={()=>onChange('')} style={{ position:'absolute',right:'8px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#aabbc8',display:'flex',padding:0 }}>
        <X size={13}/>
      </button>}
    </div>
  );
}

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

function SectionLabel({ children, count }) {
  return (
    <div style={{ display:'flex',alignItems:'center',gap:'8px',marginBottom:'10px' }}>
      <div style={{ fontSize:'11px',fontWeight:'700',color:'#2d4a5a',textTransform:'uppercase',letterSpacing:'0.5px' }}>{children}</div>
      {count>0&&<span style={{ background:'#2d4a5a',color:'white',fontSize:'10px',fontWeight:'700',borderRadius:'10px',padding:'1px 9px' }}>{count} selected</span>}
    </div>
  );
}

export default function OfficeMgmtPage({ tab: propTab }) {
  const { isMobile } = useResponsive();
  const [tab, setTab]             = useState(propTab||'batches');
  const [pendingCount,setPending] = useState(0);
  useEffect(()=>{ if(propTab) setTab(propTab); },[propTab]);
  useEffect(()=>{ api.get('/approvals/pending').then(r=>setPending(r.data.length)).catch(()=>{}); },[]);

  const TABS = [
    { id:'batches',    label:'Batch Management',   icon:GraduationCap },
    { id:'teachers',   label:'Teacher Management',  icon:Users },
    { id:'courses',    label:'Course Management',  icon:BookOpen },
    { id:'classrooms', label:'Classroom Status',   icon:Building2 },
    { id:'enrollment', label:'Student Enrollment', icon:Users },
    { id:'approvals',  label:'Pending Approvals',  icon:Clock },
  ];

  return (
    <div className="page-content">
      <div className="card">
        <div className="card-body" style={{ padding:0 }}>
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
  const [search, setSearch] = useState('');
  const [editBatch,   setEditBatch]   = useState(null);
  const [editForm,    setEditForm]    = useState({});
  const [editCourses, setEditCourses] = useState([]);
  const [editSel,     setEditSel]     = useState([]);
  const [batchCourses,setBatchCourses]= useState({});
  const [viewBatch,   setViewBatch]   = useState(null); // batch whose detail panel is open
  const MAJORS=[{l:'Computer Science',c:'CS'},{l:'Software Engineering',c:'SE'},{l:'Data Science',c:'DS'}];

  const loadData = () => {
    api.get('/office/batches').then(r=>{
      setBatches(r.data);
      r.data.forEach(b=>{
        api.get('/assignments/batch-subjects',{params:{batch_id:b.id}})
          .then(res=>setBatchCourses(prev=>({...prev,[b.id]:res.data})))
          .catch(()=>setBatchCourses(prev=>({...prev,[b.id]:[]})));
      });
    });
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
    // Load only courses belonging to the selected major
    if(code){
      api.get('/office/subjects',{params:{major_code:code}}).then(r=>setSubjects(r.data)).catch(()=>{});
    } else {
      api.get('/office/subjects').then(r=>setSubjects(r.data)).catch(()=>{});
    }
  };

  const toggle = id => setSelCourses(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);

  const handleSubmit = async e => {
    e.preventDefault();
    if(!form.major_code){ setM({ok:false,text:'Please select a major.'}); return; }
    // Duplicate check
    const batchName = form.batch_name || `BS${form.major_code}-${form.year}`;
    const duplicate = batches.find(b=>b.batch_name.trim().toLowerCase()===batchName.trim().toLowerCase());
    if(duplicate){ setM({ok:false,text:`A batch named "${batchName}" already exists.`}); setTimeout(()=>setM(null),4000); return; }
    try{
      const r=await api.post('/office/batches',{...form,batch_name:batchName,default_room_id:selRoom||null});
      for(const sid of selCourses){
        try{ await api.post('/assignments/batch-subjects',{batch_id:r.data.id,subject_id:sid,semester:1}); }catch(_){}
      }
      loadData();
      setM({ok:true,text:selCourses.length>0?`Batch added with ${selCourses.length} course(s).`:'Batch added successfully.'});
      setForm(f=>({...f,batch_name:''})); setSelCourses([]); setSelRoom('');
    }catch(err){
      const msg = err.response?.data?.message||'';
      if(msg.toLowerCase().includes('duplicate')||msg.toLowerCase().includes('exists')||err.response?.status===409){
        setM({ok:false,text:'A batch with these details already exists.'});
      } else {
        setM({ok:false,text:msg||'Error adding batch.'});
      }
    }
    setTimeout(()=>setM(null),4000);
  };

  const openEdit = async b => {
    setViewBatch(null);
    setEditBatch(b);
    setEditForm({ batch_name:b.batch_name, student_count:b.student_count, room_id:b.default_room_id||'' });
    try{
      const r=await api.get('/assignments/batch-subjects',{params:{batch_id:b.id}});
      setEditCourses(r.data);
      setEditSel(r.data.map(x=>x.subject_id));
    }catch(_){ setEditCourses([]); setEditSel([]); }
  };

  const handleEditSave = async () => {
    // Duplicate check (exclude current batch)
    const newName = editForm.batch_name||editBatch.batch_name;
    const dup = batches.find(b=>b.id!==editBatch.id&&b.batch_name.trim().toLowerCase()===newName.trim().toLowerCase());
    if(dup){ setM({ok:false,text:`A batch named "${newName}" already exists.`}); setTimeout(()=>setM(null),4000); return; }
    try{
      await api.put(`/office/batches/${editBatch.id}`,{
        batch_name: newName,
        major: editBatch.major, major_code: editBatch.major_code,
        year: editBatch.year, semester: editBatch.semester,
        student_count: editForm.student_count||editBatch.student_count,
        department_id: editBatch.department_id,
        default_room_id: editForm.room_id||null
      });
      const current = editCourses.map(c=>c.subject_id);
      const toAdd    = editSel.filter(id=>!current.includes(id));
      const toRemove = editCourses.filter(c=>!editSel.includes(c.subject_id));
      for(const sid of toAdd){ try{ await api.post('/assignments/batch-subjects',{batch_id:editBatch.id,subject_id:sid,semester:1}); }catch(_){} }
      for(const c of toRemove){ try{ await api.delete(`/assignments/batch-subjects/${c.id}`); }catch(_){} }
      loadData();
      setM({ok:true,text:'Batch updated successfully.'});
      setEditBatch(null);
    }catch(err){ setM({ok:false,text:err.response?.data?.message||'Error saving changes.'}); }
    setTimeout(()=>setM(null),3500);
  };

  const handleDelete = async (b) => {
    if(!window.confirm(`Delete batch "${b.batch_name}"? This cannot be undone.`)) return;
    try{
      await api.delete(`/office/batches/${b.id}`);
      setViewBatch(null); setEditBatch(null);
      loadData();
      setM({ok:true,text:`Batch "${b.batch_name}" deleted.`});
    }catch(err){ setM({ok:false,text:err.response?.data?.message||'Error deleting batch.'}); }
    setTimeout(()=>setM(null),3500);
  };

  const filtered = batches.filter(b=>
    b.batch_name?.toLowerCase().includes(search.toLowerCase()) ||
    b.major?.toLowerCase().includes(search.toLowerCase()) ||
    String(b.year).includes(search)
  );

  return (
    <div>
      {m&&<div style={msg(m.ok)}>{m.ok?<Check size={13}/>:<X size={13}/>} {m.text}</div>}

      {/* ── Edit Panel ── */}
      {editBatch&&(
        <div style={{ ...card,border:'2px solid #2d4a5a',marginBottom:'20px' }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px' }}>
            <div style={{ fontSize:'14px',fontWeight:'700',color:'#1a2e3a',display:'flex',alignItems:'center',gap:'8px' }}>
              <Pencil size={15}/> Editing: {editBatch.batch_name}
            </div>
            <button onClick={()=>setEditBatch(null)} style={{ background:'#f0f4f7',border:'1px solid #dde3e8',color:'#5a7080',borderRadius:'6px',padding:'5px 12px',fontSize:'11px',fontWeight:'600',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:'4px' }}>
              <X size={12}/> Cancel
            </button>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:'12px',marginBottom:'16px' }}>
            <div><label style={fl}>Batch Name</label><input style={fi} value={editForm.batch_name} onChange={e=>setEditForm(f=>({...f,batch_name:e.target.value}))}/></div>
            <div><label style={fl}>No. of Students</label><input style={fi} type="number" value={editForm.student_count} onChange={e=>setEditForm(f=>({...f,student_count:parseInt(e.target.value)}))}/></div>
          </div>
          <div style={{ display:'flex',gap:'12px',marginBottom:'16px',flexWrap:'wrap' }}>
            <span style={{ background:'#e8f4fd',color:'#1a5a7a',border:'1px solid #b8d9f5',borderRadius:'8px',padding:'4px 12px',fontSize:'11px',fontWeight:'600' }}>Major: {editBatch.major}</span>
            <span style={{ background:'#f0f4f7',color:'#2d4a5a',border:'1px solid #c8d8e0',borderRadius:'8px',padding:'4px 12px',fontSize:'11px',fontWeight:'600' }}>Year: {editBatch.year}</span>
          </div>
          <div style={{ marginBottom:'16px' }}>
            <label style={fl}>Default Classroom</label>
            <select value={editForm.room_id||''} onChange={e=>setEditForm(f=>({...f,room_id:e.target.value}))} style={fi}>
              <option value="">-- No default room --</option>
              {rooms.map(r=><option key={r.id} value={r.id}>{r.room_id} — Capacity {r.capacity} · {r.room_type==='lab'?'Lab':'Classroom'}</option>)}
            </select>
          </div>
          <div style={{ border:'2px solid #dde3e8',borderRadius:'9px',padding:'16px',marginBottom:'16px',background:'white' }}>
            <SectionLabel count={editSel.length}>Assigned Courses</SectionLabel>
            <Checklist items={subjects} selected={editSel} onToggle={id=>setEditSel(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id])} labelKey="name" emptyText="No courses available" maxHeight={200}/>
          </div>
          <div style={{ display:'flex',gap:'10px' }}>
            <button onClick={handleEditSave} style={{ ...btn,background:'#16a34a' }}><Check size={13}/> Save Changes</button>
            <button onClick={()=>handleDelete(editBatch)} style={{ ...btn,background:'#dc2626' }}><Trash2 size={13}/> Delete Batch</button>
            <button onClick={()=>setEditBatch(null)} style={{ padding:'9px 18px',border:'1px solid #dde3e8',borderRadius:'7px',background:'white',color:'#5a7080',fontSize:'12px',fontWeight:'600',cursor:'pointer',fontFamily:'inherit' }}>Cancel</button>
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
              <div><label style={fl}>Default Room</label>
                <select value={selRoom} onChange={e=>setSelRoom(e.target.value)} style={fi}>
                  <option value="">-- None --</option>
                  {rooms.map(r=><option key={r.id} value={r.id}>{r.room_id} (Cap: {r.capacity})</option>)}
                </select>
              </div>
              <div><label style={fl}>No. of Students</label><input style={fi} type="number" value={form.student_count} onChange={e=>setForm(f=>({...f,student_count:parseInt(e.target.value)}))}/></div>
            </div>
            <div style={{ border:'2px solid #dde3e8',borderRadius:'9px',padding:'16px',marginBottom:'16px',background:'white' }}>
              <SectionLabel count={selCourses.length}>Assign Courses to this Batch</SectionLabel>
              {!form.major_code
                ?<div style={{ padding:'16px',textAlign:'center',color:'#aabbc8',fontSize:'12px',border:'1px dashed #e0e8ed',borderRadius:'7px' }}>Select a major first to see its courses</div>
                : subjects.length===0
                  ?<div style={{ padding:'16px',textAlign:'center',color:'#aabbc8',fontSize:'12px',border:'1px dashed #e0e8ed',borderRadius:'7px' }}>No courses found for <strong>{form.major_code}</strong> — add them in Course Management first</div>
                  :<>
                    <div style={{ fontSize:'10px',color:'#7a9aaa',marginBottom:'8px' }}>Showing {subjects.length} course{subjects.length!==1?'s':''} for <strong style={{ color:'#2d4a5a' }}>{form.major_code}</strong></div>
                    <Checklist items={subjects} selected={selCourses} onToggle={toggle} labelKey="name" emptyText="No courses found"/>
                  </>
              }
            </div>
            <button type="submit" style={btn}> Add Batch</button>
          </form>
        </div>
      )}

      {/* ── Batch Detail Modal ── */}
      {viewBatch&&!editBatch&&(
        <>
          {/* Backdrop */}
          <div onClick={()=>setViewBatch(null)}
            style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:200,backdropFilter:'blur(2px)' }}/>
          {/* Modal */}
          <div style={{ position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:201,width:'min(520px,94vw)',maxHeight:'88vh',display:'flex',flexDirection:'column',background:'white',borderRadius:'16px',boxShadow:'0 20px 60px rgba(0,0,0,0.22)',overflow:'hidden' }}>

            {/* Header */}
            <div style={{ background:'linear-gradient(135deg,#2d4a5a,#3a6070)',padding:'20px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0 }}>
              <div style={{ display:'flex',alignItems:'center',gap:'10px' }}>
                <div style={{ width:'38px',height:'38px',background:'rgba(255,255,255,0.15)',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <GraduationCap size={18} color="white"/>
                </div>
                <div>
                  <div style={{ fontSize:'16px',fontWeight:'700',color:'white' }}>{viewBatch.batch_name}</div>
                  <div style={{ fontSize:'11px',color:'rgba(255,255,255,0.55)',marginTop:'1px' }}>Batch Details</div>
                </div>
              </div>
              <button onClick={()=>setViewBatch(null)}
                style={{ background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.25)',color:'white',borderRadius:'8px',width:'32px',height:'32px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0 }}>
                <X size={15}/>
              </button>
            </div>

            {/* Body */}
            <div style={{ padding:'20px 24px',overflowY:'auto',flex:1 }}>
              {/* Stat cards */}
              <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px',marginBottom:'20px' }}>
                {[
                  { label:'Major',    value: viewBatch.major,         bg:'#e8f4fd', border:'#b8d9f5', color:'#1a5a7a' },
                  { label:'Year',     value: viewBatch.year,          bg:'#f0f4f7', border:'#c8d8e0', color:'#2d4a5a' },
                  { label:'Students', value: viewBatch.student_count, bg:'#f0f4f7', border:'#c8d8e0', color:'#2d4a5a' },
                ].map(({ label, value, bg, border, color }) => (
                  <div key={label} style={{ background: bg, border:`1px solid ${border}`, borderRadius:'10px', padding:'12px 14px' }}>
                    <div style={{ fontSize:'9px',fontWeight:'700',color:'#7a9aaa',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'5px' }}>{label}</div>
                    <div style={{ fontSize:'15px',fontWeight:'700',color }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Courses section */}
              <div style={{ background:'#f8fafc',border:'1px solid #e0e8ed',borderRadius:'12px',padding:'16px' }}>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px' }}>
                  <div style={{ fontSize:'12px',fontWeight:'700',color:'#1a2e3a',textTransform:'uppercase',letterSpacing:'0.5px' }}>Assigned Courses</div>
                  <span style={{ background:'#2d4a5a',color:'white',fontSize:'10px',fontWeight:'700',borderRadius:'10px',padding:'2px 9px' }}>
                    {(batchCourses[viewBatch.id]||[]).length} total
                  </span>
                </div>
                {!batchCourses[viewBatch.id]
                  ? <div style={{ fontSize:'12px',color:'#aabbc8',textAlign:'center',padding:'12px' }}>Loading...</div>
                  : batchCourses[viewBatch.id].length===0
                    ? <div style={{ fontSize:'12px',color:'#aabbc8',fontStyle:'italic',textAlign:'center',padding:'12px' }}>No courses assigned yet.</div>
                    : <div style={{ display:'flex',flexWrap:'wrap',gap:'6px' }}>
                        {batchCourses[viewBatch.id].map(c=>(
                          <div key={c.id} style={{ display:'inline-flex',alignItems:'center',gap:'6px',background:'white',border:'1px solid #d0dfe8',borderRadius:'20px',padding:'5px 12px',fontSize:'11px',color:'#1a2e3a',fontWeight:'500' }}>
                            <span style={{ fontWeight:'700',color:'#2d4a5a',fontSize:'10px' }}>{c.short_name}</span>
                            {c.subject_name}
                            {c.has_lab&&<span style={{ background:'#dcfce7',color:'#166534',borderRadius:'3px',padding:'1px 5px',fontSize:'9px',fontWeight:'700',flexShrink:0 }}>Lab</span>}
                          </div>
                        ))}
                      </div>
                }
              </div>
            </div>

            {/* Footer actions */}
            <div style={{ padding:'14px 24px',borderTop:'1px solid #e8edf0',display:'flex',gap:'8px',background:'white',flexShrink:0 }}>
              <button onClick={()=>openEdit(viewBatch)} style={{ ...btn,flex:1,justifyContent:'center' }}>
                <Pencil size={13}/> Edit Batch
              </button>
              <button onClick={()=>handleDelete(viewBatch)} style={{ ...btn,background:'#dc2626',flex:1,justifyContent:'center' }}>
                <Trash2 size={13}/> Delete Batch
              </button>
              <button onClick={()=>setViewBatch(null)}
                style={{ padding:'9px 18px',border:'1px solid #dde3e8',borderRadius:'7px',background:'white',color:'#5a7080',fontSize:'12px',fontWeight:'600',cursor:'pointer',fontFamily:'inherit' }}>
                Close
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Existing Batches ── */}
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px' }}>
        <div style={{ fontSize:'13px',fontWeight:'700',color:'#1a2e3a',display:'flex',alignItems:'center',gap:'6px' }}>
          <GraduationCap size={14}/> Existing Batches
          <span style={{ fontSize:'11px',color:'#7a9aaa',fontWeight:'400' }}>— click a batch to view details</span>
        </div>
      </div>
      <SearchBar value={search} onChange={setSearch} placeholder="Search by batch name, major or year..."/>
      <div style={{ borderRadius:'10px',overflow:'hidden',border:'1px solid #e0e8ed' }}>
        <table style={{ width:'100%',borderCollapse:'collapse',fontSize:'12px' }}>
          <thead><tr style={{ background:'#2d4a5a',color:'white' }}>
            {['Batch','Major','Year','Students','Action'].map(h=>(
              <th key={h} style={{ padding:'10px 14px',textAlign:'left',fontSize:'10px',fontWeight:'700',textTransform:'uppercase',letterSpacing:'0.5px' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.map(b=>(
              <tr key={b.id}
                onClick={()=>{ setViewBatch(viewBatch?.id===b.id?null:b); setEditBatch(null); }}
                style={{ borderBottom:'0.5px solid #e8edf0', background: viewBatch?.id===b.id?'#f0f6fa': editBatch?.id===b.id?'#f0f6fa':'white', cursor:'pointer', transition:'background 0.1s' }}
                onMouseEnter={e=>{ if(viewBatch?.id!==b.id&&editBatch?.id!==b.id) e.currentTarget.style.background='#f8fafc'; }}
                onMouseLeave={e=>{ if(viewBatch?.id!==b.id&&editBatch?.id!==b.id) e.currentTarget.style.background='white'; }}>
                <td style={{ padding:'10px 14px',fontWeight:'700',color:'#1a2e3a' }}>
                  <div style={{ display:'flex',alignItems:'center',gap:'7px' }}>
                    {viewBatch?.id===b.id&&<div style={{ width:'3px',height:'16px',background:'#2d4a5a',borderRadius:'2px',flexShrink:0 }}/>}
                    {b.batch_name}
                  </div>
                </td>
                <td style={{ padding:'10px 14px' }}><span style={{ background:'#e8f4fd',color:'#1a5a7a',border:'1px solid #b8d9f5',borderRadius:'10px',padding:'2px 9px',fontSize:'10px',fontWeight:'600' }}>{b.major}</span></td>
                <td style={{ padding:'10px 14px',color:'#5a7080' }}>{b.year}</td>
                <td style={{ padding:'10px 14px',color:'#5a7080' }}>{b.student_count}</td>
                <td style={{ padding:'10px 14px' }} onClick={e=>e.stopPropagation()}>
                  <div style={{ display:'flex',gap:'6px' }}>
                    <button onClick={()=>openEdit(b)}
                      style={{ background:editBatch?.id===b.id?'#2d4a5a':'transparent',color:editBatch?.id===b.id?'white':'#2d4a5a',border:'1px solid #2d4a5a',padding:'5px 12px',borderRadius:'6px',fontSize:'11px',fontWeight:'600',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:'4px' }}>
                      <Pencil size={11}/> {editBatch?.id===b.id?'Editing':'Edit'}
                    </button>
                    <button onClick={()=>handleDelete(b)}
                      style={{ background:'transparent',color:'#dc2626',border:'1px solid #fca5a5',padding:'5px 10px',borderRadius:'6px',fontSize:'11px',fontWeight:'600',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:'4px' }}>
                      <Trash2 size={11}/>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length===0&&<tr><td colSpan="5" style={{ padding:'28px',textAlign:'center',color:'#aabbc8' }}>{search?'No batches match your search.':'No batches found.'}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── TEACHER TAB ───────────────────────────────────────────────────────────
function TeacherTab() {
  const { isMobile } = useResponsive();
  const [teachers,      setTeachers]     = useState([]);
  const [depts,         setDepts]        = useState([]);
  const [form, setForm] = useState({ teacher_id:'',full_name:'',department_id:'',specialization:'' });
  const [m, setM]       = useState(null);
  const [search,        setSearch]       = useState('');
  const [editTeacher,   setEditTeacher]  = useState(null);
  const [editForm,      setEditForm]     = useState({});
  const [editCourses,   setEditCourses]  = useState([]);
  const [editSel,       setEditSel]      = useState([]);

  const [subjects, setSubjects] = useState([]);

  const loadData = () => {
    api.get('/office/teachers').then(r=>setTeachers(r.data));
    api.get('/office/departments').then(r=>setDepts(r.data));
    api.get('/office/subjects').then(r=>setSubjects(r.data));
  };
  useEffect(()=>{ loadData(); },[]);

  const handleAdd = async e => {
    e.preventDefault();
    try{
      const dept_id = depts.length>0 ? depts[0].id : '';
      await api.post('/office/teachers',{...form,department_id:dept_id});
      const tRes=await api.get('/office/teachers');
      setTeachers(tRes.data);
      setM({ok:true,text:'Teacher added successfully.'});
      setForm({teacher_id:'',full_name:'',department_id:'',specialization:''});
    }catch(err){ setM({ok:false,text:err.response?.data?.message||'Error'}); }
    setTimeout(()=>setM(null),3500);
  };

  const openEdit = async t => {
    setEditTeacher(t);
    setEditForm({ full_name:t.full_name });
    try{
      const r = await api.get('/assignments/teacher-subjects',{params:{teacher_id:t.id}});
      setEditCourses(r.data);
      setEditSel(r.data.map(x=>x.subject_id));
    }catch(_){ setEditCourses([]); setEditSel([]); }
  };

  const handleEditSave = async () => {
    try{
      await api.put(`/office/teachers/${editTeacher.id}`,{ ...editForm, department_id:editTeacher.department_id });
      const current = editCourses.map(c=>c.subject_id);
      const toAdd    = editSel.filter(id=>!current.includes(id));
      const toRemove = editCourses.filter(c=>!editSel.includes(c.subject_id));
      for(const sid of toAdd){ try{ await api.post('/assignments/teacher-subjects',{teacher_id:editTeacher.id,subject_id:sid}); }catch(_){} }
      for(const c of toRemove){ try{ await api.delete(`/assignments/teacher-subjects/${c.id}`); }catch(_){} }
      loadData();
      setM({ok:true,text:'Teacher updated successfully.'});
      setEditTeacher(null);
    }catch(err){ setM({ok:false,text:err.response?.data?.message||'Error saving.'}); }
    setTimeout(()=>setM(null),3500);
  };

  const filtered = teachers.filter(t=>
    t.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.teacher_id?.toLowerCase().includes(search.toLowerCase()) ||
    t.subjects?.some(s=>s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      {m&&<div style={msg(m.ok)}>{m.ok?<Check size={13}/>:<X size={13}/>} {m.text}</div>}

      {editTeacher&&(
        <div style={{ ...card,border:'2px solid #2d4a5a',marginBottom:'20px' }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px' }}>
            <div style={{ fontSize:'14px',fontWeight:'700',color:'#1a2e3a',display:'flex',alignItems:'center',gap:'8px' }}>
              <Pencil size={15}/> Editing: {editTeacher.teacher_id} — {editTeacher.full_name}
            </div>
            <button onClick={()=>setEditTeacher(null)} style={{ background:'#f0f4f7',border:'1px solid #dde3e8',color:'#5a7080',borderRadius:'6px',padding:'5px 12px',fontSize:'11px',fontWeight:'600',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:'4px' }}>
              <X size={12}/> Cancel
            </button>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:'12px',marginBottom:'16px' }}>
            <div>
              <label style={fl}>Teacher ID</label>
              <div style={{ ...fi,background:'#f8fafc',color:'#7a9aaa',cursor:'not-allowed' }}>{editTeacher.teacher_id}</div>
            </div>
            <div>
              <label style={fl}>Full Name</label>
              <input style={fi} value={editForm.full_name} onChange={e=>setEditForm(f=>({...f,full_name:e.target.value}))}/>
            </div>
          </div>
          <div style={{ marginBottom:'16px',padding:'8px 12px',background:'#e8f4fd',border:'1px solid #b8d9f5',borderRadius:'7px',fontSize:'12px',color:'#1a5a7a',display:'flex',alignItems:'center',gap:'6px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1a5a7a" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Department: <strong>CS &amp; SE Department</strong>
          </div>
          <div style={{ border:'2px solid #dde3e8',borderRadius:'9px',padding:'16px',marginBottom:'16px',background:'white' }}>
            <SectionLabel count={editSel.length}>Assigned Courses</SectionLabel>
            {editSel.length>0&&(
              <div style={{ marginBottom:'12px' }}>
                <div style={{ fontSize:'10px',fontWeight:'700',color:'#5a7080',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'7px' }}>Currently Assigned — click × to remove</div>
                <div style={{ display:'flex',flexWrap:'wrap',gap:'6px' }}>
                  {editSel.map(sid=>{
                    const subj = subjects.find(s=>s.id===sid);
                    if(!subj) return null;
                    return (
                      <div key={sid} style={{ display:'flex',alignItems:'center',gap:'5px',background:'#e8f4fd',border:'1px solid #b8d9f5',borderRadius:'8px',padding:'4px 8px 4px 10px',fontSize:'11px',fontWeight:'600',color:'#1a5a7a' }}>
                        <span>{subj.name}</span>
                        <button onClick={()=>setEditSel(p=>p.filter(x=>x!==sid))}
                          style={{ background:'#bdd9f5',border:'none',cursor:'pointer',color:'#1a5a7a',borderRadius:'50%',width:'16px',height:'16px',display:'flex',alignItems:'center',justifyContent:'center',padding:0,flexShrink:0,lineHeight:1 }}>
                          <X size={9}/>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div style={{ fontSize:'10px',fontWeight:'700',color:'#5a7080',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'7px' }}>Add More Courses</div>
            <Checklist items={subjects.filter(s=>!editSel.includes(s.id))} selected={[]}
              onToggle={id=>setEditSel(p=>[...p,id])}
              labelKey="name" emptyText="All courses already assigned" maxHeight={160}/>
          </div>
          <div style={{ display:'flex',gap:'10px' }}>
            <button onClick={handleEditSave} style={{ ...btn,background:'#16a34a' }}><Check size={13}/> Save Changes</button>
            <button onClick={()=>setEditTeacher(null)} style={{ padding:'9px 18px',border:'1px solid #dde3e8',borderRadius:'7px',background:'white',color:'#5a7080',fontSize:'12px',fontWeight:'600',cursor:'pointer',fontFamily:'inherit' }}>Cancel</button>
          </div>
        </div>
      )}

      {!editTeacher&&(
        <div style={card}>
          <div style={{ fontSize:'14px',fontWeight:'700',color:'#1a2e3a',marginBottom:'16px',display:'flex',alignItems:'center',gap:'8px' }}><Plus size={15}/> Add New Teacher</div>
          <form onSubmit={handleAdd}>
            <div style={{ marginBottom:'10px',padding:'8px 12px',background:'#e8f4fd',border:'1px solid #b8d9f5',borderRadius:'7px',fontSize:'12px',color:'#1a5a7a',display:'flex',alignItems:'center',gap:'6px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1a5a7a" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Department: <strong>CS &amp; SE Department</strong> — all teachers are hired under the same department
            </div>
            <div style={{ display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:'12px',marginBottom:'16px' }}>
              <div><label style={fl}>Teacher ID *</label><input style={fi} placeholder="e.g. T037" value={form.teacher_id} onChange={e=>setForm(f=>({...f,teacher_id:e.target.value}))} required/></div>
              <div><label style={fl}>Full Name *</label><input style={fi} placeholder="Ms. Jane Doe" value={form.full_name} onChange={e=>setForm(f=>({...f,full_name:e.target.value}))} required/></div>
            </div>
            <button type="submit" style={btn}> Add Teacher</button>
          </form>
        </div>
      )}

      <div style={{ fontSize:'13px',fontWeight:'700',color:'#1a2e3a',marginBottom:'10px',display:'flex',alignItems:'center',gap:'6px' }}><Users size={14}/> Teacher Directory</div>
      <SearchBar value={search} onChange={setSearch} placeholder="Search by name, ID or course..."/>
      <div style={{ borderRadius:'10px',overflow:'hidden',border:'1px solid #e0e8ed' }}>
        <table style={{ width:'100%',borderCollapse:'collapse',fontSize:'12px' }}>
          <thead><tr style={{ background:'#2d4a5a',color:'white' }}>
            {['ID','Full Name','Courses Teaching','Action'].map(h=>(
              <th key={h} style={{ padding:'10px 14px',textAlign:'left',fontSize:'10px',fontWeight:'700',textTransform:'uppercase',letterSpacing:'0.5px' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.map(t=>(
              <tr key={t.id} style={{ borderBottom:'0.5px solid #e8edf0',background:editTeacher?.id===t.id?'#f0f6fa':'white' }}>
                <td style={{ padding:'10px 14px' }}><strong style={{ fontFamily:'monospace',color:'#2d4a5a' }}>{t.teacher_id}</strong></td>
                <td style={{ padding:'10px 14px',fontWeight:'600',color:'#1a2e3a' }}>{t.full_name}</td>
                <td style={{ padding:'10px 14px' }}>
                  <div style={{ display:'flex',flexWrap:'wrap',gap:'4px' }}>
                    {t.subjects?.slice(0,3).map((s,i)=><span key={i} style={{ background:'#f0f4f7',color:'#2d4a5a',borderRadius:'8px',padding:'2px 8px',fontSize:'10px',fontWeight:'600' }}>{s}</span>)}
                    {t.subjects?.length>3&&<span style={{ background:'#e8f4fd',color:'#1a5a7a',borderRadius:'8px',padding:'2px 8px',fontSize:'10px',fontWeight:'600' }}>+{t.subjects.length-3}</span>}
                    {(!t.subjects||!t.subjects.length)&&<span style={{ fontSize:'11px',color:'#aabbc8' }}>None assigned</span>}
                  </div>
                </td>
                <td style={{ padding:'10px 14px' }}>
                  <button onClick={()=>openEdit(t)}
                    style={{ background:editTeacher?.id===t.id?'#2d4a5a':'transparent',color:editTeacher?.id===t.id?'white':'#2d4a5a',border:'1px solid #2d4a5a',padding:'5px 14px',borderRadius:'6px',fontSize:'11px',fontWeight:'600',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:'5px' }}>
                    <Pencil size={11}/> {editTeacher?.id===t.id?'Editing':'Edit'}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length===0&&<tr><td colSpan="4" style={{ padding:'28px',textAlign:'center',color:'#aabbc8' }}>{search?'No teachers match your search.':'No teachers found.'}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── COURSE TAB ────────────────────────────────────────────────────────────
// Defined OUTSIDE CourseTab so it never remounts on re-render
function CourseCodeField({ value, onChange, errMsg }) {
  return (
    <div>
      <label style={fl}>
        Code
        <span style={{ color:'#aabbc8',fontSize:'9px',fontWeight:'400',textTransform:'none',marginLeft:'5px' }}>e.g. CFG 4123</span>
      </label>
      <input
        style={{ ...fi, borderColor: errMsg ? '#fca5a5' : '#dde3e8', background: errMsg ? '#fef2f2' : 'white' }}
        placeholder="CFG 4123"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      {errMsg && (
        <div style={{ fontSize:'10px', color:'#dc2626', marginTop:'4px', display:'flex', alignItems:'center', gap:'4px' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {errMsg}
        </div>
      )}
    </div>
  );
}

function CourseTab() {
  const { isMobile } = useResponsive();
  const [subjects,    setSubjects]  = useState([]);
  const [teachers,    setTeachers]  = useState([]);

  const [form, setForm] = useState({ code:'',name:'',short_name:'',credit_hours:3,credit_format:'3+0',has_lab:false,major_code:'',department_id:'' });
  const [codeErr, setCodeErr] = useState('');
  const [depts, setDepts] = useState([]);
  const [m, setM]       = useState(null);
  const [search, setSearch] = useState('');
  const [editCourse,    setEditCourse]   = useState(null);
  const [editForm,      setEditForm]     = useState({});
  const [editTeachers,  setEditTeachers] = useState([]);
  const [editSelT,      setEditSelT]     = useState([]);
  const [editCodeErr,   setEditCodeErr]  = useState('');

  const loadData = () => {
    api.get('/office/subjects').then(r=>setSubjects(r.data));
    api.get('/office/teachers').then(r=>setTeachers(r.data));
  };
  useEffect(()=>{
    loadData();
    api.get('/office/departments').then(r=>setDepts(r.data)).catch(()=>{});
  },[]);


  const isFYP  = f => /fyp|final.year.project/i.test(f.name+' '+f.code);

  // Format: 3 uppercase letters + space + 4 digits  e.g. "CFG 4123"
  const CODE_REGEX = /^[A-Z]{3} \d{4}$/;
  const validateCode = val => {
    if (!val) return '';
    return CODE_REGEX.test(val) ? '' : 'Format: 3 uppercase letters, space, 4 digits — e.g. CFG 4123';
  };

  // Simple handler — uppercase only, no blocking, validate on save
  const onCodeChange = (raw, fieldSetter, errSetter) => {
    const val = raw.toUpperCase();
    fieldSetter(val);
    // Show inline error only once they've typed at least 8 chars
    errSetter(val.length >= 8 ? validateCode(val) : '');
  };

  const MAJORS = [
    { code:'CS', label:'Computer Science' },
    { code:'SE', label:'Software Engineering' },
    { code:'DS', label:'Data Science' },
  ];

  const CREDIT_FORMATS = [
    { value:'3+1', label:'3+1  —  3 theory + 1 lab (3 hrs)', theory:3, lab:1, has_lab:true  },
    { value:'3+0', label:'3+0  —  3 theory only',             theory:3, lab:0, has_lab:false },
    { value:'2+1', label:'2+1  —  2 theory + 1 lab (3 hrs)', theory:2, lab:1, has_lab:true  },
    { value:'2+0', label:'2+0  —  2 theory only',             theory:2, lab:0, has_lab:false },
    { value:'0+3', label:'0+3  —  FYP / Lab only (3 hrs)',    theory:0, lab:3, has_lab:true  },
  ];
  const getCreditFormat = fmt => CREDIT_FORMATS.find(c=>c.value===fmt) || CREDIT_FORMATS[1];
  const applyFormat = (fmt, setter) => {
    const f = getCreditFormat(fmt);
    setter(prev => ({ ...prev, credit_format:fmt, credit_hours: f.theory + f.lab, has_lab: f.has_lab }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const err = validateCode(form.code);
    if(err){ setCodeErr(err); return; }
    try{
      if(!form.major_code){ setM({ok:false,text:'Please select a major for this course.'}); return; }
      const dept = depts.find(d=>d.code===form.major_code);
      const fmt = getCreditFormat(form.credit_format||'3+0');
      await api.post('/office/subjects',{ ...form, department_id: dept?.id||null, credit_format:form.credit_format, credit_hours:fmt.theory+fmt.lab, has_lab:fmt.has_lab });
      loadData();
      setM({ok:true,text:'Course added successfully.'});
      setForm({code:'',name:'',short_name:'',credit_hours:3,credit_format:'3+0',has_lab:false,major_code:'',department_id:''});
      setCodeErr('');
    }catch(err){ setM({ok:false,text:err.response?.data?.message||'Error'}); }
    setTimeout(()=>setM(null),3500);
  };

  const openEdit = async s => {
    setEditCourse(s);
    setEditCodeErr('');
    const fmt = s.credit_format || (
      s.has_lab && s.credit_hours === 3 ? '3+1' :
      !s.has_lab && s.credit_hours === 3 ? '3+0' :
      s.has_lab && s.credit_hours === 2 ? '2+1' :
      !s.has_lab && s.credit_hours === 2 ? '2+0' :
      s.has_lab && s.credit_hours === 0 ? '0+3' : '3+0'
    );
    setEditForm({ code:s.code||'', name:s.name, short_name:s.short_name||'', credit_hours:s.credit_hours, credit_format:fmt, has_lab:s.has_lab, major_code:s.major_code||'', department_id:s.department_id||'' });
    try{
      const r=await api.get('/assignments/teacher-subjects',{params:{subject_id:s.id}});
      setEditTeachers(r.data); setEditSelT(r.data.map(x=>x.teacher_id));
    }catch(_){ setEditTeachers([]); setEditSelT([]); }
  };

  const handleEditSave = async () => {
    // Only validate if code was actually changed from original
    const codeChanged = editForm.code !== (editCourse.code||'');
    if(codeChanged){
      const err = validateCode(editForm.code);
      if(err){ setEditCodeErr(err); return; }
    }
    const isFYPCourse = /fyp|final.year.project/i.test((editForm.name||editCourse.name)+' '+(editForm.code||editCourse.code));
    try{
      const dept = editForm.major_code ? depts.find(d=>d.code===editForm.major_code) : null;
      const fmt = getCreditFormat(editForm.credit_format||'3+0');
      await api.put(`/office/subjects/${editCourse.id}`,{ ...editForm, department_id: dept?.id||editForm.department_id||null, credit_format:editForm.credit_format, credit_hours:fmt.theory+fmt.lab, has_lab:fmt.has_lab });
      loadData(); setM({ok:true,text:'Course updated successfully.'}); setEditCourse(null);
    }catch(err){ setM({ok:false,text:err.response?.data?.message||'Error saving.'}); }
    setTimeout(()=>setM(null),3500);
  };

  const handleDelete = async s => {
    if(!window.confirm(`Delete course "${s.name}"? This will also remove it from all batch and timetable assignments.`)) return;
    try{
      await api.delete(`/office/subjects/${s.id}`);
      setEditCourse(null); loadData();
      setM({ok:true,text:`Course "${s.name}" deleted.`});
    }catch(err){ setM({ok:false,text:err.response?.data?.message||'Error deleting.'}); }
    setTimeout(()=>setM(null),3500);
  };

  const filtered = subjects.filter(s=>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.code?.toLowerCase().includes(search.toLowerCase()) ||
    s.short_name?.toLowerCase().includes(search.toLowerCase())
  );



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
            <button onClick={()=>setEditCourse(null)} style={{ background:'#f0f4f7',border:'1px solid #dde3e8',color:'#5a7080',borderRadius:'6px',padding:'5px 12px',fontSize:'11px',fontWeight:'600',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:'4px' }}>
              <X size={12}/> Cancel
            </button>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 2fr 1fr',gap:'12px',marginBottom:'12px' }}>
            <CourseCodeField
              value={editForm.code ?? ''}
              onChange={v => onCodeChange(v, val => setEditForm(f=>({...f,code:val})), setEditCodeErr)}
              errMsg={editCodeErr}
            />
            <div><label style={fl}>Course Name</label><input style={fi} value={editForm.name||''} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))}/></div>
            <div><label style={fl}>Short Name</label><input style={fi} value={editForm.short_name||''} onChange={e=>setEditForm(f=>({...f,short_name:e.target.value}))}/></div>
          </div>
          <div style={{ marginBottom:'12px' }}>
            <label style={fl}>Major</label>
            <select style={fi} value={editForm.major_code||''} onChange={e=>setEditForm(f=>({...f,major_code:e.target.value}))}>
              <option value="">-- Not assigned --</option>
              {MAJORS.map(m=><option key={m.code} value={m.code}>{m.label} ({m.code})</option>)}
            </select>
          </div>
          <div style={{ marginBottom:'14px' }}>
            <label style={fl}>Credit Hour Format *</label>
            <select style={fi} value={editForm.credit_format||'3+0'} onChange={e=>applyFormat(e.target.value, setEditForm)}>
              {CREDIT_FORMATS.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            {(()=>{ const f=getCreditFormat(editForm.credit_format||'3+0'); return (
              <div style={{ marginTop:'8px',padding:'8px 12px',background:'#f8fafc',border:'1px solid #e0e8ed',borderRadius:'7px',display:'flex',flexWrap:'wrap',gap:'12px',fontSize:'12px',color:'#5a7080' }}>
                <span>Theory: <strong style={{ color:'#1a2e3a' }}>{f.theory} per week</strong></span>
                {f.has_lab && <span>Lab: <strong style={{ color:'#1a2e3a' }}>{f.lab} × 3 hrs</strong></span>}
                {!f.has_lab && <span style={{ color:'#aabbc8' }}>No lab</span>}
                {f.value==='0+3' && <span style={{ background:'#fef3c7',color:'#92400e',borderRadius:'4px',padding:'1px 7px',fontSize:'10px',fontWeight:'700' }}>FYP</span>}
              </div>
            ); })()}
          </div>
          <div style={{ display:'flex',gap:'10px' }}>
            <button onClick={handleEditSave} style={{ ...btn,background:'#16a34a' }}><Check size={13}/> Save Changes</button>
            <button onClick={()=>handleDelete(editCourse)} style={{ ...btn,background:'#dc2626' }}><Trash2 size={13}/> Delete Course</button>
            <button onClick={()=>setEditCourse(null)} style={{ padding:'9px 18px',border:'1px solid #dde3e8',borderRadius:'7px',background:'white',color:'#5a7080',fontSize:'12px',fontWeight:'600',cursor:'pointer',fontFamily:'inherit' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── Add New Course ── */}
      {!editCourse&&(
        <div style={card}>
          <div style={{ fontSize:'14px',fontWeight:'700',color:'#1a2e3a',marginBottom:'16px',display:'flex',alignItems:'center',gap:'8px' }}><Plus size={15}/> Add New Course</div>
          <form onSubmit={handleSubmit}>
            <div style={{ display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 2fr 1fr',gap:'12px',marginBottom:'12px' }}>
              <CourseCodeField
                value={form.code}
                onChange={v => onCodeChange(v, val => setForm(f=>({...f,code:val})), setCodeErr)}
                errMsg={codeErr}
              />
              <div><label style={fl}>Course Name *</label><input style={fi} placeholder="Object Oriented Programming" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required/></div>
              <div><label style={fl}>Short Name</label><input style={fi} placeholder="OOP" value={form.short_name} onChange={e=>setForm(f=>({...f,short_name:e.target.value}))}/></div>
            </div>
            <div style={{ marginBottom:'12px' }}>
              <label style={fl}>Major *</label>
              <select style={fi} required value={form.major_code} onChange={e=>setForm(f=>({...f,major_code:e.target.value}))}>
                <option value="">-- Select Major --</option>
                {MAJORS.map(m=><option key={m.code} value={m.code}>{m.label} ({m.code})</option>)}
              </select>
              {!form.major_code && <div style={{ fontSize:'10px',color:'#7a9aaa',marginTop:'4px' }}>Select the major this course belongs to</div>}
            </div>
            <div style={{ marginBottom:'14px' }}>
              <label style={fl}>Credit Hour Format *</label>
              <select style={fi} value={form.credit_format||'3+0'} onChange={e=>applyFormat(e.target.value, setForm)} required>
                {CREDIT_FORMATS.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              {(()=>{ const f=getCreditFormat(form.credit_format||'3+0'); return (
                <div style={{ marginTop:'8px',padding:'8px 12px',background:'#f8fafc',border:'1px solid #e0e8ed',borderRadius:'7px',display:'flex',flexWrap:'wrap',gap:'12px',fontSize:'12px',color:'#5a7080' }}>
                  <span>Theory: <strong style={{ color:'#1a2e3a' }}>{f.theory} per week</strong></span>
                  {f.has_lab && <span>Lab: <strong style={{ color:'#1a2e3a' }}>{f.lab} × 3 hrs</strong></span>}
                  {!f.has_lab && <span style={{ color:'#aabbc8' }}>No lab</span>}
                  {f.value==='0+3' && <span style={{ background:'#fef3c7',color:'#92400e',borderRadius:'4px',padding:'1px 7px',fontSize:'10px',fontWeight:'700' }}>FYP</span>}
                </div>
              ); })()}
            </div>
            <button type="submit" style={btn}> Add Course</button>
          </form>
        </div>
      )}

      {/* ── Course Directory ── */}
      <div style={{ fontSize:'13px',fontWeight:'700',color:'#1a2e3a',marginBottom:'10px',display:'flex',alignItems:'center',gap:'6px' }}><BookOpen size={14}/> Course Directory</div>
      <SearchBar value={search} onChange={setSearch} placeholder="Search by name, code or short name..."/>
      <div style={{ borderRadius:'10px',overflow:'hidden',border:'1px solid #e0e8ed' }}>
        <table style={{ width:'100%',borderCollapse:'collapse',fontSize:'12px' }}>
         <thead>
        <tr style={{ background:'#2d4a5a',color:'white' }}>
        {['Code', 'Course Name', 'Major', 'Major Code', 'Credit Format', 'Lab', 'Action'].map(h=>(
          <th key={h} style={{ padding:'10px 14px',textAlign:'left',fontSize:'10px',fontWeight:'700',textTransform:'uppercase',letterSpacing:'0.5px' }}>{h}</th>
          ))}
         </tr>
            </thead>
          <tbody>
            {filtered.map(s=>(
              <tr key={s.id} style={{ borderBottom:'0.5px solid #e8edf0',background:editCourse?.id===s.id?'#f0f6fa':'white' }}>
                <td style={{ padding:'10px 14px' }}><strong style={{ fontFamily:'monospace',color:'#2d4a5a' }}>{s.code}</strong></td>
                <td style={{ padding:'10px 14px',fontWeight:'600',color:'#1a2e3a' }}>{s.name}</td>
                <td style={{ padding:'10px 14px' }}><span style={{ background:'#e8f4fd',color:'#1a5a7a',border:'1px solid #b8d9f5',borderRadius:'10px',padding:'2px 9px',fontSize:'10px',fontWeight:'600' }}>{s.short_name}</span></td>
                <td style={{ padding:'10px 14px' }}>
                  {s.major_code
                    ? <span style={{ background:'#f0f4f7',color:'#2d4a5a',border:'1px solid #c8d8e0',borderRadius:'6px',padding:'2px 9px',fontSize:'10px',fontWeight:'700' }}>{s.major_code}</span>
                    : <span style={{ color:'#aabbc8',fontSize:'11px' }}>—</span>
                  }
                </td>
                <td style={{ padding:'10px 14px' }}>
                  <span style={{ fontFamily:'monospace',fontWeight:'700',color:'#2d4a5a',fontSize:'13px' }}>
                    {s.credit_format||(s.has_lab?(s.credit_hours===3?'3+1':'2+1'):(s.credit_hours===3?'3+0':'2+0'))}
                  </span>
                  <span style={{ fontSize:'10px',color:'#7a9aaa',marginLeft:'6px' }}>
                    {(()=>{ const f=getCreditFormat(s.credit_format||(s.has_lab?(s.credit_hours===3?'3+1':'2+1'):(s.credit_hours===3?'3+0':'2+0'))); return `${f.theory}T${f.has_lab?` + ${f.lab}L`:''}` })()}
                  </span>
                </td>
                <td style={{ padding:'10px 14px',textAlign:'center' }}>{s.has_lab?<Check size={14} color="#16a34a"/>:<X size={14} color="#aabbc8"/>}</td>
                <td style={{ padding:'10px 14px' }}>
                  <div style={{ display:'flex',gap:'6px' }}>
                    <button onClick={()=>openEdit(s)} style={{ background:editCourse?.id===s.id?'#2d4a5a':'transparent',color:editCourse?.id===s.id?'white':'#2d4a5a',border:'1px solid #2d4a5a',padding:'5px 12px',borderRadius:'6px',fontSize:'11px',fontWeight:'600',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:'4px' }}>
                      <Pencil size={11}/> {editCourse?.id===s.id?'Editing':'Edit'}
                    </button>
                    <button onClick={()=>handleDelete(s)} style={{ background:'transparent',color:'#dc2626',border:'1px solid #fca5a5',padding:'5px 10px',borderRadius:'6px',fontSize:'11px',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center' }}>
                      <Trash2 size={11}/>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length===0&&<tr><td colSpan="6" style={{ padding:'28px',textAlign:'center',color:'#aabbc8' }}>{search?'No courses match your search.':'No courses found.'}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── CLASSROOM TAB ─────────────────────────────────────────────────────────
function ClassroomTab() {
  const { isMobile } = useResponsive();
  const [rooms,    setRooms]   = useState([]);
  const [form,     setForm]    = useState({ room_id:'',room_name:'',capacity:50,room_type:'classroom' });
  const [editId,   setEditId]  = useState(null);
  const [editForm, setEditForm]= useState({});
  const [m,        setM]       = useState(null);
  const [viewRoom,    setViewRoom]    = useState(null);
  const [schedule,    setSchedule]    = useState([]);
  const [schedLoading,setSchedLoading]= useState(false);

  const DAYS  = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const SLOTS = [
    { id:1, label:'9:00 - 10:00'  },
    { id:2, label:'10:00 - 11:00' },
    { id:3, label:'11:00 - 12:00' },
    { id:4, label:'12:00 - 1:00'  },
    { id:5, label:'1:00 - 2:00'   },
  ];

  useEffect(()=>{ api.get('/office/rooms').then(r=>setRooms(r.data)); },[]);

  const handleAdd = async e => {
    e.preventDefault();
    try{
      const r = await api.post('/office/rooms',{...form,room_name:form.room_name||form.room_id});
      setRooms(rs=>[...rs,r.data]);
      setM({ok:true,text:'Classroom added.'});
      setForm({room_id:'',room_name:'',capacity:50,room_type:'classroom'});
    }catch(err){ setM({ok:false,text:err.response?.data?.message||'Error'}); }
    setTimeout(()=>setM(null),3000);
  };

  const handleUpd = async id => {
    try{
      const r = await api.put(`/office/rooms/${id}`,editForm);
      setRooms(rs=>rs.map(x=>x.id===id?r.data:x));
      setEditId(null);
    }catch(e){ alert('Error updating room.'); }
  };

  const openModal = async room => {
    setViewRoom(room); setSchedule([]); setSchedLoading(true);
    try{ const r = await api.get('/office/room-schedule',{params:{room_id:room.id}}); setSchedule(r.data||[]); }
    catch(_){ setSchedule([]); } finally{ setSchedLoading(false); }
  };

  const buildGrid = () => {
    const grid = {};
    DAYS.forEach(d=>{ grid[d]={}; SLOTS.forEach(s=>{ grid[d][s.id]=null; }); });
    schedule.forEach(e=>{ const day=e.day?.trim(); const sl=parseInt(e.time_slot); if(grid[day]!==undefined) grid[day][sl]=e; });
    return grid;
  };
  const grid = viewRoom ? buildGrid() : {};

  const typeColor = t => ({ classroom:'#2d4a5a', lab:'#1a7a8a', auditorium:'#5a4a8a' }[t]||'#2d4a5a');
  const TypeIcon = ({ type, size=16, color='white' }) => {
    if(type==='lab') return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6M9 3v7L4 20h16L15 10V3"/><line x1="9" y1="14" x2="15" y2="14"/></svg>;
    if(type==='auditorium') return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20h20M4 20V10l8-7 8 7v10"/><rect x="9" y="14" width="6" height="6"/></svg>;
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>;
  };

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
            <div><label style={fl}>Type</label>
              <select style={fi} value={form.room_type} onChange={e=>setForm(f=>({...f,room_type:e.target.value}))}>
                <option value="classroom">Classroom</option><option value="lab">Lab</option><option value="auditorium">Auditorium</option>
              </select>
            </div>
          </div>
          <button type="submit" style={btn}> Add Classroom</button>
        </form>
      </div>

      <div style={{ fontSize:'13px',fontWeight:'700',color:'#1a2e3a',marginBottom:'12px',display:'flex',alignItems:'center',gap:'6px' }}>
        <Building2 size={14}/> Classroom Status <span style={{ fontSize:'11px',color:'#7a9aaa',fontWeight:'400' }}>— click a room to view its timetable</span>
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:'12px' }}>
        {rooms.map(r=>(
          <div key={r.id} style={{ background:'white',border:`1.5px solid ${editId===r.id?'#2d4a5a':'#c8d8e0'}`,borderRadius:'10px',padding:'14px',transition:'all 0.15s',cursor:editId===r.id?'default':'pointer' }}
            onClick={()=>{ if(editId!==r.id) openModal(r); }}>
            {editId===r.id?(
              <div onClick={e=>e.stopPropagation()}>
                <div style={{ fontSize:'13px',fontWeight:'700',color:'#1a2e3a',marginBottom:'12px',display:'flex',alignItems:'center',gap:'6px' }}><Pencil size={12}/> {r.room_id}</div>
                <div style={{ marginBottom:'8px' }}><label style={fl}>Capacity</label><input style={fi} type="number" value={editForm.capacity} onChange={e=>setEditForm(f=>({...f,capacity:parseInt(e.target.value)}))}/></div>
                <div style={{ marginBottom:'12px' }}><label style={fl}>Type</label>
                  <select style={fi} value={editForm.room_type} onChange={e=>setEditForm(f=>({...f,room_type:e.target.value}))}>
                    <option value="classroom">Classroom</option><option value="lab">Lab</option><option value="auditorium">Auditorium</option>
                  </select>
                </div>
                <div style={{ display:'flex',gap:'6px' }}>
                  <button onClick={()=>handleUpd(r.id)} style={{ flex:1,background:'#16a34a',color:'white',border:'none',padding:'7px',borderRadius:'6px',fontSize:'11px',fontWeight:'700',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'4px' }}><Check size={11}/> Save</button>
                  <button onClick={()=>setEditId(null)} style={{ background:'#f0f4f7',color:'#5a7080',border:'1px solid #dde3e8',padding:'7px 10px',borderRadius:'6px',fontSize:'11px',cursor:'pointer',display:'flex',alignItems:'center' }}><X size={11}/></button>
                </div>
              </div>
            ):(
              <>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px' }}>
                  <div style={{ fontSize:'15px',fontWeight:'800',color:'#1a2e3a' }}>{r.room_id}</div>
                  <div style={{ width:'24px',height:'24px',background:'#f0f6fa',borderRadius:'6px',display:'flex',alignItems:'center',justifyContent:'center' }}><TypeIcon type={r.room_type} size={13} color="#2d4a5a"/></div>
                </div>
                <div style={{ fontSize:'11px',color:'#5a7080',marginBottom:'2px' }}>Capacity: <strong style={{ color:'#1a2e3a' }}>{r.capacity}</strong></div>
                <div style={{ fontSize:'11px',color:'#5a7080',marginBottom:'12px',textTransform:'capitalize' }}>Type: <strong style={{ color:'#1a2e3a' }}>{r.room_type}</strong></div>
                <button onClick={e=>{ e.stopPropagation(); setEditId(r.id); setEditForm({capacity:r.capacity,room_type:r.room_type}); }}
                  style={{ width:'100%',background:'#2d4a5a',color:'white',border:'none',padding:'7px',borderRadius:'6px',fontSize:'11px',fontWeight:'700',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'5px' }}>
                  <Pencil size={11}/> Edit
                </button>
              </>
            )}
          </div>
        ))}
        {rooms.length===0&&<div style={{ gridColumn:'1/-1',padding:'28px',textAlign:'center',color:'#aabbc8',fontSize:'12px' }}>No rooms found.</div>}
      </div>

      {viewRoom&&(
        <>
          <div onClick={()=>setViewRoom(null)} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:200,backdropFilter:'blur(2px)' }}/>
          <div style={{ position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:201,width:'min(860px,96vw)',maxHeight:'88vh',display:'flex',flexDirection:'column',background:'white',borderRadius:'16px',boxShadow:'0 20px 60px rgba(0,0,0,0.22)',overflow:'hidden' }}>
            <div style={{ background:`linear-gradient(135deg,${typeColor(viewRoom.room_type)},#3a6070)`,padding:'18px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0 }}>
              <div style={{ display:'flex',alignItems:'center',gap:'12px' }}>
                <div style={{ width:'40px',height:'40px',background:'rgba(255,255,255,0.15)',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center' }}><TypeIcon type={viewRoom.room_type} size={20} color="white"/></div>
                <div>
                  <div style={{ fontSize:'17px',fontWeight:'700',color:'white' }}>{viewRoom.room_id}</div>
                  <div style={{ fontSize:'11px',color:'rgba(255,255,255,0.6)',marginTop:'2px',textTransform:'capitalize' }}>{viewRoom.room_type} · Capacity {viewRoom.capacity}</div>
                </div>
              </div>
              <button onClick={()=>setViewRoom(null)} style={{ background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.25)',color:'white',borderRadius:'8px',width:'32px',height:'32px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0 }}><X size={15}/></button>
            </div>
            <div style={{ flex:1,overflowY:'auto',padding:'20px 24px' }}>
              {schedLoading?<div style={{ textAlign:'center',padding:'40px',color:'#aabbc8',fontSize:'13px' }}>Loading timetable...</div>
              :schedule.length===0?<div style={{ textAlign:'center',padding:'40px',color:'#aabbc8' }}><div style={{ fontSize:'14px',fontWeight:'600',marginBottom:'4px',color:'#5a7080' }}>No classes scheduled</div><div style={{ fontSize:'12px' }}>This room has no timetable entries yet.</div></div>
              :(
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%',borderCollapse:'collapse',fontSize:'12px',minWidth:'600px' }}>
                    <thead><tr>
                      <th style={{ padding:'10px 12px',background:'#f8fafc',border:'1px solid #e0e8ed',fontSize:'10px',fontWeight:'700',color:'#5a7080',textTransform:'uppercase',letterSpacing:'0.5px',width:'110px',textAlign:'left' }}>Time</th>
                      {DAYS.map(d=><th key={d} style={{ padding:'10px 12px',background:'#2d4a5a',color:'white',border:'1px solid #2d4a5a',fontSize:'10px',fontWeight:'700',textTransform:'uppercase',letterSpacing:'0.5px',textAlign:'center' }}>{d.slice(0,3)}</th>)}
                    </tr></thead>
                    <tbody>
                      {SLOTS.map(slot=>(
                        <tr key={slot.id}>
                          <td style={{ padding:'10px 12px',background:'#f8fafc',border:'1px solid #e0e8ed',fontWeight:'600',color:'#5a7080',fontSize:'11px',whiteSpace:'nowrap' }}>{slot.label}</td>
                          {DAYS.map(day=>{ const entry=grid[day]?.[slot.id]; return (
                            <td key={day} style={{ padding:'6px',border:'1px solid #e0e8ed',verticalAlign:'top',background:entry?'#f0f6fa':'white',minWidth:'110px' }}>
                              {entry?(<div style={{ background:'#2d4a5a',borderRadius:'7px',padding:'7px 9px',color:'white' }}>
                                <div style={{ fontSize:'11px',fontWeight:'700',marginBottom:'3px',lineHeight:1.2 }}>{entry.short_name||entry.subject_name}</div>
                                <div style={{ fontSize:'10px',color:'rgba(255,255,255,0.7)',marginBottom:'2px' }}>{entry.batch_name}</div>
                                {entry.teacher_name&&<div style={{ fontSize:'9px',color:'rgba(255,255,255,0.55)' }}>{entry.teacher_name}</div>}
                                {entry.is_lab&&<span style={{ background:'rgba(255,255,255,0.18)',borderRadius:'3px',padding:'1px 5px',fontSize:'8px',fontWeight:'700',marginTop:'4px',display:'inline-block' }}>LAB</span>}
                              </div>):(<div style={{ height:'52px',display:'flex',alignItems:'center',justifyContent:'center' }}><div style={{ width:'16px',height:'1px',background:'#e8edf0' }}/></div>)}
                            </td>
                          ); })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div style={{ padding:'12px 24px',borderTop:'1px solid #e8edf0',background:'white',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0 }}>
              <div style={{ fontSize:'11px',color:'#7a9aaa' }}>{schedule.length} class{schedule.length!==1?'es':''} scheduled in this room</div>
              <button onClick={()=>setViewRoom(null)} style={{ padding:'7px 20px',border:'1px solid #dde3e8',borderRadius:'7px',background:'white',color:'#5a7080',fontSize:'12px',fontWeight:'600',cursor:'pointer',fontFamily:'inherit' }}>Close</button>
            </div>
          </div>
        </>
      )}
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
  const [editStu,  setEditStu]  = useState(null);
  const [editForm, setEditForm] = useState({});
  const [search,   setSearch]   = useState('');
  const showMsg=(ok,text)=>{ setM({ok,text}); setTimeout(()=>setM(null),5000); };

  useEffect(()=>{
    api.get('/office/batches').then(r=>setBatches(r.data));
    api.get('/office/departments').then(r=>setDepts(r.data));
  },[]);

  const loadStudents=React.useCallback((bid)=>{
    const batchId = bid !== undefined ? bid : filterBatch;
    const p = batchId ? {batch_id:batchId} : {};
    api.get('/enrollment',{params:p}).then(r=>setStudents(r.data)).catch(()=>{});
  },[filterBatch]);
  useEffect(()=>{ loadStudents(); },[filterBatch]);

  const handleEditSave = async()=>{
    try{ await api.put(`/enrollment/${editStu.id}`,editForm); setEditStu(null); loadStudents(); showMsg(true,'Student updated.'); }
    catch(err){ showMsg(false,err.response?.data?.message||'Error'); }
  };

  const filtered = students.filter(s=>
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.student_id?.toLowerCase().includes(search.toLowerCase()) ||
    s.batch_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {m&&<div style={msg(m.ok)}>{m.ok?<Check size={13}/>:<X size={13}/>} {m.text}</div>}
      <div style={{ display:'flex',gap:'3px',background:'#f0f4f7',borderRadius:'8px',padding:'3px',marginBottom:'18px',width:'fit-content' }}>
        {[['manual','Manual Add'],['bulk','Bulk Upload']].map(([id,label])=>(
          <button key={id} onClick={()=>setSubTab(id)} style={{ padding:'7px 18px',border:'none',borderRadius:'6px',fontFamily:'inherit',fontSize:'12px',fontWeight:subTab===id?'700':'500',cursor:'pointer',background:subTab===id?'white':'transparent',color:subTab===id?'#1a2e3a':'#5a7080',boxShadow:subTab===id?'0 1px 4px rgba(0,0,0,0.08)':'none' }}>{label}</button>
        ))}
      </div>
      {subTab==='manual'&&<div style={card}><div style={{ fontSize:'14px',fontWeight:'700',color:'#1a2e3a',marginBottom:'14px',display:'flex',alignItems:'center',gap:'7px' }}> Add Student</div><EnrollManual batches={batches} depts={depts} onSuccess={()=>{ showMsg(true,'Student enrolled.'); loadStudents(); }} onError={t=>showMsg(false,t)}/></div>}
      {subTab==='bulk'&&<EnrollBulk batches={batches} onSuccess={(r,bid)=>{ showMsg(true,r); loadStudents(bid||''); }} onError={t=>showMsg(false,t)}/>}

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
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px' }}>
          <div style={{ fontSize:'13px',fontWeight:'700',color:'#1a2e3a',display:'flex',alignItems:'center',gap:'6px' }}>
            <Users size={14}/> Enrolled Students
            <span style={{ fontSize:'11px',color:'#7a9aaa',fontWeight:'400' }}>({filtered.length}{search||filterBatch?' shown':` total`})</span>
          </div>
          <select value={filterBatch} onChange={e=>setFilterB(e.target.value)} style={{ padding:'6px 10px',border:'1px solid #dde3e8',borderRadius:'6px',fontSize:'12px',fontFamily:'inherit',color:'#1a2e3a',outline:'none' }}>
            <option value="">All Batches</option>{batches.map(b=><option key={b.id} value={b.id}>{b.batch_name}</option>)}
          </select>
        </div>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name, student ID or batch..."/>
        <div style={{ borderRadius:'10px',overflow:'hidden',border:'1px solid #e0e8ed' }}>
          <table style={{ width:'100%',borderCollapse:'collapse',fontSize:'12px' }}>
            <thead><tr style={{ background:'#2d4a5a',color:'white' }}>
              {['Student ID','Full Name','Batch','Department','Enrolled On','Action'].map(h=>(
                <th key={h} style={{ padding:'10px 14px',textAlign:'left',fontSize:'10px',fontWeight:'700',textTransform:'uppercase',letterSpacing:'0.5px' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map(s=>(
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
              {filtered.length===0&&<tr><td colSpan="6" style={{ padding:'28px',textAlign:'center',color:'#aabbc8' }}>{search?'No students match your search.':'No students enrolled yet.'}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function EnrollManual({ batches, depts, onSuccess, onError }) {
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
    if(!file){onError('Select a file.');return;} if(!batchId){onError('Select a batch.');return;}
    setLoading(true); setResult(null);
    try{ const fd=new FormData(); fd.append('file',file); fd.append('batch_id',batchId); const res=await api.post('/enrollment/bulk',fd,{headers:{'Content-Type':'multipart/form-data'}}); setResult(res.data); setFile(null); if(fileRef.current) fileRef.current.value=''; onSuccess(`Enrolled ${res.data.enrolled} of ${res.data.total} students.`, batchId); }
    catch(err){ onError(err.response?.data?.message||'Upload failed.'); } finally{ setLoading(false); }
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
            {file?<div><div style={{ fontSize:'12px',fontWeight:'700',color:'#16a34a' }}>{file.name}</div><div style={{ fontSize:'10px',color:'#7a9aaa' }}>{(file.size/1024).toFixed(1)} KB</div></div>:<div><div style={{ fontSize:'12px',fontWeight:'600',color:'#2d4a5a' }}>Drop file or click to browse</div><div style={{ fontSize:'10px',color:'#8fa5b0',marginTop:'3px' }}>.xlsx .xls .csv</div></div>}
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display:'none' }} onChange={e=>handleFile(e.target.files[0])}/>
          </div>
          <div style={{ display:'flex',gap:'8px' }}>
            <button onClick={handleUpload} disabled={!file||!batchId||loading} style={{ ...btn,opacity:(!file||!batchId||loading)?0.4:1,cursor:(!file||!batchId||loading)?'not-allowed':'pointer' }}>Upload & Enroll</button>
            <button onClick={downloadTemplate} style={{ padding:'8px 14px',border:'1px solid #dde3e8',borderRadius:'7px',fontSize:'12px',fontWeight:'600',cursor:'pointer',background:'white',color:'#2d4a5a',fontFamily:'inherit' }}>Template</button>
          </div>
        </div>
        <div style={{ background:'#f8fafc',border:'1px solid #e0e8ed',borderRadius:'8px',padding:'14px' }}>
          {result?(<div><div style={{ fontSize:'12px',fontWeight:'700',color:'#1a2e3a',marginBottom:'10px' }}>Upload Result</div><div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px' }}>{[['Total',result.total,'#2d4a5a'],['Enrolled',result.enrolled,'#16a34a'],['Skipped',result.skipped,'#d97706']].map(([l,v,c])=>(<div key={l} style={{ background:'white',borderRadius:'7px',padding:'10px',textAlign:'center',border:'1px solid #e0e8ed' }}><div style={{ fontSize:'22px',fontWeight:'800',color:c }}>{v}</div><div style={{ fontSize:'9px',color:'#7a9aaa',fontWeight:'600',textTransform:'uppercase' }}>{l}</div></div>))}</div></div>)
          :(<div style={{ textAlign:'center',padding:'20px',color:'#aabbc8' }}><div style={{ fontSize:'12px',fontWeight:'600',marginBottom:'6px' }}>Upload a file to see results</div><div style={{ fontSize:'11px' }}>Default password = student ID (lowercase)</div></div>)}
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
    if(type==='update') return (<div><div style={{ fontSize:'13px',fontWeight:'700',color:'#1a2e3a',marginBottom:'10px' }}>{who} wants to reschedule a class</div>{d.teacher_reason&&<div style={{ background:'#fef3c7',border:'1px solid #fde68a',borderRadius:'7px',padding:'8px 12px',marginBottom:'10px',fontSize:'12px',color:'#92400e' }}><strong>Reason:</strong> {d.teacher_reason}</div>}<div style={{ fontSize:'10px',fontWeight:'700',color:'#dc2626',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'5px' }}>From</div><div style={{ ...grid,background:'#fef2f2',border:'1px solid #fecaca',borderRadius:'8px',padding:'10px',marginBottom:'10px' }}><SummaryItem label="Subject" value={d.old_subject_name||d.subject_name||'—'}/><SummaryItem label="Day" value={d.old_day||'—'}/><SummaryItem label="Time" value={d.old_slot_label||'—'}/><SummaryItem label="Room" value={d.old_room_code||'—'}/></div><div style={{ fontSize:'10px',fontWeight:'700',color:'#16a34a',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'5px' }}>To</div><div style={{ ...grid,background:'#f0fdf4',border:'1px solid #86efac',borderRadius:'8px',padding:'10px' }}><SummaryItem label="Subject" value={d.subject_name||'—'}/><SummaryItem label="Day" value={d.day||'—'}/><SummaryItem label="Time" value={d.slot_label||'—'}/><SummaryItem label="Room" value={d.room_code||'—'}/></div></div>);
    if(type==='create') return (<div><div style={{ fontSize:'13px',fontWeight:'700',color:'#1a2e3a',marginBottom:'10px' }}>{who} wants to add a new class</div><div style={{ ...grid,background:'#f0fdf4',border:'1px solid #86efac',borderRadius:'8px',padding:'10px' }}><SummaryItem label="Subject" value={d.subject_name||'—'}/><SummaryItem label="Teacher" value={d.teacher_name||'—'}/><SummaryItem label="Batch" value={d.batch_name||'—'}/><SummaryItem label="Room" value={d.room_code||'—'}/><SummaryItem label="Day" value={d.day||'—'}/><SummaryItem label="Time" value={d.slot_label||'—'}/></div></div>);
    if(type==='delete') return (<div><div style={{ fontSize:'13px',fontWeight:'700',color:'#1a2e3a',marginBottom:'10px' }}>{who} wants to remove a class</div><div style={{ ...grid,background:'#fef2f2',border:'1px solid #fecaca',borderRadius:'8px',padding:'10px' }}><SummaryItem label="Subject" value={d.subject_name||'—'}/><SummaryItem label="Teacher" value={d.teacher_name||'—'}/><SummaryItem label="Batch" value={d.batch_name||'—'}/><SummaryItem label="Room" value={d.room_code||'—'}/><SummaryItem label="Day" value={d.day||'—'}/><SummaryItem label="Time" value={d.slot_label||'—'}/></div></div>);
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
