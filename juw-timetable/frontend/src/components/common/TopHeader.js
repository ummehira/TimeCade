// frontend/src/components/common/TopHeader.js
import React from 'react';
import { useAuth } from '../../context/AuthContext';

const ROLE_LABELS = {
  office_assistant: 'OFFICE ASSISTANT',
  department_admin: 'DEPARTMENT ADMIN',
  teacher:          'TEACHER',
  student:          'STUDENT',
};

export default function TopHeader({ title, icon: Icon }) {
  const { user } = useAuth();

  // Avatar letter — always A for admin
  const initials = user?.role === 'department_admin'
    ? 'A'
    : user?.full_name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'U';

  // Display name — CS & SE for admin
  const displayName = user?.role === 'department_admin'
    ? 'CS & SE'
    : user?.full_name?.split(' ').slice(0, 2).join(' ');

  return (
    <header style={{
      background: 'white', padding: '14px 26px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderBottom: '1px solid #e0e8ed',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      position: 'sticky', top: 0, zIndex: 50
    }}>
      <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#1a2e3a', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
        {Icon && <Icon size={20} />}
        {title}
      </h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a2e3a' }}>{displayName}</div>
          <div style={{ fontSize: '10px', color: '#8fa5b0', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{ROLE_LABELS[user?.role]}</div>
        </div>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          background: '#2d4a5a', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: '700', fontSize: '13px'
        }}>{initials}</div>
      </div>
    </header>
  );
}