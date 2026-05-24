// frontend/src/pages/assistant/AssistantHome.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useResponsive } from '../../hooks/useResponsive';
import api from '../../utils/api';

const DAYS       = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DAYS_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS     = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function getMiniCal(year, month) {
  const first = new Date(year, month, 1).getDay();
  const days  = new Date(year, month + 1, 0).getDate();
  return { first, days };
}

export default function AssistantHome() {
  const { user }     = useAuth();
  const { isMobile } = useResponsive();
  const navigate     = useNavigate();

  const [stats,   setStats]   = useState({ totalBatches:0, totalTeachers:0, totalRooms:0, totalClasses:0 });
  const [pending, setPending] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [calYear,  setCalYear]  = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

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
  const todayD = now.getDate();
  const todayM = now.getMonth();
  const todayY = now.getFullYear();

  const greeting = () => {
    const h = now.getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const dayCounts = DAYS.map((d, i) => ({
    day:   DAYS_SHORT[i],
    full:  d,
    count: entries.filter(e => e.day === d).length,
  }));
  const maxCount = Math.max(...dayCounts.map(d => d.count), 1);

  const { first, days } = getMiniCal(calYear, calMonth);
  const calStart   = first === 0 ? 6 : first - 1;
  const totalCells = Math.ceil((calStart + days) / 7) * 7;

  const dayIdx    = { Monday:0, Tuesday:1, Wednesday:2, Thursday:3, Friday:4, Saturday:5, Sunday:6 };
  const activeDows = new Set(entries.map(e => dayIdx[e.day]).filter(v => v !== undefined));

  const typeColor = t => ({ create:'#16a34a', update:'#d97706', delete:'#dc2626' }[t] || '#5a7080');
  const typeLabel = t => ({ create:'Add class', update:'Reschedule', delete:'Remove' }[t] || t);

  const STAT_CARDS = [
    { label:'Batches',  value: stats.totalBatches,  bg:'#2d4a5a' },
    { label:'Teachers', value: stats.totalTeachers, bg:'#3a6070' },
    { label:'Rooms',    value: stats.totalRooms,    bg:'#1a7a8a' },
    { label:'Classes',  value: stats.totalClasses,  bg:'#2E6478' },
  ];

  const prevMonth = () => { if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1);}else setCalMonth(m=>m-1); };
  const nextMonth = () => { if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1);}else setCalMonth(m=>m+1); };

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

      {/* ── Middle: bar chart + calendar ── */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:'10px', flex:1, minHeight:0 }}>

        {/* Bar chart */}
        <div style={{ background:'white', borderRadius:'10px', border:'1px solid #e0e8ed', padding:'14px 16px', display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px', flexShrink:0 }}>
            <div style={{ fontSize:'12px', fontWeight:'700', color:'#1a2e3a' }}>Classes per day</div>
            <div style={{ fontSize:'10px', color:'#7a9aaa', background:'#f0f4f7', borderRadius:'5px', padding:'2px 8px' }}>{entries.length} total</div>
          </div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:'6px', flex:1, minHeight:0 }}>
            {dayCounts.map(({ day, full, count }) => {
              const isToday = full === today;
              const pct     = count === 0 ? 5 : Math.round((count / maxCount) * 90);
              return (
                <div key={day} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px', height:'100%', justifyContent:'flex-end' }}>
                  <div style={{ fontSize:'10px', color: isToday ? '#2d4a5a' : '#aabbc8', fontWeight: isToday ? '700' : '400', minHeight:'13px' }}>
                    {count > 0 ? count : ''}
                  </div>
                  <div style={{ width:'100%', background: count === 0 ? '#f0f4f7' : (isToday ? '#2d4a5a' : '#3a6070'), borderRadius:'4px 4px 0 0', height:`${pct}%`, minHeight:'4px', transition:'height 0.3s' }}/>
                  <div style={{ fontSize:'10px', color: isToday ? '#2d4a5a' : '#7a9aaa', fontWeight: isToday ? '700' : '500' }}>{day}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display:'flex', gap:'12px', marginTop:'8px', paddingTop:'8px', borderTop:'1px solid #f0f4f7', flexShrink:0 }}>
            {[['#2d4a5a','Today'],['#3a6070','Other'],['#f0f4f7','No class']].map(([c,l])=>(
              <div key={l} style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'10px', color:'#7a9aaa' }}>
                <div style={{ width:'8px', height:'8px', borderRadius:'2px', background:c, border: c==='#f0f4f7'?'1px solid #e0e8ed':'none' }}/>
                {l}
              </div>
            ))}
          </div>
        </div>

        {/* ── Calendar (FIXED) ── */}
        <div style={{ background:'white', borderRadius:'10px', border:'1px solid #e0e8ed', padding:'14px 16px', display:'flex', flexDirection:'column', overflow:'hidden', minHeight:0 }}>
          {/* Month nav */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px', flexShrink:0 }}>
            <div style={{ fontSize:'13px', fontWeight:'700', color:'#1a2e3a' }}>{MONTHS[calMonth]} {calYear}</div>
            <div style={{ display:'flex', gap:'3px' }}>
              <button onClick={prevMonth} style={{ background:'#2d4a5a', border:'none', borderRadius:'5px', width:'26px', height:'26px', cursor:'pointer', color:'white', fontSize:'14px', fontWeight:'700', display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
              <button onClick={() => { setCalMonth(todayM); setCalYear(todayY); }} style={{ background:'#2d4a5a', border:'none', borderRadius:'5px', padding:'0 10px', height:'26px', cursor:'pointer', fontSize:'10px', fontWeight:'600', color:'white', fontFamily:'inherit' }}>Today</button>
              <button onClick={nextMonth} style={{ background:'#2d4a5a', border:'none', borderRadius:'5px', width:'26px', height:'26px', cursor:'pointer', color:'white', fontSize:'14px', fontWeight:'700', display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
            </div>
          </div>

          {/* Day headers */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'3px', marginBottom:'4px', flexShrink:0 }}>
            {['Mo','Tu','We','Th','Fr','Sa','Su'].map((d,i) => (
              <div key={d} style={{
                textAlign:'center', fontSize:'10px', fontWeight:'700',
                color: i===5 ? '#1a7a8a' : i===6 ? '#aabbc8' : '#2d4a5a',
                padding:'4px 0',
                background: i < 6 ? '#f0f6fa' : '#f8fafc',
                borderRadius:'4px',
              }}>{d}</div>
            ))}
          </div>

          {/* Day cells — FIXED: flex:1 + minHeight:0 + gridAutoRows:1fr removes overflow */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7,1fr)',
            gridAutoRows: '1fr',   // ← each row gets equal share of available height
            gap: '3px',
            flex: 1,
            minHeight: 0,          // ← lets the grid shrink inside the flex container
            overflow: 'hidden',
          }}>
            {Array.from({ length: totalCells }).map((_, i) => {
              const dayNum     = i - calStart + 1;
              const valid      = dayNum >= 1 && dayNum <= days;
              const isToday    = valid && dayNum === todayD && calMonth === todayM && calYear === todayY;
              const dow        = i % 7; // 0=Mon
              const hasClasses = valid && activeDows.has(dow) && dow < 6;
              const isSun      = dow === 6;
              const isSat      = dow === 5;

              let bg = 'transparent';
              let color = '#1a2e3a';
              let fontWeight = '500';

              if (isToday)            { bg = '#2d4a5a';  color = 'white';   fontWeight = '700'; }
              else if (hasClasses)    { bg = '#e8f4fd';  color = '#1a5a7a'; fontWeight = '600'; }
              else if (isSat && valid){ bg = '#f0faf8';  color = '#1a7a8a'; fontWeight = '600'; }

              return (
                <div key={i} style={{
                  borderRadius: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: bg,
                  opacity: !valid || isSun ? 0.18 : 1,
                  border: hasClasses && !isToday ? '1px solid #b8d9f5' : isToday ? 'none' : '1px solid transparent',
                  // aspectRatio removed — cells fill grid rows naturally
                }}>
                  <span style={{ fontSize:'12px', fontWeight, color, lineHeight:1 }}>
                    {valid ? dayNum : ''}
                  </span>
                  {hasClasses && !isToday && (
                    <div style={{ width:'4px', height:'4px', borderRadius:'50%', background:'#2d4a5a', marginTop:'2px' }}/>
                  )}
                  {isToday && (
                    <div style={{ width:'4px', height:'4px', borderRadius:'50%', background:'rgba(255,255,255,0.6)', marginTop:'2px' }}/>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display:'flex', gap:'14px', marginTop:'8px', paddingTop:'8px', borderTop:'1px solid #f0f4f7', flexShrink:0 }}>
            {[
              { c:'#2d4a5a', l:'Today',        dot:false },
              { c:'#e8f4fd', l:'Has classes',  dot:true,  border:'#b8d9f5', tc:'#1a5a7a' },
              { c:'#f0faf8', l:'Saturday',     dot:false, border:'#b8d9f5', tc:'#1a7a8a' },
            ].map(({ c, l, dot, border, tc }) => (
              <div key={l} style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'10px', color:'#7a9aaa' }}>
                <div style={{ width:'12px', height:'12px', borderRadius:'3px', background:c, border: border ? `1px solid ${border}` : 'none', flexShrink:0 }}/>
                <span style={{ color: tc||'#7a9aaa' }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
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