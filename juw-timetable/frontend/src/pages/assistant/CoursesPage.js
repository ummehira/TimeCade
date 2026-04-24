// frontend/src/pages/assistant/CoursesPage.js
import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const MAJOR_GROUPS = [
  { label:'Computer Science',    code:'CS' },
  { label:'Software Engineering',code:'SE' },
  { label:'Data Science',        code:'DS' },
];

export default function CoursesPage(){
  const [batches,setBatches]   = useState([]);
  const [entries,setEntries]   = useState([]);
  const [selBatch,setSelBatch] = useState(null);
  const [loading,setLoading]   = useState(false);

  useEffect(()=>{
    api.get('/office/batches').then(r=>{ setBatches(r.data); if(r.data.length) setSelBatch(r.data[0].id); });
  },[]);

  useEffect(()=>{
    if(!selBatch) return;
    setLoading(true);
    api.get('/timetable',{ params:{ batch_id:selBatch } })
      .then(r=>setEntries(r.data))
      .finally(()=>setLoading(false));
  },[selBatch]);

  const selBatchObj = batches.find(b=>b.id===selBatch);

  // unique courses from timetable entries
  const seen=new Set();
  const courses=entries.filter(e=>{ if(seen.has(e.subject_id)) return false; seen.add(e.subject_id); return true; });

  return(
    <div className="page-content">
      <div className="card">
        <div className="card-header">
          <h2>Course Overview</h2>
        </div>
        <div className="card-body">
          {/* Quick Switch */}
          <div style={{ background:'#f8fafc',border:'0.5px solid #dde3e8',borderRadius:'10px',padding:'16px 18px',marginBottom:'20px' }}>
            <div style={{ fontSize:'12px',fontWeight:'700',color:'#1a2e3a',marginBottom:'12px' }}>Quick Switch:</div>
            {MAJOR_GROUPS.map(g=>{
              const grpBatches=batches.filter(b=>b.major_code===g.code);
              if(!grpBatches.length) return null;
              return(
                <div key={g.code} style={{ marginBottom:'10px' }}>
                  <div style={{ fontSize:'10px',color:'#7a9aaa',marginBottom:'5px',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.5px' }}>{g.label}</div>
                  <div style={{ display:'flex',gap:'6px',flexWrap:'wrap' }}>
                    {grpBatches.map(b=>(
                      <button key={b.id} onClick={()=>setSelBatch(b.id)}
                        style={{ padding:'5px 14px',borderRadius:'6px',border:'1px solid',fontSize:'11px',fontWeight:'600',cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s',
                          background:selBatch===b.id?'#2d4a5a':'white',
                          color:selBatch===b.id?'white':'#4a6070',
                          borderColor:selBatch===b.id?'#2d4a5a':'#c8d8e0' }}>
                        {b.batch_name}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Course cards */}
          {selBatchObj&&(
            <div style={{ fontSize:'14px',fontWeight:'700',color:'#1a2e3a',marginBottom:'14px',paddingBottom:'10px',borderBottom:'1px solid #e8edf0' }}>
              Courses — {selBatchObj.batch_name}
            </div>
          )}
          {loading?(
            <div style={{ textAlign:'center',padding:'32px' }}><div className="spinner" style={{ margin:'0 auto' }}></div></div>
          ):courses.length===0?(
            <div className="empty-state">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
              <h3>No courses found</h3>
              <p>{selBatch?'No timetable entries for this batch yet':'Select a batch to view courses'}</p>
            </div>
          ):(
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'12px' }}>
              {courses.map(e=>(
                <div key={e.subject_id} style={{ background:'white',border:'0.5px solid #dde3e8',borderRadius:'10px',padding:'14px 16px',borderTop:'3px solid #2d4a5a' }}>
                  <div style={{ fontSize:'13px',fontWeight:'700',color:'#1a2e3a',marginBottom:'10px',lineHeight:'1.35' }}>{e.subject_name}</div>
                  <div style={{ fontSize:'11px',color:'#7a9aaa',marginBottom:'3px' }}>
                    Instructor: <strong style={{ color:'#1a2e3a',fontWeight:'600' }}>{e.teacher_name}</strong>
                  </div>
                  <div style={{ fontSize:'11px',color:'#7a9aaa' }}>
                    Batch: <strong style={{ color:'#1a2e3a',fontWeight:'600' }}>{e.batch_name}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}