// frontend/src/components/common/Sidebar.js
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ROLE_LABELS = {
  office_assistant: 'Office Assistant',
  teacher:          'Teacher',
  student:          'Student',
};

export default function Sidebar({ navItems, pendingCount = 0 }) {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  const initials  = user?.full_name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'U';
  const shortName = user?.full_name?.split(' ').slice(0, 2).join(' ');

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">T</div>
        <div className="sidebar-logo-name">Academic Scheduler Agent</div>
        <div className="sidebar-logo-sub">{user?.department_name || 'CS & SE Department'}</div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {navItems.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={!!exact}
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            <Icon size={12} />
            {label}
            {label === 'Approvals' && pendingCount > 0 && (
              <span className="pending-count">{pendingCount}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div>
            <div className="sidebar-user-name">{shortName}</div>
            <div className="sidebar-user-role">{ROLE_LABELS[user?.role] || 'User'}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={14} /> Logout
        </button>
      </div>
    </aside>
  );
}