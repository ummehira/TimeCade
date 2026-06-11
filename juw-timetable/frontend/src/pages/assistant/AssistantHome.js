// frontend/src/pages/assistant/AssistantHome.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useResponsive } from '../../hooks/useResponsive';
import api from '../../utils/api';



export default function AssistantHome() {
  const { user }     = useAuth();
  const { isMobile } = useResponsive();
  const navigate     = useNavigate();

  const [stats,   setStats]   = useState({ totalBatches:0, totalTeachers:0, totalRooms:0, totalClasses:0 });
  const [pending, setPending] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  useEffect(() => {
    Promise.all([
      api.get('/office/stats').catch(() => ({ data:{ totalBatches:0, totalTeachers:0, totalRooms:0, totalClasses:0 } })),
      api.get('/approvals/pending').catch(() => ({ data:[] })),
      api.get('/timetable').catch(() => ({ data:[] })),
    ]).then(([s, ap, tt]) => {
      setStats(s.data);
      setPending((ap.data || []).slice(0, 3));
      setEntries(tt.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const today  = new Date().toLocaleDateString('en-US', { weekday:'long' });
  const greeting = () => {
    const h = now.getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const typeColor = t => ({ create:'#16a34a', update:'#d97706', delete:'#dc2626' }[t] || '#5a7080');
  const typeLabel = t => ({ create:'Add class', update:'Reschedule', delete:'Remove' }[t] || t);

  const STAT_CARDS = [
    { label:'Batches',  value: stats.totalBatches,  bg:'#2d4a5a' },
    { label:'Teachers', value: stats.totalTeachers, bg:'#3a6070' },
    { label:'Rooms',    value: stats.totalRooms,    bg:'#1a7a8a' },
    { label:'Classes',  value: stats.totalClasses,  bg:'#2E6478' },
  ];
  return (
    <div style={{
      padding: isMobile ? '10px' : '14px 18px',
      height: 'calc(100vh - 56px)',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      boxSizing: 'border-box',
      overflow: 'hidden',
    }}>

      {/* ── Welcome banner ── */}
      <div style={{ background:'linear-gradient(135deg,#2d4a5a,#3a6070)', borderRadius:'10px', padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px', flexShrink:0, boxShadow:'0 2px 10px rgba(45,74,90,0.15)' }}>
        <div>
          <div style={{ fontSize:'15px', fontWeight:'700', color:'white' }}>
            {greeting()}, {user?.full_name?.split(' ').slice(0,2).join(' ')}!
          </div>
          <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.55)', marginTop:'2px' }}>
            {today} · CS &amp; SE Department
            {pending.length > 0 && ` · ${pending.length} request${pending.length > 1 ? 's' : ''} pending`}
          </div>
        </div>
        {pending.length > 0 && (
          <button onClick={() => navigate('/assistant/office')}
            style={{ background:'rgba(255,255,255,0.14)', border:'1px solid rgba(255,255,255,0.28)', color:'white', borderRadius:'7px', padding:'6px 14px', fontSize:'12px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
            Review now →
          </button>
        )}
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:'10px', flexShrink:0 }}>
        {STAT_CARDS.map(({ label, value, bg }) => (
          <div key={label} style={{ background: bg, borderRadius:'10px', padding:'12px 16px', boxShadow:'0 2px 8px rgba(0,0,0,0.10)' }}>
            <div style={{ fontSize:'9px', color:'rgba(255,255,255,0.5)', marginBottom:'6px', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.6px' }}>{label}</div>
            <div style={{ fontSize:'28px', fontWeight:'800', color:'white', lineHeight:1 }}>
              {loading ? '—' : value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Quick Actions 2×3 grid ── */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(3,1fr)', gap:'10px', flexShrink:0 }}>
        {[
          {
            label: 'Add Class',
            sub: 'Schedule new session',
            icon: (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/>
              </svg>
            ),
            iconBg: '#e8f0fa',
            border: '0.5px solid #d8e4f0',
            onClick: () => navigate('/assistant/office'),
          },
          {
            label: 'Reschedule',
            sub: 'Move a class slot',
            icon: (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/>
              </svg>
            ),
            iconBg: '#e8f0fa',
            border: '0.5px solid #d8e4f0',
            onClick: () => navigate('/assistant/office'),
          },
          {
            label: 'Approvals',
            sub: pending.length > 0 ? `${pending.length} pending review` : 'All caught up',
            badge: pending.length > 0 ? pending.length : null,
            icon: (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={pending.length > 0 ? '#92600a' : '#1e3a5f'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
            ),
            iconBg: pending.length > 0 ? '#fef9ee' : '#e8f0fa',
            border: pending.length > 0 ? '0.5px solid #fbbf24' : '0.5px solid #d8e4f0',
            onClick: () => navigate('/assistant/office'),
          },
          {
            label: 'Timetable',
            sub: 'View full schedule',
            icon: (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/>
              </svg>
            ),
            iconBg: '#e8f0fa',
            border: '0.5px solid #d8e4f0',
            onClick: () => navigate('/assistant/timetable'),
          },
          {
            label: 'Conflicts',
            sub: (() => { const c = entries.filter(e => e.conflict).length; return c > 0 ? `${c} need fixing` : 'No conflicts'; })(),
            badge: (() => { const c = entries.filter(e => e.conflict).length; return c > 0 ? c : null; })(),
            icon: (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            ),
            iconBg: '#fef2f2',
            border: '0.5px solid #fecaca',
            onClick: () => navigate('/assistant/timetable'),
          },
          {
            label: 'Office Management',
            sub: 'Rooms, batches, teachers',
            icon: (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            ),
            iconBg: '#e8f0fa',
            border: '0.5px solid #d8e4f0',
            onClick: () => navigate('/assistant/office'),
          },
        ].map(({ label, sub, icon, iconBg, border, badge, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            style={{
              background: 'white',
              borderRadius: '10px',
              border,
              padding: '20px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              textAlign: 'center',
              fontFamily: 'inherit',
              position: 'relative',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(30,58,95,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            {badge && (
              <span style={{ position:'absolute', top:'10px', right:'10px', background:'#ef4444', color:'white', fontSize:'9px', fontWeight:'700', padding:'1px 6px', borderRadius:'8px' }}>
                {badge}
              </span>
            )}
            <div style={{ width:'52px', height:'52px', borderRadius:'14px', background:iconBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              {icon}
            </div>
            <div>
              <div style={{ fontSize:'12px', fontWeight:'700', color:'#1a2e3a' }}>{label}</div>
              <div style={{ fontSize:'10px', color: label === 'Conflicts' && badge ? '#dc2626' : '#8aa0ba', marginTop:'3px' }}>{sub}</div>
            </div>
          </button>
        ))}
      </div>

      {/* ── Pending approvals ── */}
      <div style={{ background:'white', borderRadius:'10px', border:'1px solid #e0e8ed', overflow:'hidden', flexShrink:0, boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ padding:'10px 16px', borderBottom:'1px solid #e8edf0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontSize:'12px', fontWeight:'700', color:'#1a2e3a', display:'flex', alignItems:'center', gap:'8px' }}>
            Pending approvals
            {!loading && pending.length > 0 && (
              <span style={{ background:'#ef4444', color:'white', fontSize:'9px', fontWeight:'700', borderRadius:'10px', padding:'1px 7px' }}>{pending.length}</span>
            )}
          </div>
          <button onClick={() => navigate('/assistant/office')}
            style={{ background:'transparent', border:'1px solid #2d4a5a', color:'#2d4a5a', borderRadius:'6px', padding:'4px 12px', fontSize:'11px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit' }}>
            View all
          </button>
        </div>
        {loading
          ? <div style={{ padding:'16px', textAlign:'center', color:'#aabbc8', fontSize:'12px' }}>Loading...</div>
          : pending.length === 0
            ? <div style={{ padding:'14px 16px', textAlign:'center', color:'#aabbc8', fontSize:'12px' }}>All caught up — no pending requests.</div>
            : <div style={{ display:'flex', flexDirection: isMobile ? 'column' : 'row' }}>
                {pending.map((req, i) => (
                  <div key={req.id} style={{ flex:1, display:'flex', alignItems:'center', gap:'10px', padding:'10px 16px', borderRight: !isMobile && i < pending.length - 1 ? '1px solid #f0f4f7' : 'none', borderBottom: isMobile && i < pending.length - 1 ? '1px solid #f0f4f7' : 'none' }}>
                    <div style={{ width:'8px', height:'8px', borderRadius:'50%', background: typeColor(req.request_type), flexShrink:0 }}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:'11px', fontWeight:'600', color:'#1a2e3a', display:'flex', alignItems:'center', gap:'6px', flexWrap:'wrap' }}>
                        <span style={{ background: typeColor(req.request_type)+'18', color: typeColor(req.request_type), borderRadius:'4px', padding:'1px 6px', fontSize:'9px', fontWeight:'700' }}>{typeLabel(req.request_type)}</span>
                        {req.requested_by_name}
                      </div>
                      <div style={{ fontSize:'10px', color:'#7a9aaa', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:'2px' }}>
                        {req.request_data?.subject_name || req.request_data?.old_subject_name || '—'}
                        {req.request_data?.day ? ` · ${req.request_data.day}` : ''}
                      </div>
                    </div>
                    <div style={{ fontSize:'10px', color:'#aabbc8', whiteSpace:'nowrap' }}>
                      {new Date(req.created_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
        }
      </div>
    </div>
  );
}