// frontend/src/pages/assistant/EnrollmentPage.js
import React, { useState, useEffect, useRef } from 'react';
import { Users, Upload, Plus, Download, X, CheckCircle, AlertTriangle, FileSpreadsheet, Trash2 } from 'lucide-react';
import api from '../../utils/api';

// ── shared field styles ───────────────────────────────────────────────────
const fieldLabel = { fontSize:'10px',fontWeight:'700',textTransform:'uppercase',letterSpacing:'0.5px',color:'#5a7080',display:'block',marginBottom:'4px' };
const fieldInput = { width:'100%',padding:'8px 10px',border:'1px solid #dde3e8',borderRadius:'6px',fontSize:'12px',fontFamily:'inherit',color:'#1a2e3a',outline:'none' };
const addBtn     = { background:'#2d4a5a',color:'white',border:'none',padding:'8px 18px',borderRadius:'6px',fontSize:'12px',fontWeight:'700',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:'6px' };

export default function EnrollmentPage() {
  const [batches,    setBatches]    = useState([]);
  const [departments,setDepts]      = useState([]);
  const [students,   setStudents]   = useState([]);
  const [filterBatch,setFilterBatch]= useState('');
  const [activeTab,  setActiveTab]  = useState('manual'); // 'manual' | 'bulk'
  const [msg,        setMsg]        = useState(null);

  const showMsg = (ok, text) => { setMsg({ ok, text }); setTimeout(() => setMsg(null), 5000); };

  useEffect(() => {
    api.get('/office/batches').then(r => setBatches(r.data));
    api.get('/office/departments').then(r => setDepts(r.data));
  }, []);

  const loadStudents = (bid = filterBatch) => {
    const params = bid ? { batch_id: bid } : {};
    api.get('/enrollment', { params }).then(r => setStudents(r.data)).catch(() => {});
  };

  const handleDelete = async (student) => {
    if (!window.confirm(`Delete student "${student.full_name}" (${student.student_id})? This cannot be undone.`)) return;
    try {
      await api.delete(`/enrollment/${student.id}`);
      showMsg(true, `Student "${student.full_name}" deleted successfully.`);
      loadStudents();
    } catch (err) {
      showMsg(false, err.response?.data?.message || 'Failed to delete student.');
    }
  };

  useEffect(() => { loadStudents(); }, [filterBatch]);

  return (
    <div className="page-content">
      {/* Top message */}
      {msg && (
        <div style={{ marginBottom:'14px',padding:'11px 14px',borderRadius:'8px',fontSize:'13px',fontWeight:'600',display:'flex',alignItems:'flex-start',gap:'9px',
          background:msg.ok?'#dcfce7':'#fef2f2',color:msg.ok?'#16a34a':'#dc2626',
          border:`1px solid ${msg.ok?'#86efac':'#fecaca'}` }}>
          {msg.ok ? <CheckCircle size={16} style={{flexShrink:0,marginTop:'1px'}} /> : <AlertTriangle size={16} style={{flexShrink:0,marginTop:'1px'}} />}
          <span>{msg.text}</span>
        </div>
      )}

      <div className="card" style={{ marginBottom:'20px' }}>
        <div className="card-header"><h2><Users size={16} /> Student Enrollment</h2></div>

        {/* Tab switcher */}
        <div style={{ borderBottom:'1px solid #e0e8ed',display:'flex',padding:'0 22px',background:'white' }}>
          {[['manual','Manual Add'],['bulk','Bulk Upload (Excel / CSV)']].map(([id,label]) => (
            <button key={id} onClick={() => setActiveTab(id)} style={{
              padding:'10px 16px',border:'none',background:'none',fontFamily:'inherit',fontSize:'12.5px',fontWeight:activeTab===id?'700':'500',cursor:'pointer',
              color:activeTab===id?'#1a2e3a':'#5a7080',borderBottom:activeTab===id?'2px solid #2d4a5a':'2px solid transparent',marginBottom:'-1px'
            }}>{label}</button>
          ))}
        </div>

        <div className="card-body">
          {activeTab === 'manual' && <ManualForm batches={batches} departments={departments} onSuccess={() => { showMsg(true,'Student enrolled successfully.'); loadStudents(); }} onError={m => showMsg(false, m)} />}
          {activeTab === 'bulk'   && <BulkUpload  batches={batches} onSuccess={(r) => { showMsg(true, r); loadStudents(); }} onError={m => showMsg(false, m)} />}
        </div>
      </div>

      {/* Students list */}
      <div className="card">
        <div className="card-header">
          <h2><Users size={16} /> Enrolled Students</h2>
          <select value={filterBatch} onChange={e => setFilterBatch(e.target.value)}
            style={{ padding:'7px 10px',border:'1px solid #dde3e8',borderRadius:'6px',fontSize:'12px',fontFamily:'inherit',color:'#1a2e3a' }}>
            <option value="">All Batches</option>
            {batches.map(b => <option key={b.id} value={b.id}>{b.batch_name}</option>)}
          </select>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%',borderCollapse:'collapse',fontSize:'12px' }}>
            <thead>
              <tr style={{ background:'#2d4a5a',color:'white' }}>
                {['Student ID','Full Name','Batch','Department','Enrolled On','Actions'].map(h => (
                  <th key={h} style={{ padding:'10px 14px',textAlign:'left',fontSize:'10px',fontWeight:'700',textTransform:'uppercase',letterSpacing:'0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id} style={{ borderBottom:'0.5px solid #e8edf0' }}>
                  <td style={{ padding:'10px 14px' }}><strong style={{ fontFamily:'monospace',color:'#2d4a5a',fontSize:'12px' }}>{s.student_id}</strong></td>
                  <td style={{ padding:'10px 14px',fontWeight:'600',color:'#1a2e3a' }}>{s.full_name}</td>
                  <td style={{ padding:'10px 14px' }}><span style={{ background:'#e8f4fd',color:'#1a5a7a',border:'1px solid #b8d9f5',borderRadius:'10px',padding:'2px 9px',fontSize:'10px',fontWeight:'600' }}>{s.batch_name}</span></td>
                  <td style={{ padding:'10px 14px',color:'#5a7080',fontSize:'12px' }}>{s.department_name||'—'}</td>
                  <td style={{ padding:'10px 14px',color:'#8fa5b0',fontSize:'11px' }}>{new Date(s.enrollment_date||s.created_at).toLocaleDateString()}</td>
                  <td style={{ padding:'10px 14px' }}>
                    <button
                      onClick={() => handleDelete(s)}
                      title="Delete student"
                      style={{ background:'#fef2f2',color:'#dc2626',border:'1px solid #fecaca',borderRadius:'6px',padding:'5px 10px',cursor:'pointer',display:'flex',alignItems:'center',gap:'4px',fontSize:'11px',fontWeight:'600',fontFamily:'inherit' }}
                    >
                      <Trash2 size={12}/> Delete
                    </button>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr><td colSpan="6" style={{ padding:'32px',textAlign:'center',color:'#aabbc8',fontSize:'13px' }}>No students enrolled yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {students.length > 0 && (
          <div style={{ padding:'10px 14px',borderTop:'0.5px solid #e8edf0',fontSize:'12px',color:'#7a9aaa' }}>
            Showing {students.length} student{students.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Manual Add Form ───────────────────────────────────────────────────────
function ManualForm({ batches, departments, onSuccess, onError }) {
  const [form,   setForm]   = useState({ student_id:'', full_name:'', batch_id:'', department_id:'' });
  const [loading,setLoading]= useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/enrollment', form);
      onSuccess();
      setForm({ student_id:'', full_name:'', batch_id:'', department_id:'' });
    } catch (err) {
      onError(err.response?.data?.message || 'Error adding student.');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'14px' }}>
        <div><label style={fieldLabel}>Student ID (JUW ID)</label><input style={fieldInput} placeholder="e.g. STU2025001" value={form.student_id} onChange={e=>set('student_id',e.target.value)} required/></div>
        <div><label style={fieldLabel}>Full Name</label><input style={fieldInput} placeholder="Ms. Fatima Khan" value={form.full_name} onChange={e=>set('full_name',e.target.value)} required/></div>
        <div><label style={fieldLabel}>Batch</label>
          <select style={fieldInput} required value={form.batch_id} onChange={e=>set('batch_id',e.target.value)}>
            <option value="">Select Batch</option>
            {batches.map(b=><option key={b.id} value={b.id}>{b.batch_name}</option>)}
          </select>
        </div>
        <div><label style={fieldLabel}>Department</label>
          <select style={fieldInput} value={form.department_id} onChange={e=>set('department_id',e.target.value)}>
            <option value="">Select Department</option>
            {departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </div>
      <button type="submit" style={addBtn} disabled={loading}>
        <Plus size={14}/> {loading ? 'Adding...' : 'Add Student'}
      </button>
    </form>
  );
}

// ── Bulk Upload ───────────────────────────────────────────────────────────
function BulkUpload({ batches, onSuccess, onError }) {
  const [batchId, setBatchId]   = useState('');
  const [file,    setFile]      = useState(null);
  const [loading, setLoading]   = useState(false);
  const [result,  setResult]    = useState(null);
  const [dragOver,setDragOver]  = useState(false);
  const fileRef = useRef();

  const ACCEPTED = '.csv,.xlsx,.xls';

  const handleFile = f => {
    if (!f) return;
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['csv','xlsx','xls'].includes(ext)) { onError('Only CSV, XLSX, or XLS files are supported.'); return; }
    setFile(f); setResult(null);
  };

  const handleDrop = e => {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const downloadTemplate = () => {
    const csv = 'student_id,full_name\nSTU2025001,Ms. Fatima Khan\nSTU2025002,Ms. Ayesha Ahmed\nSTU2025003,Ms. Zainab Hussain\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'students_template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!file)    { onError('Please select a file.'); return; }
    if (!batchId) { onError('Please select a batch.'); return; }
    setLoading(true); setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('batch_id', batchId);
      const res = await api.post('/enrollment/bulk', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(res.data);
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      onSuccess(`Enrolled ${res.data.enrolled} of ${res.data.total} students successfully.`);
    } catch (err) {
      onError(err.response?.data?.message || 'Upload failed.');
    } finally { setLoading(false); }
  };

  return (
    <div>
      {/* Instructions */}
      <div style={{ background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:'8px',padding:'12px 16px',marginBottom:'18px',fontSize:'12.5px',color:'#1e40af' }}>
        <strong>Supported formats:</strong> Excel (.xlsx, .xls) and CSV (.csv)<br/>
        <strong>Required columns:</strong> <code style={{ background:'#dbeafe',padding:'1px 6px',borderRadius:'4px' }}>student_id</code> and <code style={{ background:'#dbeafe',padding:'1px 6px',borderRadius:'4px' }}>full_name</code><br/>
        All enrolled students get the default password: <code style={{ background:'#dbeafe',padding:'1px 6px',borderRadius:'4px' }}>juw@2025</code>
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px' }}>
        {/* Left — controls */}
        <div>
          <div style={{ marginBottom:'14px' }}>
            <label style={fieldLabel}>Select Batch</label>
            <select style={fieldInput} value={batchId} onChange={e => setBatchId(e.target.value)}>
              <option value="">Select Batch</option>
              {batches.map(b => <option key={b.id} value={b.id}>{b.batch_name}</option>)}
            </select>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e=>{e.preventDefault();setDragOver(true);}}
            onDragLeave={()=>setDragOver(false)}
            onDrop={handleDrop}
            onClick={()=>fileRef.current?.click()}
            style={{
              border:`2px dashed ${dragOver?'#2d4a5a':'#c8d8e0'}`,borderRadius:'10px',
              padding:'28px 16px',textAlign:'center',cursor:'pointer',
              background:dragOver?'#f0f6fa':'#f8fafc',
              transition:'all 0.15s',marginBottom:'14px'
            }}>
            <FileSpreadsheet size={32} color={dragOver?'#2d4a5a':'#8fa5b0'} style={{ margin:'0 auto 10px' }}/>
            {file ? (
              <div>
                <div style={{ fontSize:'13px',fontWeight:'700',color:'#16a34a',marginBottom:'4px' }}>{file.name}</div>
                <div style={{ fontSize:'11px',color:'#7a9aaa' }}>{(file.size/1024).toFixed(1)} KB — click to change</div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize:'13px',fontWeight:'600',color:'#2d4a5a',marginBottom:'4px' }}>Drop your file here or click to browse</div>
                <div style={{ fontSize:'11px',color:'#8fa5b0' }}>Supports .xlsx, .xls, .csv — max 10MB</div>
              </div>
            )}
            <input ref={fileRef} type="file" accept={ACCEPTED} style={{ display:'none' }} onChange={e=>handleFile(e.target.files[0])} />
          </div>

          <div style={{ display:'flex',gap:'10px' }}>
            <button onClick={handleUpload} disabled={loading||!file||!batchId} style={{ ...addBtn,opacity:(!file||!batchId)?0.5:1,cursor:(!file||!batchId)?'not-allowed':'pointer' }}>
              <Upload size={14}/> {loading?'Uploading...':'Upload & Enroll'}
            </button>
            <button onClick={downloadTemplate} style={{ display:'flex',alignItems:'center',gap:'6px',padding:'8px 16px',border:'1px solid #dde3e8',borderRadius:'6px',fontSize:'12px',fontWeight:'600',cursor:'pointer',background:'white',color:'#2d4a5a',fontFamily:'inherit' }}>
              <Download size={14}/> Template
            </button>
          </div>
        </div>

        {/* Right — result + format guide */}
        <div>
          {result ? (
            <div style={{ background:'white',border:'0.5px solid #dde3e8',borderRadius:'10px',padding:'16px' }}>
              <div style={{ fontSize:'13px',fontWeight:'700',color:'#1a2e3a',marginBottom:'12px',display:'flex',alignItems:'center',gap:'7px' }}>
                <CheckCircle size={15} color="#16a34a"/> Upload Result
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px',marginBottom:'12px' }}>
                {[['Total Rows',result.total,'#2d4a5a'],['Enrolled',result.enrolled,'#16a34a'],['Skipped',result.skipped,'#d97706']].map(([l,v,c])=>(
                  <div key={l} style={{ background:'#f5f8fa',borderRadius:'8px',padding:'12px',textAlign:'center' }}>
                    <div style={{ fontSize:'22px',fontWeight:'800',color:c }}>{v}</div>
                    <div style={{ fontSize:'10px',color:'#7a9aaa',marginTop:'3px',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.5px' }}>{l}</div>
                  </div>
                ))}
              </div>
              {result.skippedList?.length>0&&(
                <div style={{ marginBottom:'10px' }}>
                  <div style={{ fontSize:'11px',fontWeight:'700',color:'#d97706',marginBottom:'5px' }}>Skipped (already exist):</div>
                  {result.skippedList.slice(0,5).map((s,i)=><div key={i} style={{ fontSize:'11px',color:'#7a9aaa',paddingLeft:'10px' }}>• {s}</div>)}
                  {result.skippedList.length>5&&<div style={{ fontSize:'11px',color:'#aabbc8',paddingLeft:'10px' }}>...and {result.skippedList.length-5} more</div>}
                </div>
              )}
              {result.errors?.length>0&&(
                <div>
                  <div style={{ fontSize:'11px',fontWeight:'700',color:'#dc2626',marginBottom:'5px' }}>Errors:</div>
                  {result.errors.slice(0,3).map((e,i)=><div key={i} style={{ fontSize:'11px',color:'#9b1c1c',paddingLeft:'10px' }}>• {e}</div>)}
                </div>
              )}
            </div>
          ) : (
            <div style={{ background:'#f8fafc',border:'0.5px solid #dde3e8',borderRadius:'10px',padding:'16px' }}>
              <div style={{ fontSize:'12px',fontWeight:'700',color:'#1a2e3a',marginBottom:'10px' }}>File Format Guide</div>
              {/* CSV example */}
              <div style={{ marginBottom:'14px' }}>
                <div style={{ fontSize:'10px',fontWeight:'700',color:'#5a7080',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.5px' }}>CSV Example</div>
                <pre style={{ background:'#1a2e3a',color:'#a8c8d8',borderRadius:'6px',padding:'10px 12px',fontSize:'11px',overflowX:'auto',lineHeight:'1.6' }}>{`student_id,full_name
STU2025001,Ms. Fatima Khan
STU2025002,Ms. Ayesha Ahmed
STU2025003,Ms. Zainab Hussain`}</pre>
              </div>
              {/* Excel example */}
              <div>
                <div style={{ fontSize:'10px',fontWeight:'700',color:'#5a7080',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.5px' }}>Excel (.xlsx) — Column Structure</div>
                <div style={{ border:'0.5px solid #dde3e8',borderRadius:'6px',overflow:'hidden' }}>
                  <table style={{ width:'100%',borderCollapse:'collapse',fontSize:'11px' }}>
                    <thead><tr style={{ background:'#2d4a5a',color:'white' }}>
                      <th style={{ padding:'6px 10px',textAlign:'left' }}>A — student_id</th>
                      <th style={{ padding:'6px 10px',textAlign:'left' }}>B — full_name</th>
                    </tr></thead>
                    <tbody>
                      {[['STU2025001','Ms. Fatima Khan'],['STU2025002','Ms. Ayesha Ahmed'],['STU2025003','Ms. Zainab Hussain']].map((r,i)=>(
                        <tr key={i} style={{ borderBottom:'0.5px solid #e8edf0' }}>
                          <td style={{ padding:'5px 10px',fontFamily:'monospace',color:'#2d4a5a' }}>{r[0]}</td>
                          <td style={{ padding:'5px 10px',color:'#1a2e3a' }}>{r[1]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}