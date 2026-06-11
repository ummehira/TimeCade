// frontend/src/pages/assistant/AssistantDashboard.js
import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, Building2, LogOut, Settings } from 'lucide-react';
import { useResponsive } from '../../hooks/useResponsive';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import TopHeader from '../../components/common/TopHeader';
import NotificationBell from '../../components/common/NotificationBell';
import ProfileModal from '../../components/common/ProfileModal';
import AssistantHome from './AssistantHome';
import TimetablePage from './TimetablePage';
import OfficeMgmtPage from './OfficeMgmtPage';

const NAV = [
  { to:'/assistant',           label:'Dashboard',         icon:LayoutDashboard, exact:true },
  { to:'/assistant/timetable', label:'Timetable',         icon:Calendar },
  { to:'/assistant/office',    label:'Resource Management', icon:Building2 },
];

export default function AssistantDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const [showProfile, setShowProfile]   = useState(false);
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const { isMobile } = useResponsive();

  useEffect(() => {
    const load = () => api.get('/approvals/pending').then(r => setPendingCount(r.data.length)).catch(() => {});
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials  = user?.full_name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'A';
  const shortName = user?.full_name?.split(' ').slice(0, 2).join(' ');

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:99 }}
        />
      )}

      {/* ── Sidebar ── */}
      <aside style={{
        width:'220px',
        background:'#2d4a5a',
        display:'flex',
        flexDirection:'column',
        position:'fixed',
        top:0, left:0,
        height:'100vh',
        zIndex:100,
        boxShadow:'2px 0 12px rgba(0,0,0,0.15)',
        // NO overflow:hidden — lets portal dropdowns render freely
        overflow:'visible',
        transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-220px)') : 'translateX(0)',
        transition:'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
      }}>

        {/* Logo */}
        <div style={{ padding:'16px 14px', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', flexDirection:'column', alignItems:'center' }}>
          <div style={{ width:'44px', height:'44px', background:'rgba(255,255,255,0.15)', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', fontWeight:'800', color:'white', margin:'0 auto 8px' }}>T</div>
          <div style={{ color:'white', fontSize:'14px', fontWeight:'700', lineHeight:1 }}>Timecade</div>
          <div style={{ color:'rgba(255,255,255,0.45)', fontSize:'10px', marginTop:'3px' }}>CS & SE Department</div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'10px 8px', overflowY:'auto' }}>
          {NAV.map(({ to, label, icon:Icon, exact }) => (
            <NavLink key={to} to={to} end={!!exact}
              style={({ isActive }) => ({
                display:'flex', alignItems:'center', gap:'9px', padding:'9px 12px',
                color: isActive ? 'white' : 'rgba(255,255,255,0.6)', textDecoration:'none',
                fontSize:'12.5px', fontWeight: isActive ? '600' : '400', borderRadius:'7px',
                marginBottom:'2px', background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                transition:'all 0.15s',
              })}>
              <Icon size={15}/>
              <span style={{ flex:1 }}>{label}</span>
              {label === 'Pending Approvals' && pendingCount > 0 && (
                <span style={{ background:'#ef4444', color:'white', fontSize:'9px', fontWeight:'700', borderRadius:'10px', padding:'1px 6px' }}>{pendingCount}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding:'12px 10px', borderTop:'1px solid rgba(255,255,255,0.08)', overflow:'visible' }}>
          {/* User row */}
          <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'9px', overflow:'visible' }}>
            <div style={{ width:'30px', height:'30px', borderRadius:'50%', background:'rgba(255,255,255,0.18)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'700', color:'white', flexShrink:0 }}>{initials}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ color:'white', fontSize:'11px', fontWeight:'600', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{shortName}</div>
              <div style={{ color:'rgba(255,255,255,0.45)', fontSize:'9px' }}>Office Assistant</div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'4px', flexShrink:0, overflow:'visible' }}>
              <NotificationBell dark={true}/>
              <button
                onClick={() => setShowProfile(true)}
                title="Profile Settings"
                style={{ background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', color:'white', borderRadius:'6px', width:'26px', height:'26px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}
              >
                <Settings size={12}/>
              </button>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', background:'#b91c1c', color:'white', border:'none', borderRadius:'6px', padding:'8px', fontSize:'12px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit' }}
          >
            <LogOut size={13}/> Logout
          </button>
        </div>

        {showProfile && <ProfileModal onClose={() => setShowProfile(false)}/>}
      </aside>

      {/* ── Main content ── */}
      <div style={{ marginLeft: isMobile ? 0 : '220px', flex:1, display:'flex', flexDirection:'column', minHeight:'100vh', background:'#f0f4f7', width: isMobile ? '100%' : 'calc(100% - 220px)' }}>
        <Routes>
          <Route index            element={<><TopHeader title="Dashboard"         icon={LayoutDashboard} onMenuClick={isMobile ? () => setSidebarOpen(o => !o) : null}/><AssistantHome/></>}/>
          <Route path="timetable" element={<><TopHeader title="Timetable"         icon={Calendar}        onMenuClick={isMobile ? () => setSidebarOpen(o => !o) : null}/><TimetablePage canEdit={true}/></>}/>
          <Route path="office/*"  element={<><TopHeader title="Resource Management" icon={Building2}       onMenuClick={isMobile ? () => setSidebarOpen(o => !o) : null}/><OfficeMgmtPage/></>}/>
        </Routes>
      </div>
    </div>
  );
}