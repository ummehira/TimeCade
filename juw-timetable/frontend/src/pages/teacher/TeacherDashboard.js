// frontend/src/pages/teacher/TeacherDashboard.js
import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { LayoutDashboard, Calendar, LogOut, Clock, BookOpen, Users, Building2, Settings } from 'lucide-react';
import ProfileModal from '../../components/common/ProfileModal';
import { useResponsive } from '../../hooks/useResponsive';
import NotificationBell from '../../components/common/NotificationBell';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import TopHeader from '../../components/common/TopHeader';

const DAYS  = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const SLOTS = [
  { id:1, label:'9:00 - 10:00'  },
  { id:2, label:'10:00 - 11:00' },
  { id:3, label:'11:00 - 12:00' },
  { id:4, label:'12:00 - 1:00'  },
  { id:5, label:'1:00 - 2:00'   },
];

const cellStyle = (isLab) => ({
  background: isLab ? '#1a6e4a' : '#2d4a5a',
  borderRadius:'5px', padding:'5px 7px', color:'white',
  fontSize:'10px', lineHeight:'1.3', height:'100%', boxSizing:'border-box'
});

// ── Sidebar ───────────────────────────────────────────────────────────────
function TeacherSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isMobile } = useResponsive();
  const initials = user?.full_name?.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase() || 'T';
  const NAV = [
    { to:'/teacher',               label:'Dashboard',      icon:LayoutDashboard, exact:true },
    { to:'/teacher/schedule',      label:'My Schedule',    icon:Calendar },
    { to:'/teacher/all-batches',   label:'Batch Timetable',icon:Users },
    { to:'/teacher/all-rooms',     label:'Room Status',    icon:Building2 },
  ];
  return (
    <>
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div onClick={()=>setSidebarOpen(false)}
          style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:99 }}/>
      )}
      {/* Mobile hamburger button */}
      {isMobile && (
        <button onClick={()=>setSidebarOpen(o=>!o)}
          style={{ position:'fixed',top:'12px',left:'12px',zIndex:200,background:'#f0f4f7',
            border:'none',cursor:'pointer',color:'#2d4a5a',padding:'7px',borderRadius:'8px',
            display:'flex',alignItems:'center',justifyContent:'center',
            boxShadow:'0 2px 8px rgba(0,0,0,0.12)' }}>
          <Menu size={20}/>
        </button>
      )}
      <aside style={{ width:'210px',background:'#2d4a5a',display:'flex',flexDirection:'column',
        position:'fixed',top:0,left:0,height:'100vh',zIndex:100,
        boxShadow:'2px 0 12px rgba(0,0,0,0.15)',
        transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-210px)') : 'translateX(0)',
        transition:'transform 0.28s cubic-bezier(0.4,0,0.2,1)' }}>
        <div style={{ padding:'16px 14px',borderBottom:'1px solid rgba(255,255,255,0.08)',display:'flex',flexDirection:'column',alignItems:'center' }}>
          <div style={{ width:'44px',height:'44px',background:'rgba(255,255,255,0.15)',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px',fontWeight:'800',color:'white',margin:'0 auto 8px' }}>T</div>
          <div style={{ color:'white',fontSize:'14px',fontWeight:'700',textAlign:'center',lineHeight:1 }}>Timecade</div>
          <div style={{ color:'rgba(255,255,255,0.45)',fontSize:'10px',marginTop:'3px',textAlign:'center' }}>CS & SE Department</div>
        </div>
        <nav style={{ flex:1,padding:'10px 8px',overflowY:'auto' }}>
          {NAV.map(({ to, label, icon:Icon, exact }) => (
            <NavLink key={to} to={to} end={!!exact}
              style={({ isActive }) => ({
                display:'flex',alignItems:'center',gap:'9px',padding:'9px 12px',
                color:isActive?'white':'rgba(255,255,255,0.6)',textDecoration:'none',
                fontSize:'12.5px',fontWeight:isActive?'600':'400',borderRadius:'7px',
                marginBottom:'2px',background:isActive?'rgba(255,255,255,0.12)':'transparent',
                transition:'all 0.15s'
              })}>
              <Icon size={15}/>{label}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding:'12px 10px',borderTop:'1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display:'flex',alignItems:'center',gap:'8px',marginBottom:'9px' }}>
            <div style={{ width:'30px',height:'30px',borderRadius:'50%',background:'rgba(255,255,255,0.18)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:'700',color:'white',flexShrink:0 }}>{initials}</div>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ color:'white',fontSize:'11px',fontWeight:'600',lineHeight:1.3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{user?.full_name?.split(' ').slice(0,3).join(' ')}</div>
              <div style={{ color:'rgba(255,255,255,0.45)',fontSize:'9px',marginTop:'2px' }}>Teacher</div>
            </div>
            <button onClick={()=>setShowProfile(true)} title="Profile Settings"
              style={{ background:'rgba(255,255,255,0.12)',border:'1px solid rgba(255,255,255,0.2)',color:'white',borderRadius:'6px',width:'28px',height:'28px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0 }}>
              <Settings size={13}/>
            </button>
          </div>
          <button onClick={()=>{ logout(); navigate('/login'); }}
            style={{ width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',background:'#b91c1c',color:'white',border:'none',borderRadius:'6px',padding:'8px',fontSize:'12px',fontWeight:'600',cursor:'pointer',fontFamily:'inherit' }}>
            <LogOut size={13}/> Logout
          </button>
        </div>
        {showProfile && <ProfileModal onClose={()=>setShowProfile(false)}/>}
      </aside>
    </>
  );
}

// ── Reschedule Modal ──────────────────────────────────────────────────────
function RescheduleModal({ entry, onClose, onSubmit }) {
  const [day,setDay]         = useState(entry.day);
  const [slot,setSlot]       = useState(entry.time_slot);
  const [note,setNote]       = useState('');
  const [loading,setLoading] = useState(false);
  const [error,setError]     = useState('');

  const handleSubmit = async () => {
    setError(''); setLoading(true);
    try { await onSubmit(entry, day, parseInt(slot), note); onClose(); }
    catch (e) { setError(e.message || 'Failed to submit'); }
    finally { setLoading(false); }
  };

  const fl = { fontSize:'11px',fontWeight:'700',color:'#5a7080',textTransform:'uppercase',letterSpacing:'0.5px',display:'block',marginBottom:'6px' };
  const fi = { width:'100%',padding:'8px 10px',border:'1px solid #dde3e8',borderRadius:'6px',fontSize:'12px',fontFamily:'inherit',outline:'none',color:'#1a2e3a' };

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9000,padding:'20px' }}>
      <div style={{ background:'white',borderRadius:'14px',maxWidth:'460px',width:'100%',overflow:'hidden',boxShadow:'0 20px 50px rgba(0,0,0,0.2)' }}>
        <div style={{ background:'#2d4a5a',padding:'14px 20px',color:'white' }}>
          <div style={{ fontSize:'15px',fontWeight:'700' }}>Request Reschedule</div>
          <div style={{ fontSize:'11px',opacity:0.7,marginTop:'2px' }}>Sent to Office Assistant for approval</div>
        </div>
        <div style={{ padding:'18px 20px' }}>
          <div style={{ background:'#f8fafc',border:'1px solid #e8edf0',borderRadius:'8px',padding:'10px 14px',marginBottom:'16px' }}>
            <div style={{ fontSize:'11px',fontWeight:'700',color:'#5a7080',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.5px' }}>Current Schedule</div>
            <div style={{ fontSize:'13px',fontWeight:'700',color:'#1a2e3a',marginBottom:'4px' }}>{entry.subject_name}</div>
            <div style={{ display:'flex',gap:'16px',fontSize:'12px',color:'#5a7080' }}>
              <span>{entry.day}</span><span>{entry.slot_label}</span><span>{entry.room_code||entry.room_id}</span>
            </div>
          </div>
          <div style={{ marginBottom:'12px' }}><label style={fl}>New Day</label>
            <select value={day} onChange={e=>setDay(e.target.value)} style={fi}>
              {DAYS.map(d=><option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div style={{ marginBottom:'14px' }}><label style={fl}>New Time</label>
            <select value={slot} onChange={e=>setSlot(e.target.value)} style={fi}>
              {SLOTS.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div style={{ marginBottom:'14px' }}><label style={fl}>Reason (optional)</label>
            <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="e.g. Departmental meeting conflict..."
              style={{ ...fi,resize:'vertical',minHeight:'60px' }}/>
          </div>
          {error&&<div style={{ background:'#fef2f2',border:'1px solid #fecaca',borderRadius:'6px',padding:'8px 12px',fontSize:'12px',color:'#dc2626',marginBottom:'12px' }}>{error}</div>}
          <div style={{ display:'flex',gap:'10px' }}>
            <button onClick={handleSubmit} disabled={loading}
              style={{ flex:1,background:'#2d4a5a',color:'white',border:'none',padding:'10px',borderRadius:'7px',fontSize:'13px',fontWeight:'700',cursor:'pointer',fontFamily:'inherit' }}>
              {loading?'Submitting...':'Submit Request'}
            </button>
            <button onClick={onClose} style={{ background:'white',color:'#5a7080',border:'1px solid #dde3e8',padding:'10px 18px',borderRadius:'7px',fontSize:'13px',cursor:'pointer',fontFamily:'inherit' }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

async function submitReschedule(entry, newDay, newSlot, note) {
  const res = await api.post('/timetable/reschedule-request', {
    timetable_id:entry.id, new_day:newDay, new_time_slot:newSlot, reason:note,
  });
  if (res.data.conflicts?.length) throw new Error(res.data.conflicts.map(c=>c.message).join('. '));
  return res.data.message || 'Reschedule request submitted.';
}

// ── Reusable Weekly Grid ──────────────────────────────────────────────────
function WeeklyGrid({ entries, onReschedule }) {
  const today = new Date().toLocaleDateString('en-US',{weekday:'long'});
  return (
    <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
      <table style={{ width:'100%',borderCollapse:'collapse',minWidth:'700px',tableLayout:'fixed' }}>
        <thead><tr style={{ background:'#2d4a5a' }}>
          <th style={{ padding:'10px 12px',color:'white',fontSize:'11px',fontWeight:'700',textAlign:'center',width:'100px',border:'1px solid rgba(255,255,255,0.1)' }}>DAY</th>
          {SLOTS.map(s=><th key={s.id} style={{ padding:'10px 8px',color:'white',fontSize:'11px',fontWeight:'700',textAlign:'center',border:'1px solid rgba(255,255,255,0.1)' }}>{s.label}</th>)}
        </tr></thead>
        <tbody>
          {DAYS.map(day=>{
            const dayE=entries.filter(e=>e.day===day);
            const isToday=day===today;
            const coveredSlots = new Set();
            dayE.forEach(e=>{ if(e.is_lab){ const s=parseInt(e.time_slot); coveredSlots.add(s+1); coveredSlots.add(s+2); } });
            return(
              <tr key={day}>
                <td style={{ padding:'8px 12px',fontWeight:'700',fontSize:'12px',textAlign:'center',border:'1px solid #e8edf0',
                  background:isToday?'#dbeafe':'#f5f8fa',color:isToday?'#2d4a5a':'#1a2e3a',
                  borderLeft:isToday?'3px solid #2d4a5a':'1px solid #e8edf0' }}>
                  {day}{isToday&&<div style={{ fontSize:'9px',color:'#4a7a93',fontWeight:'600' }}>Today</div>}
                </td>
                {SLOTS.map(slot=>{
                  if(coveredSlots.has(slot.id)) return null;
                  const cell=dayE.find(e=>parseInt(e.time_slot)===parseInt(slot.id));
                  const span = (cell?.is_lab) ? 3 : 1;
                  return(
                    <td key={slot.id} colSpan={span} style={{ border:'1px solid #e8edf0',padding:'3px',verticalAlign:'top',height:'80px',width:'160px' }}>
                      {cell&&(
                        <div style={{ ...cellStyle(cell.is_lab), position:'relative' }}>
                          <div style={{ fontWeight:'700',fontSize:'10.5px',marginBottom:'2px' }}>{cell.short_name||cell.subject_name}</div>
                          <div style={{ opacity:0.8,fontSize:'9.5px' }}>{cell.teacher_name?.split(' ').slice(0,3).join(' ')}</div>
                          <div style={{ opacity:0.7,fontSize:'9px',marginTop:'1px' }}>{cell.room_code||cell.room_id}</div>
                          <div style={{ opacity:0.65,fontSize:'9px' }}>{cell.batch_name}</div>
                          {cell.is_lab&&(
                            <div style={{ display:'flex',alignItems:'center',gap:'4px',marginTop:'3px' }}>
                              <span style={{ background:'rgba(255,255,255,0.25)',borderRadius:'3px',padding:'1px 6px',fontSize:'9px',fontWeight:'700' }}>LAB — 3 hrs</span>
                              <span style={{ opacity:0.7,fontSize:'9px' }}>{cell.slot_label}</span>
                            </div>
                          )}
                          {onReschedule&&(
                            <button onClick={()=>onReschedule(cell)}
                              style={{ position:'absolute',bottom:'3px',right:'3px',background:'rgba(255,255,255,0.18)',border:'1px solid rgba(255,255,255,0.3)',color:'white',borderRadius:'4px',padding:'2px 5px',fontSize:'8.5px',cursor:'pointer',fontFamily:'inherit',fontWeight:'600' }}>
                              Reschedule
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Teacher Home ──────────────────────────────────────────────────────────
function TeacherHome() {
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  const [entries,setEntries]               = useState([]);
  const [loading,setLoading]               = useState(true);
  const [rescheduleEntry,setRescheduleEntry] = useState(null);
  const [toast,setToast]                   = useState('');
  const showToast = msg=>{ setToast(msg); setTimeout(()=>setToast(''),3500); };

  useEffect(()=>{ api.get('/timetable').then(r=>setEntries(r.data)).finally(()=>setLoading(false)); },[]);

  const today        = new Date().toLocaleDateString('en-US',{weekday:'long'});
  const todayClasses = entries.filter(e=>e.day===today).sort((a,b)=>parseInt(a.time_slot)-parseInt(b.time_slot));
  const batches      = [...new Set(entries.map(e=>e.batch_name).filter(Boolean))];
  const subjects     = [...new Set(entries.map(e=>e.subject_name).filter(Boolean))];

  const handleReschedule = async(entry,newDay,newSlot,note)=>{
    const msg=await submitReschedule(entry,newDay,newSlot,note); showToast(msg);
  };

  return (
    <div className="page-content" style={{ padding:isMobile?'12px':'20px' }}>
      {toast&&<div style={{ position:'fixed',top:'20px',right:'20px',background:'#16a34a',color:'white',padding:'11px 20px',borderRadius:'8px',fontWeight:'600',fontSize:'13px',boxShadow:'0 4px 12px rgba(0,0,0,0.15)',zIndex:8000 }}>{toast}</div>}
      {rescheduleEntry&&<RescheduleModal entry={rescheduleEntry} onClose={()=>setRescheduleEntry(null)} onSubmit={handleReschedule}/>}

      {/* Stat cards — UNCHANGED except 2-col on mobile */}
      <div style={{ display:'grid',gridTemplateColumns:isMobile?'1fr 1fr':'repeat(4,1fr)',gap:'12px',marginBottom:'16px' }}>
        {[
          {label:'Classes This Week',value:entries.length,     color:'#2d4a5a',icon:Calendar },
          {label:"Today's Classes",  value:todayClasses.length,color:'#4a7a93',icon:Clock    },
          {label:'Batches Teaching', value:batches.length,     color:'#3d6b7a',icon:Users    },
          {label:'Subjects',         value:subjects.length,    color:'#1e5a6e',icon:BookOpen },
        ].map(({label,value,color,icon:Icon})=>(
          <div key={label} style={{ background:color,color:'white',borderRadius:'12px',padding:isMobile?'14px':'18px 20px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:isMobile?'9px':'11px',opacity:0.75,fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'4px' }}>{label}</div>
              <div style={{ fontSize:isMobile?'24px':'30px',fontWeight:'800',lineHeight:1 }}>{loading?'—':value}</div>
            </div>
            <Icon size={isMobile?20:28} style={{ opacity:0.25 }}/>
          </div>
        ))}
      </div>

      {/* Profile + Today — UNCHANGED except stacks on mobile */}
      <div style={{ display:'grid',gridTemplateColumns:isMobile?'1fr':'260px 1fr',gap:'16px',marginBottom:'16px' }}>
        <div className="card">
          <div className="card-body" style={{ textAlign:'center',padding:'24px 20px' }}>
            <div style={{ width:'60px',height:'60px',background:'#2d4a5a',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:'800',fontSize:'22px',margin:'0 auto 12px' }}>T</div>
            <div style={{ fontSize:'15px',fontWeight:'700',color:'#1a2e3a',marginBottom:'3px' }}>{user?.full_name}</div>
            <div style={{ fontSize:'12px',color:'#7a9aaa',marginBottom:'16px' }}>CS & SE Department</div>
            <div style={{ borderTop:'1px solid #e8edf0',paddingTop:'14px' }}>
              <div style={{ fontSize:'11px',color:'#7a9aaa',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'8px' }}>Batches Teaching</div>
              <div style={{ display:'flex',flexWrap:'wrap',gap:'5px',justifyContent:'center' }}>
                {batches.length===0?<span style={{ fontSize:'12px',color:'#aabbc8' }}>None assigned</span>:
                  batches.map(b=><span key={b} style={{ background:'#e8f4fd',color:'#1a5a7a',border:'1px solid #b8d9f5',borderRadius:'10px',padding:'2px 10px',fontSize:'11px',fontWeight:'600' }}>{b}</span>)}
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h2 style={{ display:'flex',alignItems:'center',gap:'8px' }}><Clock size={15}/> Today — {today}</h2></div>
          <div className="card-body" style={{ padding:0,overflowX:'auto',WebkitOverflowScrolling:'touch' }}>
            {loading?<div style={{ padding:'28px',textAlign:'center' }}><div className="spinner" style={{ margin:'0 auto' }}></div></div>:
             todayClasses.length===0?<div style={{ padding:'28px',textAlign:'center',color:'#aabbc8',fontSize:'13px' }}>No classes today.</div>:(
              <table style={{ width:'100%',borderCollapse:'collapse',fontSize:'12px',minWidth:'360px' }}>
                <thead><tr style={{ background:'#f5f8fa' }}>
                  {['Time','Subject','Batch','Room',''].map(h=><th key={h} style={{ padding:'9px 14px',textAlign:'left',fontSize:'10px',fontWeight:'700',color:'#5a7080',textTransform:'uppercase',letterSpacing:'0.5px',borderBottom:'1px solid #e8edf0' }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {todayClasses.map(e=>(
                    <tr key={e.id} style={{ borderBottom:'0.5px solid #e8edf0' }}>
                      <td style={{ padding:'10px 14px',fontFamily:'monospace',fontWeight:'600',color:'#2d4a5a',fontSize:'12px' }}>{e.slot_label}</td>
                      <td style={{ padding:'10px 14px',fontWeight:'600',color:'#1a2e3a' }}>{e.subject_name}</td>
                      <td style={{ padding:'10px 14px' }}><span style={{ background:'#e8f4fd',color:'#1a5a7a',border:'1px solid #b8d9f5',borderRadius:'10px',padding:'2px 9px',fontSize:'10px',fontWeight:'600' }}>{e.batch_name}</span></td>
                      <td style={{ padding:'10px 14px',color:'#5a7080' }}>{e.room_code||e.room_id}</td>
                      <td style={{ padding:'10px 14px' }}><button onClick={()=>setRescheduleEntry(e)} style={{ background:'transparent',color:'#2d4a5a',border:'1px solid #2d4a5a',padding:'4px 10px',borderRadius:'5px',fontSize:'11px',fontWeight:'600',cursor:'pointer',fontFamily:'inherit' }}>Reschedule</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Subjects Teaching + Weekly Overview — UNCHANGED except stacks on mobile */}
      <div style={{ display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:'16px' }}>
        <div className="card">
          <div className="card-header"><h2 style={{ display:'flex',alignItems:'center',gap:'8px' }}><BookOpen size={15}/> Subjects Teaching</h2></div>
          <div className="card-body" style={{ padding:0,overflowX:'auto',WebkitOverflowScrolling:'touch' }}>
            {subjects.length===0?<div style={{ padding:'24px',textAlign:'center',color:'#aabbc8',fontSize:'13px' }}>No subjects assigned.</div>:(
              <table style={{ width:'100%',borderCollapse:'collapse',fontSize:'12px',minWidth:'320px' }}>
                <thead><tr style={{ background:'#f5f8fa' }}>
                  {['Subject','Batch','Room','Day','Time'].map(h=><th key={h} style={{ padding:'8px 14px',textAlign:'left',fontSize:'10px',fontWeight:'700',color:'#5a7080',textTransform:'uppercase',letterSpacing:'0.5px',borderBottom:'1px solid #e8edf0' }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {entries.map(e=>(
                    <tr key={e.id} style={{ borderBottom:'0.5px solid #e8edf0' }}>
                      <td style={{ padding:'8px 14px',fontWeight:'600',color:'#1a2e3a' }}>{e.subject_name}</td>
                      <td style={{ padding:'8px 14px' }}><span style={{ background:'#e8f4fd',color:'#1a5a7a',border:'1px solid #b8d9f5',borderRadius:'10px',padding:'2px 8px',fontSize:'10px',fontWeight:'600' }}>{e.batch_name}</span></td>
                      <td style={{ padding:'8px 14px',color:'#5a7080' }}>{e.room_code||e.room_id}</td>
                      <td style={{ padding:'8px 14px',color:'#5a7080' }}>{e.day}</td>
                      <td style={{ padding:'8px 14px',fontFamily:'monospace',fontSize:'11px',color:'#2d4a5a',fontWeight:'600' }}>{e.slot_label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h2 style={{ display:'flex',alignItems:'center',gap:'8px' }}><Calendar size={15}/> Weekly Overview</h2></div>
          <div className="card-body">
            <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px' }}>
              {DAYS.map(day=>{
                const count=entries.filter(e=>e.day===day).length;
                return(
                  <div key={day} style={{ background:'#f5f8fa',border:'1px solid #e0e8ed',borderRadius:'10px',padding:'14px',textAlign:'center' }}>
                    <div style={{ fontSize:'10px',fontWeight:'700',textTransform:'uppercase',letterSpacing:'0.5px',color:'#7a9aaa',marginBottom:'6px' }}>{day.slice(0,3)}</div>
                    <div style={{ fontSize:'22px',fontWeight:'800',color:'#1a2e3a' }}>{count}</div>
                    <div style={{ fontSize:'10px',color:'#7a9aaa',marginTop:'3px' }}>class{count!==1?'es':''}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── My Schedule ───────────────────────────────────────────────────────────
function TeacherSchedulePage() {
  const { isMobile } = useResponsive();
  const [entries,setEntries]               = useState([]);
  const [loading,setLoading]               = useState(true);
  const [rescheduleEntry,setRescheduleEntry] = useState(null);
  const [toast,setToast]                   = useState('');
  const showToast = msg=>{ setToast(msg); setTimeout(()=>setToast(''),3500); };

  useEffect(()=>{ api.get('/timetable').then(r=>setEntries(r.data)).finally(()=>setLoading(false)); },[]);
  const handleReschedule=async(e,d,s,n)=>{ const m=await submitReschedule(e,d,s,n); showToast(m); };

  return (
    <div className="page-content" style={{ padding:isMobile?'12px':'20px' }}>
      {toast&&<div style={{ position:'fixed',top:'20px',right:'20px',background:'#16a34a',color:'white',padding:'11px 20px',borderRadius:'8px',fontWeight:'600',fontSize:'13px',zIndex:8000 }}>{toast}</div>}
      {rescheduleEntry&&<RescheduleModal entry={rescheduleEntry} onClose={()=>setRescheduleEntry(null)} onSubmit={handleReschedule}/>}
      <div className="card" style={{ marginBottom:'18px' }}>
        <div className="card-header">
          <h2 style={{ display:'flex',alignItems:'center',gap:'8px' }}><Calendar size={15}/> My Weekly Schedule</h2>
          <span style={{ fontSize:'12px',color:'#aabbc8' }}>Click Reschedule to request changes</span>
        </div>
        <div className="card-body" style={{ padding:'14px' }}>
          {loading?<div style={{ textAlign:'center',padding:'32px' }}><div className="spinner" style={{ margin:'0 auto' }}></div></div>:
            <WeeklyGrid entries={entries} onReschedule={setRescheduleEntry}/>}
        </div>
      </div>
      <div className="card">
        <div className="card-header"><h2 style={{ display:'flex',alignItems:'center',gap:'8px' }}><Calendar size={15}/> All Classes — List</h2></div>
        <div className="card-body" style={{ padding:0,overflowX:'auto',WebkitOverflowScrolling:'touch' }}>
          <table style={{ width:'100%',borderCollapse:'collapse',fontSize:'12px',minWidth:'480px' }}>
            <thead><tr style={{ background:'#2d4a5a',color:'white' }}>
              {['Subject','Batch','Day','Time','Room','Action'].map(h=><th key={h} style={{ padding:'10px 14px',textAlign:'left',fontSize:'10px',fontWeight:'700',textTransform:'uppercase',letterSpacing:'0.5px' }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {entries.map(e=>(
                <tr key={e.id} style={{ borderBottom:'0.5px solid #e8edf0' }}>
                  <td style={{ padding:'10px 14px',fontWeight:'600',color:'#1a2e3a' }}>{e.subject_name}</td>
                  <td style={{ padding:'10px 14px' }}><span style={{ background:'#e8f4fd',color:'#1a5a7a',border:'1px solid #b8d9f5',borderRadius:'10px',padding:'2px 9px',fontSize:'10px',fontWeight:'600' }}>{e.batch_name}</span></td>
                  <td style={{ padding:'10px 14px',color:'#5a7080' }}>{e.day}</td>
                  <td style={{ padding:'10px 14px',fontFamily:'monospace',fontSize:'12px',color:'#2d4a5a',fontWeight:'600' }}>{e.slot_label}</td>
                  <td style={{ padding:'10px 14px',color:'#5a7080' }}>{e.room_code||e.room_id}</td>
                  <td style={{ padding:'10px 14px' }}><button onClick={()=>setRescheduleEntry(e)} style={{ background:'#2d4a5a',color:'white',border:'none',padding:'5px 12px',borderRadius:'5px',fontSize:'11px',fontWeight:'600',cursor:'pointer',fontFamily:'inherit' }}>Reschedule</button></td>
                </tr>
              ))}
              {entries.length===0&&<tr><td colSpan="6" style={{ padding:'28px',textAlign:'center',color:'#aabbc8' }}>No classes assigned.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Batch Timetable Page ──────────────────────────────────────────────────
function AllBatchesPage() {
  const { isMobile } = useResponsive();
  const [batches,     setBatches]     = useState([]);
  const [selBatch,    setSelBatch]    = useState('');
  const [selSemester, setSelSemester] = useState(1);
  const [entries,     setEntries]     = useState([]);
  const [loading,     setLoading]     = useState(false);

  useEffect(()=>{
    api.get('/office/batches').then(r=>{ setBatches(r.data); });
  },[]);

  useEffect(()=>{
    if(!selBatch) return;
    setLoading(true);
    api.get('/office/batch-timetable',{params:{batch_id:selBatch, semester:selSemester}})
      .then(r=>setEntries(r.data))
      .catch(()=>setEntries([]))
      .finally(()=>setLoading(false));
  },[selBatch, selSemester]);

  const selBatchObj = batches.find(b=>String(b.id)===String(selBatch));
  const MAJORS=[{label:'Computer Science',code:'CS'},{label:'Software Engineering',code:'SE'},{label:'Data Science',code:'DS'}];

  return (
    <div className="page-content" style={{ padding:isMobile?'12px':'20px' }}>
      <div className="card">
        <div className="card-header"><h2 style={{ display:'flex',alignItems:'center',gap:'8px' }}><Users size={15}/> Batch Timetable</h2></div>
        <div className="card-body">
          <div style={{ display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:'14px',marginBottom:'20px' }}>
            <div>
              <label style={{ fontSize:'11px',fontWeight:'700',color:'#5a7080',textTransform:'uppercase',letterSpacing:'0.5px',display:'block',marginBottom:'6px' }}>Select Batch</label>
              <select value={selBatch} onChange={e=>setSelBatch(e.target.value)}
                style={{ width:'100%',padding:'9px 12px',border:'1px solid #dde3e8',borderRadius:'7px',fontSize:'13px',fontFamily:'inherit',color:'#1a2e3a',outline:'none',background:'white' }}>
                <option value="">-- Choose a batch --</option>
                {MAJORS.map(m=>{
                  const grp=batches.filter(b=>b.major_code===m.code||b.major?.includes(m.label.split(' ')[0]));
                  if(!grp.length) return null;
                  return <optgroup key={m.code} label={m.label}>{grp.map(b=><option key={b.id} value={b.id}>{b.batch_name}</option>)}</optgroup>;
                })}
              </select>
            </div>
            {selBatchObj&&(
              <div style={{ display:'flex',gap:'10px',flexWrap:'wrap',alignItems:'flex-end' }}>
                <div style={{ background:'#f5f8fa',border:'1px solid #e0e8ed',borderRadius:'8px',padding:'12px 16px',flex:1 }}>
                  <div style={{ fontSize:'10px',color:'#7a9aaa',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'3px' }}>Batch</div>
                  <div style={{ fontSize:'15px',fontWeight:'700',color:'#1a2e3a' }}>{selBatchObj.batch_name}</div>
                </div>
                <div style={{ background:'#f5f8fa',border:'1px solid #e0e8ed',borderRadius:'8px',padding:'12px 16px',flex:1 }}>
                  <div style={{ fontSize:'10px',color:'#7a9aaa',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'3px' }}>Total Classes</div>
                  <div style={{ fontSize:'15px',fontWeight:'700',color:'#1a2e3a' }}>{entries.length}</div>
                </div>
              </div>
            )}
          </div>
          {selBatch && (
            <div style={{ marginBottom:'16px',display:'flex',alignItems:'center',gap:'12px',flexWrap:'wrap' }}>
              <span style={{ fontSize:'11px',fontWeight:'700',color:'#5a7080',textTransform:'uppercase',letterSpacing:'0.5px' }}>Semester</span>
              <div style={{ display:'flex',gap:'4px',flexWrap:'wrap' }}>
                {[1,2,3,4,5,6,7,8].map(s=>(
                  <button key={s} onClick={()=>setSelSemester(s)}
                    style={{ width:'30px',height:'30px',borderRadius:'6px',border:'1px solid',fontSize:'11px',fontWeight:'700',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',
                      background:selSemester===s?'#2d4a5a':'white',
                      color:selSemester===s?'white':'#4a6070',
                      borderColor:selSemester===s?'#2d4a5a':'#c8d8e0' }}>
                    {s}
                  </button>
                ))}
              </div>
              <span style={{ fontSize:'11px',color:'#aabbc8' }}>Showing Semester {selSemester}</span>
            </div>
          )}
          {!selBatch?(
            <div style={{ textAlign:'center',padding:'48px',color:'#aabbc8' }}>
              <Users size={36} style={{ display:'block',margin:'0 auto 12px',opacity:0.4 }}/>
              <div style={{ fontSize:'14px',fontWeight:'600' }}>Select a batch to view its timetable</div>
            </div>
          ):loading?(
            <div style={{ textAlign:'center',padding:'32px' }}><div className="spinner" style={{ margin:'0 auto' }}></div></div>
          ):(
            <>
              <div style={{ fontSize:'14px',fontWeight:'700',color:'#1a2e3a',marginBottom:'12px',display:'flex',alignItems:'center',gap:'8px' }}>
                <Calendar size={15}/> {selBatchObj?.batch_name} — Semester {selSemester} Schedule
              </div>
              {entries.length===0?(
                <div style={{ textAlign:'center',padding:'32px',color:'#aabbc8',fontSize:'13px' }}>No classes scheduled for this batch yet.</div>
              ):(
                <WeeklyGrid entries={entries}/>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Room Status Page ──────────────────────────────────────────────────────
function RoomStatusPage() {
  const { isMobile } = useResponsive();
  const [rooms,    setRooms]   = useState([]);
  const [selRoom,  setSelRoom] = useState('');
  const [entries,  setEntries] = useState([]);
  const [loading,  setLoading] = useState(false);

  useEffect(()=>{ api.get('/office/rooms').then(r=>setRooms(r.data)); },[]);

  useEffect(()=>{
    if(!selRoom) return;
    setLoading(true);
    api.get('/office/room-schedule',{params:{room_id:selRoom}})
      .then(r=>setEntries(r.data))
      .catch(()=>setEntries([]))
      .finally(()=>setLoading(false));
  },[selRoom]);

  const selRoomObj = rooms.find(r=>String(r.id)===String(selRoom));

  return (
    <div className="page-content" style={{ padding:isMobile?'12px':'20px' }}>
      <div className="card">
        <div className="card-header"><h2 style={{ display:'flex',alignItems:'center',gap:'8px' }}><Building2 size={15}/> Room Status & Schedule</h2></div>
        <div className="card-body">
          <div style={{ display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:'14px',marginBottom:'20px' }}>
            <div>
              <label style={{ fontSize:'11px',fontWeight:'700',color:'#5a7080',textTransform:'uppercase',letterSpacing:'0.5px',display:'block',marginBottom:'6px' }}>Select Room</label>
              <select value={selRoom} onChange={e=>setSelRoom(e.target.value)}
                style={{ width:'100%',padding:'9px 12px',border:'1px solid #dde3e8',borderRadius:'7px',fontSize:'13px',fontFamily:'inherit',color:'#1a2e3a',outline:'none',background:'white' }}>
                <option value="">-- Choose a room --</option>
                {rooms.map(r=><option key={r.id} value={r.id}>{r.room_id} — Cap: {r.capacity} ({r.room_type||'classroom'})</option>)}
              </select>
            </div>
            {selRoomObj&&(
              <div style={{ display:'flex',gap:'10px',alignItems:'flex-end',flexWrap:'wrap' }}>
                <div style={{ background:'#f5f8fa',border:'1px solid #e0e8ed',borderRadius:'8px',padding:'12px 16px',flex:1 }}>
                  <div style={{ fontSize:'10px',color:'#7a9aaa',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'3px' }}>Capacity</div>
                  <div style={{ fontSize:'15px',fontWeight:'700',color:'#1a2e3a' }}>{selRoomObj.capacity} students</div>
                </div>
                <div style={{ background:selRoomObj.is_available?'#dcfce7':'#fef2f2',border:`1px solid ${selRoomObj.is_available?'#86efac':'#fca5a5'}`,borderRadius:'8px',padding:'12px 16px',flex:1 }}>
                  <div style={{ fontSize:'10px',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'3px',color:selRoomObj.is_available?'#166534':'#9b1c1c' }}>Status</div>
                  <div style={{ fontSize:'15px',fontWeight:'700',color:selRoomObj.is_available?'#16a34a':'#dc2626' }}>{selRoomObj.is_available?'Available':'Occupied'}</div>
                </div>
              </div>
            )}
          </div>
          {!selRoom?(
            <div style={{ textAlign:'center',padding:'48px',color:'#aabbc8' }}>
              <Building2 size={36} style={{ display:'block',margin:'0 auto 12px',opacity:0.4 }}/>
              <div style={{ fontSize:'14px',fontWeight:'600' }}>Select a room to view its schedule</div>
            </div>
          ):loading?(
            <div style={{ textAlign:'center',padding:'32px' }}><div className="spinner" style={{ margin:'0 auto' }}></div></div>
          ):(
            <>
              <div style={{ fontSize:'14px',fontWeight:'700',color:'#1a2e3a',marginBottom:'12px',display:'flex',alignItems:'center',gap:'8px' }}>
                <Building2 size={15}/> {selRoomObj?.room_id} — Weekly Schedule
              </div>
              {entries.length===0?(
                <div style={{ textAlign:'center',padding:'32px',color:'#aabbc8',fontSize:'13px' }}>No classes scheduled in this room.</div>
              ):(
                <WeeklyGrid entries={entries}/>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Entry Point ───────────────────────────────────────────────────────────
export default function TeacherDashboard() {
  const { isMobile } = useResponsive();
  return (
    <div style={{ display:'flex',minHeight:'100vh' }}>
      <TeacherSidebar/>
      <div style={{ marginLeft: isMobile ? 0 : '210px', flex:1, display:'flex', flexDirection:'column', minHeight:'100vh', background:'#f0f4f7' }}>
        <Routes>
          <Route index             element={<TeacherHome/>}/>
          <Route path="schedule"   element={<TeacherSchedulePage/>}/>
          <Route path="all-batches" element={<AllBatchesPage/>}/>
          <Route path="all-rooms"  element={<RoomStatusPage/>}/>
        </Routes>
      </div>
    </div>
  );
}