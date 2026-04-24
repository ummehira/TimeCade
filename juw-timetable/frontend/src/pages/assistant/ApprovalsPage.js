// frontend/src/pages/assistant/ApprovalsPage.js
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, RefreshCw, AlertTriangle } from 'lucide-react';
import api   from '../../utils/api';
import Toast from '../../components/common/Toast';

export default function ApprovalsPage({ onCountChange }) {
  const [requests,  setRequests]  = useState([]);
  const [tab,       setTab]       = useState('pending');
  const [loading,   setLoading]   = useState(true);
  const [reviewing, setReviewing] = useState(null);
  const [note,      setNote]      = useState('');
  const [toast,     setToast]     = useState({ msg:'', type:'success' });

  const showToast = (msg, type='success') => setToast({ msg, type });

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/approvals');
      setRequests(res.data);
      onCountChange?.(res.data.filter(r => r.status==='pending').length);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = requests.filter(r => tab==='all' ? true : r.status===tab);

  const handleApprove = async id => {
    try {
      await api.post(`/approvals/${id}/approve`, { review_note: note });
      showToast('Request approved and applied.');
      setReviewing(null); setNote(''); load();
    } catch (err) { showToast(err.response?.data?.message||'Error.','error'); }
  };

  const handleReject = async id => {
    if (!note.trim()) { showToast('Rejection reason is required.','error'); return; }
    try {
      await api.post(`/approvals/${id}/reject`, { review_note: note });
      showToast('Request rejected.');
      setReviewing(null); setNote(''); load();
    } catch (err) { showToast(err.response?.data?.message||'Error.','error'); }
  };

  const StatusBadge = ({ status }) => {
    const map = { pending:'badge-warning', approved:'badge-success', rejected:'badge-danger' };
    return <span className={`badge ${map[status]}`}>{status.charAt(0).toUpperCase()+status.slice(1)}</span>;
  };

  return (
    <div className="page-content">
      <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ msg:'' })} />

      <div className="card">
        <div className="card-header">
          <h2><Clock size={15} /> Admin Change Requests</h2>
          <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
            <div style={{ display:'flex', gap:'2px', background:'var(--bg)', borderRadius:'8px', padding:'3px' }}>
              {['pending','approved','rejected','all'].map(t => (
                <button key={t} onClick={() => setTab(t)}
                  style={{ padding:'5px 12px', borderRadius:'5px', border:'none', fontFamily:'inherit',
                    background: tab===t?'white':'transparent', fontWeight: tab===t?'700':'400',
                    fontSize:'12px', cursor:'pointer', color: tab===t?'var(--primary)':'var(--text-secondary)',
                    boxShadow: tab===t?'var(--shadow-sm)':'none', textTransform:'capitalize' }}>
                  {t}
                </button>
              ))}
            </div>
            <button className="btn btn-secondary btn-sm" onClick={load}><RefreshCw size={12} /></button>
          </div>
        </div>
        <div className="card-body">
          {loading ? (
            <div style={{ textAlign:'center', padding:'40px' }}><div className="spinner" style={{ margin:'0 auto' }} /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <CheckCircle size={38} />
              <h3>No {tab} requests</h3>
              <p>{tab==='pending' ? 'All caught up! No pending changes from admins.' : `No ${tab} requests to display.`}</p>
            </div>
          ) : filtered.map(req => (
            <div className="request-card" key={req.id}>
              <div className="request-info" style={{ flex:1 }}>
                <h4>
                  <AlertTriangle size={13} color={req.status==='pending'?'#d97706':req.status==='approved'?'#16a34a':'#dc2626'} />
                  {req.request_type.charAt(0).toUpperCase()+req.request_type.slice(1)} {req.entity_type}
                  <StatusBadge status={req.status} />
                </h4>
                <p>By: <strong>{req.requested_by_name}</strong> ({req.requested_by_juw})</p>
                <p style={{ fontSize:'11px', color:'var(--text-muted)', marginTop:'3px' }}>
                  {new Date(req.created_at).toLocaleString()}
                </p>
                <details style={{ marginTop:'8px' }}>
                  <summary style={{ fontSize:'12px', cursor:'pointer', color:'var(--accent)' }}>View request data</summary>
                  <pre style={{ marginTop:'7px', background:'#f5f8fa', padding:'9px', borderRadius:'6px', fontSize:'11px', overflow:'auto', maxHeight:'110px' }}>
                    {JSON.stringify(req.request_data, null, 2)}
                  </pre>
                </details>
                {req.review_note && (
                  <div style={{ marginTop:'8px', padding:'8px 12px', background:'#f5f8fa', borderRadius:'6px', fontSize:'12px', color:'var(--text-secondary)' }}>
                    <strong>Note:</strong> {req.review_note}
                  </div>
                )}
              </div>

              {req.status === 'pending' && (
                <div style={{ display:'flex', flexDirection:'column', gap:'8px', minWidth:'200px' }}>
                  {reviewing === req.id ? (
                    <>
                      <textarea
                        placeholder="Review note (required for rejection)..."
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        style={{ width:'100%', padding:'8px', border:'1px solid var(--border)', borderRadius:'6px', fontSize:'12px', fontFamily:'inherit', resize:'vertical', minHeight:'58px' }}
                      />
                      <div style={{ display:'flex', gap:'6px' }}>
                        <button className="btn btn-success btn-sm" style={{ flex:1 }} onClick={() => handleApprove(req.id)}>
                          <CheckCircle size={11} /> Approve
                        </button>
                        <button className="btn btn-danger btn-sm" style={{ flex:1 }} onClick={() => handleReject(req.id)}>
                          <XCircle size={11} /> Reject
                        </button>
                      </div>
                      <button className="btn btn-secondary btn-sm" onClick={() => { setReviewing(null); setNote(''); }}>Cancel</button>
                    </>
                  ) : (
                    <button className="btn btn-primary btn-sm" onClick={() => setReviewing(req.id)}>
                      Review Request
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
