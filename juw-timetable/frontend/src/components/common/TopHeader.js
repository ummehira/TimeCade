// frontend/src/components/common/TopHeader.js
import React from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from './NotificationBell';

const ROLE_LABELS = {
  office_assistant: 'OFFICE ASSISTANT',
  teacher:          'TEACHER',
  student:          'STUDENT',
};

export default function TopHeader({ title, icon: Icon, onMenuClick }) {
  const { user } = useAuth();

  const initials    = user?.full_name?.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase() || 'U';
  const displayName = user?.full_name?.split(' ').slice(0,2).join(' ');
  const showBell    = user?.role === 'teacher' || user?.role === 'student';

  return (
    <header style={{
      background:'white', padding:'12px 16px',
      display:'flex', alignItems:'center', justifyContent:'space-between',
      borderBottom:'1px solid #e0e8ed',
      boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
      position:'sticky', top:0, zIndex:50, gap:'10px'
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:'10px', minWidth:0 }}>
        {/* Hamburger — shown on mobile */}
        {onMenuClick && (
          <button onClick={onMenuClick}
            style={{ background:'#f0f4f7', border:'none', cursor:'pointer', color:'#2d4a5a',
              padding:'7px', borderRadius:'8px', display:'flex', alignItems:'center',
              justifyContent:'center', flexShrink:0 }}>
            <Menu size={19}/>
          </button>
        )}
        <h1 style={{ fontSize:'17px', fontWeight:'700', color:'#1a2e3a',
          display:'flex', alignItems:'center', gap:'8px', margin:0,
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {Icon && <Icon size={19}/>}
          {title}
        </h1>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:'10px', flexShrink:0 }}>
        {showBell && <NotificationBell/>}
        <div style={{ textAlign:'right', display:'none' }} className="hide-mobile">
          <div style={{ fontSize:'13px', fontWeight:'600', color:'#1a2e3a' }}>{displayName}</div>
          <div style={{ fontSize:'10px', color:'#8fa5b0', textTransform:'uppercase', letterSpacing:'0.6px' }}>{ROLE_LABELS[user?.role]}</div>
        </div>
        <div style={{
          width:'34px', height:'34px', borderRadius:'50%',
          background:'#2d4a5a', color:'white',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontWeight:'700', fontSize:'12px', flexShrink:0
        }}>{initials}</div>
      </div>
    </header>
  );
}