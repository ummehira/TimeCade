// frontend/src/components/common/NotificationBell.js
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bell, Check, CheckCheck } from 'lucide-react';
import api from '../../utils/api';

function NotifIcon({ type }) {
  const color = type?.includes('approved') ? '#16a34a'
    : type?.includes('rejected') ? '#dc2626'
    : type?.includes('removed')  ? '#d97706'
    : '#2d4a5a';
  const bg = type?.includes('approved') ? '#dcfce7'
    : type?.includes('rejected') ? '#fef2f2'
    : type?.includes('removed')  ? '#fef3c7'
    : '#e8f4fd';
  return (
    <div style={{ width:'32px',height:'32px',borderRadius:'8px',background:bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
      {type?.includes('approved') ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      ) : type?.includes('rejected') ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      ) : type?.includes('removed') ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
      ) : type?.includes('reschedule') || type?.includes('updated') ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      )}
    </div>
  );
}

export default function NotificationBell({ dark = true }) {
  const [notifications, setNotifications] = useState([]);
  const [unread,        setUnread]        = useState(0);
  const [open,          setOpen]          = useState(false);
  const [pos,           setPos]           = useState({});
  const btnRef      = useRef(null);
  const dropdownRef = useRef(null);

  const DROPDOWN_W = 340;
  const DROPDOWN_MAX_H = 480; // header ~50 + list ~380 + footer ~50

  const load = async () => {
    try {
      const r = await api.get('/notifications');
      setNotifications(r.data);
      setUnread(r.data.filter(n => !n.is_read).length);
    } catch(_) {}
  };

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);

  useEffect(() => {
    const close = e => {
      if (btnRef.current?.contains(e.target) || dropdownRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const r    = btnRef.current.getBoundingClientRect();
      const vh   = window.innerHeight;

      // Decide: open upward or downward?
      const spaceBelow = vh - r.bottom;
      const spaceAbove = r.top;
      const openUpward = spaceBelow < DROPDOWN_MAX_H && spaceAbove > spaceBelow;

      // Horizontal: align right edge of dropdown to right edge of button, clamp to screen
      let left = r.right - DROPDOWN_W;
      if (left < 8) left = 8;
      if (left + DROPDOWN_W > window.innerWidth - 8) left = window.innerWidth - DROPDOWN_W - 8;

      if (openUpward) {
        // bottom of dropdown = top of button
        setPos({ bottom: vh - r.top + 6, left, top: 'auto' });
      } else {
        setPos({ top: r.bottom + 6, left, bottom: 'auto' });
      }
    }
    setOpen(o => !o);
    if (!open) load();
  };

  const markRead = async id => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(ns => ns.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnread(u => Math.max(0, u - 1));
    } catch(_) {}
  };

  const markAll = async () => {
    try {
      await api.put('/notifications/read-all/mark');
      setNotifications(ns => ns.map(n => ({ ...n, is_read: true })));
      setUnread(0);
    } catch(_) {}
  };

  const timeAgo = ts => {
    const m = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleToggle}
        style={{
          position: 'relative',
          background: open
            ? (dark ? 'rgba(255,255,255,0.18)' : 'rgba(45,74,90,0.1)')
            : (dark ? 'rgba(255,255,255,0.08)' : 'transparent'),
          border: dark ? '1px solid rgba(255,255,255,0.15)' : '1px solid #dde3e8',
          color: dark ? 'white' : '#2d4a5a',
          borderRadius: '8px', width: '26px', height: '26px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'background 0.15s',
        }}
      >
        <Bell size={14} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: '-4px', right: '-4px',
            background: '#ef4444', color: 'white',
            borderRadius: '50%', width: '15px', height: '15px',
            fontSize: '8px', fontWeight: '800',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `2px solid ${dark ? '#2d4a5a' : 'white'}`,
            pointerEvents: 'none',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && createPortal(
        <>
          {/* Backdrop */}
          <div
            style={{ position:'fixed', inset:0, zIndex:99998 }}
            onClick={() => setOpen(false)}
          />

          {/* Dropdown — opens upward when near bottom of screen */}
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              top:    pos.top    ?? 'auto',
              bottom: pos.bottom ?? 'auto',
              left:   pos.left,
              width:  `${DROPDOWN_W}px`,
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 16px 48px rgba(0,0,0,0.22)',
              border: '1px solid #e0e8ed',
              overflow: 'hidden',
              zIndex: 99999,
            }}
          >
            {/* Header */}
            <div style={{ padding:'13px 16px', background:'#2d4a5a', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                <Bell size={14} color="white" />
                <span style={{ fontSize:'13px', fontWeight:'700', color:'white' }}>Notifications</span>
                {unread > 0 && (
                  <span style={{ background:'#ef4444', color:'white', borderRadius:'10px', padding:'1px 8px', fontSize:'10px', fontWeight:'700' }}>
                    {unread} new
                  </span>
                )}
              </div>
              {unread > 0 && (
                <button onClick={markAll}
                  style={{ background:'rgba(255,255,255,0.15)', border:'none', color:'white', borderRadius:'5px', padding:'4px 9px', fontSize:'10px', fontWeight:'600', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px', fontFamily:'inherit' }}>
                  <CheckCheck size={11} /> Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div style={{ maxHeight:'380px', overflowY:'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding:'36px', textAlign:'center', color:'#aabbc8' }}>
                  <div style={{ width:'44px', height:'44px', background:'#f0f4f7', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px' }}>
                    <Bell size={20} color="#c8d8e0" />
                  </div>
                  <div style={{ fontSize:'13px', fontWeight:'600', color:'#5a7080', marginBottom:'4px' }}>No notifications yet</div>
                  <div style={{ fontSize:'11px' }}>You are all caught up!</div>
                </div>
              ) : notifications.map(n => (
                <div key={n.id}
                  style={{ padding:'12px 14px', borderBottom:'1px solid #f0f4f7', background: n.is_read ? 'white' : '#f5f9ff', display:'flex', gap:'10px', alignItems:'flex-start' }}>
                  <NotifIcon type={n.type} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'12px', fontWeight: n.is_read ? '500' : '700', color:'#1a2e3a', marginBottom:'3px', lineHeight:1.3 }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize:'11px', color:'#5a7080', lineHeight:1.4, marginBottom:'4px' }}>
                      {n.message}
                    </div>
                    <div style={{ fontSize:'10px', color:'#aabbc8', display:'flex', alignItems:'center', gap:'6px' }}>
                      {timeAgo(n.created_at)}
                      {!n.is_read && <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#3b82f6', display:'inline-block' }} />}
                    </div>
                  </div>
                  {!n.is_read && (
                    <button onClick={() => markRead(n.id)} title="Mark as read"
                      style={{ background:'none', border:'none', cursor:'pointer', color:'#4a7a93', padding:'2px', display:'flex', flexShrink:0 }}>
                      <Check size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {notifications.length > 0 && (
              <div style={{ padding:'8px 14px', background:'#f8fafc', borderTop:'1px solid #e0e8ed', textAlign:'center' }}>
                <span style={{ fontSize:'11px', color:'#aabbc8' }}>
                  {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </>,
        document.body
      )}
    </>
  );
}