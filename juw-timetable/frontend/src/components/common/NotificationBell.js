// frontend/src/components/common/NotificationBell.js
import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, Calendar, X } from 'lucide-react';
import api from '../../utils/api';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unread,        setUnread]        = useState(0);
  const [open,          setOpen]          = useState(false);
  const ref = useRef(null);

  const load = async () => {
    try {
      const r = await api.get('/notifications');
      setNotifications(r.data);
      setUnread(r.data.filter(n => !n.is_read).length);
    } catch(_) {}
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const close = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const markRead = async (id) => {
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

  const typeIcon = type => {
    if (type?.includes('added'))       return '📅';
    if (type?.includes('removed'))     return '🗑️';
    if (type?.includes('rescheduled')) return '🔄';
    if (type?.includes('updated'))     return '✏️';
    if (type?.includes('approved'))    return '✅';
    if (type?.includes('rejected'))    return '❌';
    return '🔔';
  };

  const timeAgo = ts => {
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <div ref={ref} style={{ position:'relative' }}>
      {/* Bell button */}
      <button onClick={() => { setOpen(o => !o); if (!open) load(); }}
        style={{ position:'relative', background: open ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)',
          border:'1px solid rgba(255,255,255,0.15)', color:'white', borderRadius:'8px',
          width:'34px', height:'34px', display:'flex', alignItems:'center', justifyContent:'center',
          cursor:'pointer', transition:'background 0.15s' }}>
        <Bell size={16}/>
        {unread > 0 && (
          <span style={{ position:'absolute', top:'-4px', right:'-4px',
            background:'#ef4444', color:'white', borderRadius:'50%',
            width:'16px', height:'16px', fontSize:'9px', fontWeight:'800',
            display:'flex', alignItems:'center', justifyContent:'center',
            border:'2px solid #2d4a5a' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 8px)', right:0,
          width:'320px', background:'white', borderRadius:'12px',
          boxShadow:'0 12px 40px rgba(0,0,0,0.2)', border:'1px solid #e0e8ed',
          overflow:'hidden', zIndex:9999 }}>

          {/* Header */}
          <div style={{ padding:'12px 14px', background:'#2d4a5a',
            display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
              <Bell size={14} color="white"/>
              <span style={{ fontSize:'13px', fontWeight:'700', color:'white' }}>Notifications</span>
              {unread > 0 && (
                <span style={{ background:'#ef4444', color:'white', borderRadius:'10px',
                  padding:'1px 7px', fontSize:'10px', fontWeight:'700' }}>{unread}</span>
              )}
            </div>
            {unread > 0 && (
              <button onClick={markAll}
                style={{ background:'rgba(255,255,255,0.15)', border:'none', color:'white',
                  borderRadius:'5px', padding:'3px 8px', fontSize:'10px', fontWeight:'600',
                  cursor:'pointer', display:'flex', alignItems:'center', gap:'4px' }}>
                <CheckCheck size={11}/> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight:'340px', overflowY:'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding:'30px', textAlign:'center', color:'#aabbc8', fontSize:'12px' }}>
                <Bell size={28} color="#dde3e8" style={{ marginBottom:'8px', display:'block', margin:'0 auto 8px' }}/>
                No notifications yet
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id}
                  style={{ padding:'11px 14px', borderBottom:'1px solid #f0f4f7',
                    background: n.is_read ? 'white' : '#f0f6ff',
                    display:'flex', gap:'10px', alignItems:'flex-start',
                    transition:'background 0.1s' }}>
                  {/* Icon */}
                  <div style={{ width:'32px', height:'32px', borderRadius:'8px',
                    background: n.is_read ? '#f0f4f7' : '#dbeafe',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:'14px', flexShrink:0 }}>
                    {typeIcon(n.type)}
                  </div>
                  {/* Content */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'12px', fontWeight: n.is_read ? '500' : '700',
                      color:'#1a2e3a', marginBottom:'2px', lineHeight:'1.3' }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize:'11px', color:'#5a7080', lineHeight:'1.4', marginBottom:'3px' }}>
                      {n.message}
                    </div>
                    <div style={{ fontSize:'10px', color:'#aabbc8' }}>{timeAgo(n.created_at)}</div>
                  </div>
                  {/* Mark read */}
                  {!n.is_read && (
                    <button onClick={() => markRead(n.id)}
                      title="Mark as read"
                      style={{ background:'none', border:'none', cursor:'pointer',
                        color:'#4a7a93', padding:'2px', display:'flex', flexShrink:0 }}>
                      <Check size={13}/>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div style={{ padding:'8px 14px', background:'#f8fafc',
              borderTop:'1px solid #e0e8ed', textAlign:'center' }}>
              <span style={{ fontSize:'11px', color:'#aabbc8' }}>
                {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}