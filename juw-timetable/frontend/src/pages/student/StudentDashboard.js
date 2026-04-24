// frontend/src/pages/student/StudentDashboard.js
import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, BookOpen, LogOut, Clock, Users, Settings } from 'lucide-react';
import ProfileModal from '../../components/common/ProfileModal';
import NotificationBell from '../../components/common/NotificationBell';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const DAYS  = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const SLOTS = [
  { id:1, label:'9:00 - 10:00'  },
  { id:2, label:'10:00 - 11:00' },
  { id:3, label:'11:00 - 12:00' },
  { id:4, label:'12:00 - 1:00'  },
  { id:5, label:'1:00 - 2:00'   },
];

// ── Sidebar ───────────────────────────────────────────────────────────────
function StudentSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const initials = user?.full_name?.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase() || 'S';

  const NAV = [
    { to:'/student',            label:'Dashboard',  icon:LayoutDashboard, exact:true },
    { to:'/student/timetable',  label:'Timetable',  icon:Calendar },
    { to:'/student/courses',    label:'My Courses', icon:BookOpen },
  ];

  return (
    <aside style={{ width:'200px',background:'#2d4a5a',display:'flex',flexDirection:'column',position:'fixed',top:0,left:0,height:'100vh',zIndex:100,boxShadow:'2px 0 12px rgba(0,0,0,0.15)' }}>
      {/* Logo */}
      <div style={{ padding:'16px 14px',borderBottom:'1px solid rgba(255,255,255,0.08)',display:'flex',flexDirection:'column',alignItems:'center' }}>
        <img src="/logo.png" alt="Timecade"
          style={{ width:'44px',height:'44px',borderRadius:'10px',objectFit:'contain',background:'rgba(255,255,255,0.12)',padding:'4px',display:'block',margin:'0 auto 8px' }}
          onError={e=>{ e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
        />
        <div style={{ display:'none',width:'44px',height:'44px',background:'rgba(255,255,255,0.15)',borderRadius:'10px',alignItems:'center',justifyContent:'center',fontSize:'20px',fontWeight:'800',color:'white',margin:'0 auto 8px' }}>T</div>
        <div style={{ color:'white',fontSize:'14px',fontWeight:'700',textAlign:'center',lineHeight:1 }}>Timecade</div>
        <div style={{ color:'rgba(255,255,255,0.45)',fontSize:'10px',marginTop:'3px',textAlign:'center' }}>CS & SE Department</div>
      </div>

      {/* Nav */}
      <nav style={{ flex:1,padding:'10px 8px' }}>
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

      {/* Footer */}
      <div style={{ padding:'12px 10px',borderTop:'1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display:'flex',alignItems:'center',gap:'8px',marginBottom:'9px' }}>
          <div style={{ width:'30px',height:'30px',borderRadius:'50%',background:'rgba(255,255,255,0.18)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:'700',color:'white',flexShrink:0 }}>{initials}</div>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ color:'white',fontSize:'11px',fontWeight:'600',lineHeight:1.3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{user?.full_name?.split(' ').slice(0,3).join(' ')}</div>
            <div style={{ color:'rgba(255,255,255,0.45)',fontSize:'9px',marginTop:'2px' }}>Student</div>
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
  );
}

// ── Top Header ────────────────────────────────────────────────────────────
function StudentHeader({ title, icon:Icon }) {
  const { user } = useAuth();
  const initials = user?.full_name?.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase() || 'S';
  const firstName = user?.full_name?.split(' ').slice(0,2).join(' ');
  return (
    <header style={{ background:'white',padding:'14px 26px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'1px solid #e0e8ed',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',position:'sticky',top:0,zIndex:50 }}>
      <h1 style={{ fontSize:'18px',fontWeight:'700',color:'#1a2e3a',display:'flex',alignItems:'center',gap:'10px',margin:0 }}>
        {Icon&&<Icon size={20}/>}{title}
      </h1>
      <div style={{ display:'flex',alignItems:'center',gap:'10px' }}>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:'13px',fontWeight:'600',color:'#1a2e3a' }}>{firstName}</div>
          <div style={{ fontSize:'10px',color:'#8fa5b0',textTransform:'uppercase',letterSpacing:'0.6px' }}>STUDENT</div>
        </div>
        <div style={{ width:'36px',height:'36px',borderRadius:'50%',background:'#2d4a5a',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'700',fontSize:'13px' }}>{initials}</div>
      </div>
    </header>
  );
}

// ── Student Home ──────────────────────────────────────────────────────────
function StudentHome() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    api.get('/timetable').then(r=>setEntries(r.data)).finally(()=>setLoading(false));
  },[]);

  const today        = new Date().toLocaleDateString('en-US',{ weekday:'long' });
  const todayClasses = entries.filter(e=>e.day===today).sort((a,b)=>a.time_slot-b.time_slot);
  const subjects     = [...new Set(entries.map(e=>e.subject_name).filter(Boolean))];
  const batchName    = entries[0]?.batch_name || '—';
  const initials     = user?.full_name?.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()||'S';

  return (
    <div className="page-content">
      {/* Stat cards */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'14px',marginBottom:'20px' }}>
        {[
          { label:'Classes This Week', value:entries.length,       color:'#2d4a5a', icon:Calendar  },
          { label:'Today\'s Classes',  value:todayClasses.length,  color:'#4a7a93', icon:Clock     },
          { label:'My Subjects',       value:subjects.length,      color:'#3d6b7a', icon:BookOpen  },
          { label:'My Batch',          value:batchName,            color:'#1e5a6e', icon:Users, big:false },
        ].map(({ label, value, color, icon:Icon })=>(
          <div key={label} style={{ background:color,color:'white',borderRadius:'12px',padding:'18px 20px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:'11px',opacity:0.75,fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'6px' }}>{label}</div>
              <div style={{ fontSize:typeof value==='string'&&value.length>6?'18px':'30px',fontWeight:'800',lineHeight:1 }}>{loading?'—':value}</div>
            </div>
            <Icon size={28} style={{ opacity:0.25 }}/>
          </div>
        ))}
      </div>

      {/* Profile + Today */}
      <div style={{ display:'grid',gridTemplateColumns:'260px 1fr',gap:'16px',marginBottom:'16px' }}>
        {/* Profile */}
        <div className="card">
          <div className="card-body" style={{ textAlign:'center',padding:'24px 20px' }}>
            <div style={{ width:'64px',height:'64px',background:'#2d4a5a',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:'800',fontSize:'22px',margin:'0 auto 12px' }}>{initials}</div>
            <div style={{ fontSize:'15px',fontWeight:'700',color:'#1a2e3a',marginBottom:'3px' }}>{user?.full_name}</div>
            <div style={{ fontSize:'12px',color:'#7a9aaa',marginBottom:'4px' }}>Student</div>
            <div style={{ display:'inline-block',background:'#e8f4fd',color:'#1a5a7a',border:'1px solid #b8d9f5',borderRadius:'10px',padding:'3px 12px',fontSize:'12px',fontWeight:'600',marginBottom:'16px' }}>{batchName}</div>
            <div style={{ borderTop:'1px solid #e8edf0',paddingTop:'14px' }}>
              <div style={{ fontSize:'11px',color:'#7a9aaa',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'8px' }}>Student ID</div>
              <div style={{ fontFamily:'monospace',fontSize:'14px',fontWeight:'700',color:'#2d4a5a' }}>{user?.juw_id || '—'}</div>
            </div>
          </div>
        </div>

        {/* Today's classes */}
        <div className="card">
          <div className="card-header">
            <h2 style={{ display:'flex',alignItems:'center',gap:'8px' }}><Clock size={15}/> Today — {today}</h2>
          </div>
          <div className="card-body" style={{ padding:0 }}>
            {loading?(
              <div style={{ padding:'28px',textAlign:'center' }}><div className="spinner" style={{ margin:'0 auto' }}></div></div>
            ):todayClasses.length===0?(
              <div style={{ padding:'32px',textAlign:'center' }}>
                <Calendar size={32} color="#c8d8e0" style={{ display:'block',margin:'0 auto 10px' }}/>
                <div style={{ color:'#aabbc8',fontSize:'13px',fontWeight:'500' }}>No classes today</div>
                <div style={{ color:'#c8d8e0',fontSize:'11px',marginTop:'4px' }}>Enjoy your free day!</div>
              </div>
            ):(
              <table style={{ width:'100%',borderCollapse:'collapse',fontSize:'12px' }}>
                <thead><tr style={{ background:'#f5f8fa' }}>
                  {['Time','Subject','Teacher','Room'].map(h=>(
                    <th key={h} style={{ padding:'9px 14px',textAlign:'left',fontSize:'10px',fontWeight:'700',color:'#5a7080',textTransform:'uppercase',letterSpacing:'0.5px',borderBottom:'1px solid #e8edf0' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {todayClasses.map(e=>(
                    <tr key={e.id} style={{ borderBottom:'0.5px solid #e8edf0' }}>
                      <td style={{ padding:'11px 14px',fontFamily:'monospace',fontWeight:'700',color:'#2d4a5a' }}>{e.slot_label}</td>
                      <td style={{ padding:'11px 14px',fontWeight:'600',color:'#1a2e3a' }}>{e.subject_name}</td>
                      <td style={{ padding:'11px 14px',color:'#5a7080' }}>{e.teacher_name}</td>
                      <td style={{ padding:'11px 14px' }}>
                        <span style={{ background:'#f0f4f7',color:'#2d4a5a',border:'1px solid #c8d8e0',borderRadius:'6px',padding:'2px 9px',fontSize:'11px',fontWeight:'600' }}>{e.room_code||e.room_id}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Subjects + Weekly overview */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px' }}>
        {/* My subjects */}
        <div className="card">
          <div className="card-header">
            <h2 style={{ display:'flex',alignItems:'center',gap:'8px' }}><BookOpen size={15}/> My Subjects</h2>
          </div>
          <div className="card-body" style={{ padding:0 }}>
            {subjects.length===0?(
              <div style={{ padding:'24px',textAlign:'center',color:'#aabbc8',fontSize:'13px' }}>No subjects found.</div>
            ):(
              <table style={{ width:'100%',borderCollapse:'collapse',fontSize:'12px' }}>
                <thead><tr style={{ background:'#f5f8fa' }}>
                  {['Subject','Teacher','Room'].map(h=>(
                    <th key={h} style={{ padding:'8px 14px',textAlign:'left',fontSize:'10px',fontWeight:'700',color:'#5a7080',textTransform:'uppercase',letterSpacing:'0.5px',borderBottom:'1px solid #e8edf0' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {/* Unique per subject */}
                  {[...new Map(entries.map(e=>[e.subject_name,e])).values()].map(e=>(
                    <tr key={e.id} style={{ borderBottom:'0.5px solid #e8edf0' }}>
                      <td style={{ padding:'9px 14px',fontWeight:'600',color:'#1a2e3a' }}>{e.subject_name}</td>
                      <td style={{ padding:'9px 14px',color:'#5a7080' }}>{e.teacher_name}</td>
                      <td style={{ padding:'9px 14px' }}>
                        <span style={{ background:'#f0f4f7',color:'#2d4a5a',border:'1px solid #c8d8e0',borderRadius:'6px',padding:'2px 8px',fontSize:'11px',fontWeight:'600' }}>{e.room_code||e.room_id}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Weekly overview */}
        <div className="card">
          <div className="card-header">
            <h2 style={{ display:'flex',alignItems:'center',gap:'8px' }}><Calendar size={15}/> Weekly Overview</h2>
          </div>
          <div className="card-body">
            <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px' }}>
              {DAYS.map(day=>{
                const count = entries.filter(e=>e.day===day).length;
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

// ── Timetable Page ────────────────────────────────────────────────────────
function StudentTimetable() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toLocaleDateString('en-US',{ weekday:'long' });

  useEffect(()=>{
    api.get('/timetable').then(r=>setEntries(r.data)).finally(()=>setLoading(false));
  },[]);

  return (
    <div className="page-content">
      <div className="card">
        <div className="card-header">
          <h2 style={{ display:'flex',alignItems:'center',gap:'8px' }}><Calendar size={15}/> My Weekly Timetable</h2>
          <span style={{ fontSize:'12px',color:'#aabbc8',fontWeight:'500' }}>View only</span>
        </div>
        <div className="card-body" style={{ padding:'14px',overflowX:'auto' }}>
          {loading?(
            <div style={{ textAlign:'center',padding:'40px' }}><div className="spinner" style={{ margin:'0 auto' }}></div></div>
          ):(
            <table style={{ width:'100%',borderCollapse:'collapse',minWidth:'700px' }}>
              <thead>
                <tr style={{ background:'#2d4a5a' }}>
                  <th style={{ padding:'11px 14px',color:'white',fontSize:'11px',fontWeight:'700',textAlign:'center',width:'110px',border:'1px solid rgba(255,255,255,0.1)' }}>DAY</th>
                  {SLOTS.map(s=>(
                    <th key={s.id} style={{ padding:'11px 8px',color:'white',fontSize:'11px',fontWeight:'700',textAlign:'center',border:'1px solid rgba(255,255,255,0.1)' }}>{s.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map(day=>{
                  const dayEntries = entries.filter(e=>e.day===day);
                  const isToday    = day===today;
                  return(
                    <tr key={day} style={{ background:isToday?'#f0f7ff':'transparent' }}>
                      <td style={{ padding:'8px 14px',fontWeight:'700',fontSize:'12px',color:isToday?'#2d4a5a':'#1a2e3a',textAlign:'center',background:isToday?'#dbeafe':'#f5f8fa',border:'1px solid #e8edf0',borderLeft:isToday?'3px solid #2d4a5a':'1px solid #e8edf0' }}>
                        {day}
                        {isToday&&<div style={{ fontSize:'9px',color:'#4a7a93',fontWeight:'600',marginTop:'2px' }}>Today</div>}
                      </td>
                      {SLOTS.map(slot=>{
                        const cell = dayEntries.find(e=>e.time_slot===slot.id);
                        return(
                          <td key={slot.id} style={{ border:'1px solid #e8edf0',padding:'4px',verticalAlign:'top',height:'78px',background:isToday?'#f8fbff':'white' }}>
                            {cell&&(
                              <div style={{ background:'#2d4a5a',borderRadius:'7px',padding:'7px 9px',color:'white',fontSize:'10px',lineHeight:'1.4',height:'100%',boxSizing:'border-box' }}>
                                <div style={{ fontWeight:'700',fontSize:'11px',marginBottom:'3px' }}>{cell.short_name||cell.subject_name}</div>
                                <div style={{ opacity:0.8,fontSize:'9.5px' }}>{cell.teacher_name?.split(' ').slice(0,3).join(' ')}</div>
                                <div style={{ opacity:0.7,fontSize:'9px',marginTop:'2px',display:'flex',gap:'6px' }}>
                                  <span>{cell.room_code||cell.room_id}</span>
                                  {cell.is_lab&&<span style={{ background:'rgba(255,255,255,0.2)',borderRadius:'3px',padding:'0 4px' }}>Lab</span>}
                                </div>
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
          )}
        </div>
      </div>

      {/* Day-wise list below grid */}
      <div className="card" style={{ marginTop:'18px' }}>
        <div className="card-header">
          <h2 style={{ display:'flex',alignItems:'center',gap:'8px' }}><Clock size={15}/> All Classes — Detailed List</h2>
        </div>
        <div className="card-body" style={{ padding:0 }}>
          <table style={{ width:'100%',borderCollapse:'collapse',fontSize:'12px' }}>
            <thead><tr style={{ background:'#2d4a5a',color:'white' }}>
              {['Day','Time','Subject','Teacher','Room','Lab'].map(h=>(
                <th key={h} style={{ padding:'10px 14px',textAlign:'left',fontSize:'10px',fontWeight:'700',textTransform:'uppercase',letterSpacing:'0.5px' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {DAYS.flatMap(day=>
                entries.filter(e=>e.day===day).sort((a,b)=>a.time_slot-b.time_slot).map(e=>(
                  <tr key={e.id} style={{ borderBottom:'0.5px solid #e8edf0', background:e.day===today?'#f8fbff':'white' }}>
                    <td style={{ padding:'10px 14px',fontWeight:e.day===today?'700':'400',color:e.day===today?'#2d4a5a':'#5a7080' }}>{e.day}{e.day===today&&<span style={{ marginLeft:'6px',background:'#dbeafe',color:'#1e40af',fontSize:'9px',fontWeight:'700',borderRadius:'4px',padding:'1px 5px' }}>TODAY</span>}</td>
                    <td style={{ padding:'10px 14px',fontFamily:'monospace',fontWeight:'600',color:'#2d4a5a',fontSize:'12px' }}>{e.slot_label}</td>
                    <td style={{ padding:'10px 14px',fontWeight:'600',color:'#1a2e3a' }}>{e.subject_name}</td>
                    <td style={{ padding:'10px 14px',color:'#5a7080' }}>{e.teacher_name}</td>
                    <td style={{ padding:'10px 14px' }}><span style={{ background:'#f0f4f7',color:'#2d4a5a',border:'1px solid #c8d8e0',borderRadius:'6px',padding:'2px 8px',fontSize:'11px',fontWeight:'600' }}>{e.room_code||e.room_id}</span></td>
                    <td style={{ padding:'10px 14px' }}>{e.is_lab?<span style={{ background:'#fef3c7',color:'#d97706',border:'1px solid #fde68a',borderRadius:'6px',padding:'2px 8px',fontSize:'10px',fontWeight:'700' }}>Lab</span>:<span style={{ color:'#c8d8e0',fontSize:'11px' }}>—</span>}</td>
                  </tr>
                ))
              )}
              {entries.length===0&&<tr><td colSpan="6" style={{ padding:'32px',textAlign:'center',color:'#aabbc8' }}>No classes found for your batch.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Courses Page ──────────────────────────────────────────────────────────
function StudentCourses() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    api.get('/timetable').then(r=>setEntries(r.data)).finally(()=>setLoading(false));
  },[]);

  // Unique courses
  const courses = [...new Map(entries.map(e=>[e.subject_id,e])).values()];

  return (
    <div className="page-content">
      <div className="card">
        <div className="card-header">
          <h2 style={{ display:'flex',alignItems:'center',gap:'8px' }}><BookOpen size={15}/> My Courses</h2>
          <span style={{ fontSize:'12px',color:'#aabbc8' }}>{courses.length} course{courses.length!==1?'s':''} enrolled</span>
        </div>
        <div className="card-body">
          {loading?(
            <div style={{ textAlign:'center',padding:'40px' }}><div className="spinner" style={{ margin:'0 auto' }}></div></div>
          ):courses.length===0?(
            <div style={{ textAlign:'center',padding:'40px',color:'#aabbc8' }}>
              <BookOpen size={36} style={{ display:'block',margin:'0 auto 12px',opacity:0.4 }}/>
              <div style={{ fontSize:'14px',fontWeight:'600' }}>No courses found</div>
              <div style={{ fontSize:'12px',marginTop:'4px' }}>Contact your Office Assistant to enroll in courses.</div>
            </div>
          ):(
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:'14px' }}>
              {courses.map(e=>{
                // find all slots for this subject
                const slots = entries.filter(x=>x.subject_id===e.subject_id);
                return(
                  <div key={e.subject_id} style={{ background:'white',border:'0.5px solid #dde3e8',borderRadius:'12px',overflow:'hidden',borderTop:'3px solid #2d4a5a' }}>
                    <div style={{ padding:'16px 18px' }}>
                      <div style={{ fontSize:'14px',fontWeight:'700',color:'#1a2e3a',marginBottom:'8px',lineHeight:'1.3' }}>{e.subject_name}</div>
                      <div style={{ fontSize:'12px',color:'#5a7080',marginBottom:'3px',display:'flex',alignItems:'center',gap:'6px' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        {e.teacher_name}
                      </div>
                      <div style={{ fontSize:'12px',color:'#5a7080',marginBottom:'12px',display:'flex',alignItems:'center',gap:'6px' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                        {e.batch_name}
                      </div>
                      {/* Schedule slots */}
                      <div style={{ borderTop:'1px solid #f0f4f7',paddingTop:'10px' }}>
                        <div style={{ fontSize:'10px',fontWeight:'700',color:'#7a9aaa',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'7px' }}>Schedule</div>
                        <div style={{ display:'flex',flexDirection:'column',gap:'5px' }}>
                          {slots.map(s=>(
                            <div key={s.id} style={{ display:'flex',alignItems:'center',gap:'8px',fontSize:'11px' }}>
                              <span style={{ background:'#e8f4fd',color:'#1a5a7a',border:'1px solid #b8d9f5',borderRadius:'5px',padding:'2px 7px',fontWeight:'600',fontSize:'10px',minWidth:'70px',textAlign:'center' }}>{s.day.slice(0,3)}</span>
                              <span style={{ color:'#2d4a5a',fontFamily:'monospace',fontWeight:'600' }}>{s.slot_label}</span>
                              <span style={{ color:'#8fa5b0' }}>— {s.room_code||s.room_id}</span>
                              {s.is_lab&&<span style={{ background:'#fef3c7',color:'#d97706',fontSize:'9px',fontWeight:'700',borderRadius:'4px',padding:'1px 5px' }}>Lab</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Entry Point ───────────────────────────────────────────────────────────
export default function StudentDashboard() {
  return (
    <div style={{ display:'flex',minHeight:'100vh' }}>
      <StudentSidebar/>
      <div style={{ marginLeft:'200px',flex:1,display:'flex',flexDirection:'column',minHeight:'100vh',background:'#f0f4f7' }}>
        <Routes>
          <Route index              element={<><StudentHeader title="Student Dashboard"  icon={LayoutDashboard}/><StudentHome/></>}/>
          <Route path="timetable"   element={<><StudentHeader title="My Timetable"       icon={Calendar}/><StudentTimetable/></>}/>
          <Route path="courses"     element={<><StudentHeader title="My Courses"         icon={BookOpen}/><StudentCourses/></>}/>
        </Routes>
      </div>
    </div>
  );
}