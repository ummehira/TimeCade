// frontend/src/pages/assistant/AssistantHome.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useResponsive } from '../../hooks/useResponsive';
import api from '../../utils/api';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export default function AssistantHome() {
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  const navigate = useNavigate();

  const [stats,   setStats]   = useState({ totalBatches:0, totalTeachers:0, totalRooms:0, totalClasses:0 });
  const [rooms,   setRooms]   = useState([]);
  const [pending, setPending] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/office/stats').catch(() => ({ data:{ totalBatches:0, totalTeachers:0, totalRooms:0, totalClasses:0 } })),
      api.get('/office/rooms').catch(() => ({ data:[] })),
      api.get('/approvals/pending').catch(() => ({ data:[] })),
      api.get('/timetable').catch(() => ({ data:[] })),
    ]).then(([s, r, ap, tt]) => {
      setStats(s.data);
      setRooms((r.data || []).slice(0, 8));
      setPending((ap.data || []).slice(0, 4));
      setEntries(tt.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString('en-US', { weekday:'long' });
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Classes per day for bar chart
  const dayCounts = DAYS.map(d => ({
    day: d.slice(0,3),
    full: d,
    count: entries.filter(e => e.day === d).length,
  }));
  const maxCount = Math.max(...dayCounts.map(d => d.count), 1);

  const typeColor = t => ({ create:'#16a34a', update:'#d97706', delete:'#dc2626' }[t] || '#5a7080');
  const typeLabel = t => ({ create:'Add class', update:'Reschedule', delete:'Remove' }[t] || t);

  const STAT_CARDS = [
    { label:'Total batches',    value: stats.totalBatches,  bg:'#2d4a5a' },
    { label:'Teachers',         value: stats.totalTeachers, bg:'#3a6070' },
    { label:'Classrooms',       value: stats.totalRooms,    bg:'#1a7a8a' },
    { label:'Scheduled classes',value: stats.totalClasses,  bg: pending.length > 0 ? '#2E6478' : '#2d6070' },
  ];

  return (
    <div className="page-content" style={{ padding: isMobile ? '12px' : '20px', maxWidth:'100%' }}>

      {/* ── Welcome banner ── */}
      <div style={{ background:'#2d4a5a', borderRadius:'12px', padding: isMobile ? '14px 16px' : '18px 24px', marginBottom:'14px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px', flexWrap:'wrap' }}>
        <div>
          <div style={{ fontSize: isMobile ? '14px' : '16px', fontWeight:'700', color:'white' }}>
            {greeting()}, {user?.full_name?.split(' ').slice(0,2).join(' ')}!
          </div>
          <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.55)', marginTop:'4px' }}>
            {today} · CS &amp; SE Department
            {pending.length > 0 && ` · ${pending.length} request${pending.length > 1 ? 's' : ''} pending review`}
          </div>
        </div>
        {pending.length > 0 && (
          <button onClick={() => navigate('/assistant/office')}
            style={{ background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.22)', color:'white', borderRadius:'8px', padding:'7px 16px', fontSize:'12px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
            Review now
          </button>
        )}
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:'10px', marginBottom:'14px' }}>
        {STAT_CARDS.map(({ label, value, bg }) => (
          <div key={label} style={{ background: bg, borderRadius:'12px', padding: isMobile ? '14px' : '16px 20px' }}>
            <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.55)', marginBottom:'6px', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</div>
            <div style={{ fontSize: isMobile ? '26px' : '30px', fontWeight:'800', color:'white', lineHeight:1 }}>
              {loading ? '—' : value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Bar chart + Room availability ── */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:'12px', marginBottom:'12px' }}>

        {/* Weekly bar chart */}
        <div style={{ background:'white', borderRadius:'12px', border:'1px solid #e0e8ed', padding:'16px 18px' }}>
          <div style={{ fontSize:'13px', fontWeight:'700', color:'#1a2e3a', marginBottom:'16px' }}>Classes per day this week</div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:'6px', height:'90px' }}>
            {dayCounts.map(({ day, full, count }) => {
              const isToday = full === today;
              const barH = count === 0 ? 4 : Math.round((count / maxCount) * 70);
              return (
                <div key={day} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px', justifyContent:'flex-end', height:'100%' }}>
                  <div style={{ fontSize:'10px', color: isToday ? '#2d4a5a' : '#aabbc8', fontWeight: isToday ? '700' : '400', minHeight:'14px' }}>{count > 0 ? count : ''}</div>
                  <div style={{ width:'100%', background: count === 0 ? '#e8edf0' : (isToday ? '#2d4a5a' : '#3a6070'), borderRadius:'3px 3px 0 0', height:`${barH}px`, minHeight:'4px' }}/>
                  <div style={{ fontSize:'10px', color: isToday ? '#2d4a5a' : '#7a9aaa', fontWeight: isToday ? '700' : '400' }}>{day}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Room availability */}
        <div style={{ background:'white', borderRadius:'12px', border:'1px solid #e0e8ed', padding:'16px 18px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
            <div style={{ fontSize:'13px', fontWeight:'700', color:'#1a2e3a' }}>Room availability</div>
            {!loading && <div style={{ fontSize:'11px', color:'#7a9aaa' }}>{rooms.filter(r => r.is_available).length} of {rooms.length} free</div>}
          </div>
          {loading
            ? <div style={{ textAlign:'center', padding:'20px', color:'#aabbc8', fontSize:'12px' }}>Loading...</div>
            : rooms.length === 0
              ? <div style={{ textAlign:'center', padding:'20px', color:'#aabbc8', fontSize:'12px' }}>No rooms found</div>
              : <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'6px' }}>
                  {rooms.map(r => (
                    <div key={r.id} style={{ padding:'8px 4px', borderRadius:'8px', textAlign:'center', background: r.is_available ? '#dcfce7' : '#fef2f2', border:`1px solid ${r.is_available ? '#86efac' : '#fecaca'}` }}>
                      <div style={{ fontSize:'11px', fontWeight:'700', color: r.is_available ? '#166534' : '#9b1c1c' }}>{r.room_id}</div>
                      <div style={{ fontSize:'9px', marginTop:'2px', color: r.is_available ? '#16a34a' : '#dc2626', fontWeight:'600' }}>{r.is_available ? 'Free' : 'Busy'}</div>
                    </div>
                  ))}
                </div>
          }
        </div>
      </div>

      {/* ── Pending approvals feed ── */}
      <div style={{ background:'white', borderRadius:'12px', border:'1px solid #e0e8ed', overflow:'hidden' }}>
        <div style={{ padding:'13px 18px', borderBottom:'1px solid #e8edf0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontSize:'13px', fontWeight:'700', color:'#1a2e3a', display:'flex', alignItems:'center', gap:'8px' }}>
            Pending approvals
            {!loading && pending.length > 0 && (
              <span style={{ background:'#ef4444', color:'white', fontSize:'10px', fontWeight:'700', borderRadius:'10px', padding:'1px 8px' }}>{pending.length}</span>
            )}
          </div>
          <button onClick={() => navigate('/assistant/office')}
            style={{ background:'transparent', border:'1px solid #2d4a5a', color:'#2d4a5a', borderRadius:'7px', padding:'5px 14px', fontSize:'11px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit' }}>
            View all
          </button>
        </div>

        {loading
          ? <div style={{ padding:'28px', textAlign:'center', color:'#aabbc8', fontSize:'12px' }}>Loading...</div>
          : pending.length === 0
            ? <div style={{ padding:'28px', textAlign:'center', color:'#aabbc8' }}>
                <div style={{ fontSize:'13px', fontWeight:'600', marginBottom:'4px' }}>All caught up</div>
                <div style={{ fontSize:'12px' }}>No pending approval requests.</div>
              </div>
            : <div>
                {pending.map((req, i) => (
                  <div key={req.id} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 18px', borderBottom: i < pending.length - 1 ? '1px solid #f0f4f7' : 'none' }}>
                    <div style={{ width:'8px', height:'8px', borderRadius:'50%', background: typeColor(req.request_type), flexShrink:0 }}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:'12px', fontWeight:'600', color:'#1a2e3a', marginBottom:'2px' }}>
                        <span style={{ background: typeColor(req.request_type)+'18', color: typeColor(req.request_type), borderRadius:'4px', padding:'1px 7px', fontSize:'10px', fontWeight:'700', marginRight:'7px' }}>{typeLabel(req.request_type)}</span>
                        {req.requested_by_name}
                      </div>
                      <div style={{ fontSize:'11px', color:'#7a9aaa', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {req.request_data?.subject_name || req.request_data?.old_subject_name || '—'}
                        {req.request_data?.day ? ` · ${req.request_data.day}` : ''}
                        {req.request_data?.slot_label ? ` · ${req.request_data.slot_label}` : ''}
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