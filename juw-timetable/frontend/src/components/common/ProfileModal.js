// frontend/src/components/common/ProfileModal.js
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { User, Lock, Eye, EyeOff, Check, X, Settings, Mail, Shield, Clock, Activity, KeyRound, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const TABS = [
  { id:'profile',  label:'Profile',          icon:User   },
  { id:'password', label:'Change Password',  icon:Lock   },
  { id:'security', label:'Security',         icon:Shield },
];

const ls  = { fontSize:'11px',fontWeight:'700',color:'#5a7080',textTransform:'uppercase',letterSpacing:'0.5px',display:'block',marginBottom:'6px' };
const fi  = { width:'100%',padding:'9px 12px',border:'1px solid #dde3e8',borderRadius:'7px',fontSize:'13px',fontFamily:'inherit',outline:'none',color:'#1a2e3a',boxSizing:'border-box',background:'white' };

// ── Password strength ──────────────────────────────────────────────────────
function pwStrength(p) {
  if (!p) return { score:0, label:'', color:'#e0e8ed' };
  let s = 0;
  if (p.length >= 6)  s++;
  if (p.length >= 10) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^a-zA-Z0-9]/.test(p)) s++;
  const map = [
    { label:'Too short',   color:'#ef4444' },
    { label:'Weak',        color:'#ef4444' },
    { label:'Fair',        color:'#f59e0b' },
    { label:'Good',        color:'#3b82f6' },
    { label:'Strong',      color:'#22c55e' },
    { label:'Very Strong', color:'#16a34a' },
  ];
  return { score:s, ...map[Math.min(s, map.length-1)] };
}

// ── Profile Tab ────────────────────────────────────────────────────────────
function ProfileTab({ user }) {
  const initials = user?.full_name?.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase() || 'U';
  const roleLabel = { office_assistant:'Office Assistant', teacher:'Teacher', student:'Student' }[user?.role] || user?.role;

  return (
    <div>
      {/* Avatar */}
      <div style={{ display:'flex',alignItems:'center',gap:'16px',marginBottom:'24px',padding:'16px',background:'#f8fafc',borderRadius:'10px',border:'1px solid #e0e8ed' }}>
        <div style={{ width:'56px',height:'56px',borderRadius:'50%',background:'#2d4a5a',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px',fontWeight:'800',color:'white',flexShrink:0 }}>
          {initials}
        </div>
        <div>
          <div style={{ fontSize:'16px',fontWeight:'800',color:'#1a2e3a',marginBottom:'3px' }}>{user?.full_name}</div>
          <div style={{ fontSize:'12px',color:'#7a9aaa',marginBottom:'4px' }}>{user?.juw_id || user?.email}</div>
          <span style={{ background:'#e8f4fd',color:'#1a5a7a',border:'1px solid #b8d9f5',fontSize:'10px',fontWeight:'700',padding:'2px 9px',borderRadius:'8px' }}>{roleLabel}</span>
        </div>
      </div>

      {/* Info rows */}
      <div style={{ display:'flex',flexDirection:'column',gap:'12px' }}>
        {[
          { icon:User,   label:'Full Name',  value: user?.full_name || '—' },
          { icon:Mail,   label:'JUW ID',     value: user?.juw_id   || '—' },
          { icon:Shield, label:'Role',       value: roleLabel },
        ].map(({ icon:Icon, label, value })=>(
          <div key={label} style={{ display:'flex',alignItems:'center',gap:'12px',padding:'12px 14px',background:'white',border:'1px solid #e0e8ed',borderRadius:'8px' }}>
            <div style={{ width:'32px',height:'32px',background:'#f0f6fa',borderRadius:'7px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
              <Icon size={14} color="#2d4a5a"/>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:'10px',fontWeight:'700',color:'#7a9aaa',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'2px' }}>{label}</div>
              <div style={{ fontSize:'13px',fontWeight:'600',color:'#1a2e3a' }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop:'16px',padding:'12px 14px',background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:'8px',fontSize:'12px',color:'#1e40af' }}>
        To update your profile details, contact the system administrator.
      </div>
    </div>
  );
}

// ── Change Password Tab ────────────────────────────────────────────────────
function PasswordTab() {
  const [form,    setForm]    = useState({ current:'', newPass:'', confirm:'' });
  const [show,    setShow]    = useState({ current:false, newPass:false, confirm:false });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);

  const set    = (k,v) => setForm(f=>({...f,[k]:v}));
  const toggle = (k)   => setShow(s=>({...s,[k]:!s[k]}));
  const pw = pwStrength(form.newPass);

  const handleSubmit = async e => {
    e.preventDefault(); setError('');
    if (!form.current) { setError('Enter your current password.'); return; }
    if (form.newPass.length < 6) { setError('New password must be at least 6 characters.'); return; }
    if (form.newPass !== form.confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await api.post('/auth/change-password', { current_password:form.current, new_password:form.newPass });
      setSuccess(true);
      setTimeout(()=>setSuccess(false), 3000);
      setForm({ current:'', newPass:'', confirm:'' });
    } catch(err) { setError(err.response?.data?.message || 'Failed to change password.'); }
    finally { setLoading(false); }
  };

  const PwInput = ({ field, placeholder }) => (
    <div style={{ position:'relative' }}>
      <input type={show[field]?'text':'password'} value={form[field]} onChange={e=>set(field,e.target.value)}
        style={{ ...fi, paddingRight:'36px' }} placeholder={placeholder}/>
      <button type="button" onClick={()=>toggle(field)}
        style={{ position:'absolute',right:'10px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#7a9aaa',display:'flex' }}>
        {show[field] ? <EyeOff size={15}/> : <Eye size={15}/>}
      </button>
    </div>
  );

  if (success) return (
    <div style={{ textAlign:'center',padding:'40px 20px' }}>
      <div style={{ width:'56px',height:'56px',background:'#dcfce7',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px' }}>
        <Check size={26} color="#16a34a"/>
      </div>
      <div style={{ fontSize:'16px',fontWeight:'700',color:'#1a2e3a',marginBottom:'6px' }}>Password Changed!</div>
      <div style={{ fontSize:'13px',color:'#7a9aaa' }}>Your password has been updated successfully.</div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom:'14px' }}>
        <label style={ls}>Current Password</label>
        <PwInput field="current" placeholder="Enter current password"/>
      </div>
      <div style={{ marginBottom:'8px' }}>
        <label style={ls}>New Password</label>
        <PwInput field="newPass" placeholder="At least 6 characters"/>
      </div>
      {form.newPass&&(
        <div style={{ marginBottom:'14px' }}>
          <div style={{ height:'4px',background:'#e0e8ed',borderRadius:'2px',overflow:'hidden',marginBottom:'4px' }}>
            <div style={{ height:'100%',width:`${(pw.score/5)*100}%`,background:pw.color,borderRadius:'2px',transition:'all 0.3s' }}/>
          </div>
          <div style={{ fontSize:'11px',color:pw.color,fontWeight:'600' }}>{pw.label}</div>
        </div>
      )}
      <div style={{ marginBottom:'16px' }}>
        <label style={ls}>Confirm New Password</label>
        <PwInput field="confirm" placeholder="Re-enter new password"/>
        {form.confirm&&form.newPass&&(
          <div style={{ fontSize:'11px',marginTop:'4px',color:form.newPass===form.confirm?'#16a34a':'#ef4444',fontWeight:'600',display:'flex',alignItems:'center',gap:'4px' }}>
            {form.newPass===form.confirm?<><Check size={11}/> Passwords match</>:<><X size={11}/> Passwords do not match</>}
          </div>
        )}
      </div>
      {error&&<div style={{ background:'#fef2f2',border:'1px solid #fecaca',borderRadius:'7px',padding:'10px 12px',fontSize:'12px',color:'#dc2626',marginBottom:'14px',display:'flex',alignItems:'center',gap:'7px' }}><X size={13}/>{error}</div>}
      <button type="submit" disabled={loading}
        style={{ width:'100%',background:'#2d4a5a',color:'white',border:'none',padding:'11px',borderRadius:'8px',fontSize:'13px',fontWeight:'700',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:'7px' }}>
        <Lock size={14}/> {loading?'Updating...':'Update Password'}
      </button>
    </form>
  );
}

// ── Security Tab ───────────────────────────────────────────────────────────
function SecurityTab({ user }) {
  const items = [
    { label:'Last Login',      value:'This session',                              Icon:Clock    },
    { label:'Account Status',  value:'Active',                                    Icon:Activity },
    { label:'Role',            value:(user?.role||'').replace(/_/g,' '),          Icon:Shield   },
    { label:'Password Policy', value:'Min 6 characters with mixed characters',    Icon:KeyRound },
  ];
  return (
    <div>
      <div style={{ display:'flex',flexDirection:'column',gap:'10px',marginBottom:'16px' }}>
        {items.map(({label,value,Icon})=>(
          <div key={label} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 14px',background:'#f8fafc',border:'1px solid #e0e8ed',borderRadius:'8px' }}>
            <div style={{ display:'flex',alignItems:'center',gap:'10px' }}>
              <div style={{ width:'28px',height:'28px',background:'#e8f4fd',borderRadius:'6px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                <Icon size={13} color="#2d4a5a"/>
              </div>
              <span style={{ fontSize:'12px',fontWeight:'600',color:'#5a7080' }}>{label}</span>
            </div>
            <span style={{ fontSize:'12px',fontWeight:'700',color:'#1a2e3a',textTransform:'capitalize' }}>{value}</span>
          </div>
        ))}
      </div>
      <div style={{ padding:'12px 14px',background:'#fef3c7',border:'1px solid #fde68a',borderRadius:'8px',fontSize:'12px',color:'#92400e',lineHeight:'1.6',display:'flex',gap:'8px' }}>
        <AlertTriangle size={14} style={{ flexShrink:0,marginTop:'1px' }}/>
        <div><strong>Security Tips:</strong> Use a strong password with uppercase letters, numbers and symbols. Never share your credentials with anyone.</div>
      </div>
    </div>
  );
}

// ── Main Modal ─────────────────────────────────────────────────────────────
export default function ProfileModal({ onClose }) {
  const { user } = useAuth();
  const [tab, setTab] = useState('profile');

  const modalContent = (
    <div
      style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999,padding:'20px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}  // close on backdrop click
    >
      <div style={{ background:'white',borderRadius:'16px',width:'100%',maxWidth:'480px',overflow:'hidden',boxShadow:'0 24px 60px rgba(0,0,0,0.25)' }}>

        {/* Header */}
        <div style={{ background:'#2d4a5a',padding:'18px 20px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <div style={{ display:'flex',alignItems:'center',gap:'10px' }}>
            <Settings size={18} color="white"/>
            <div>
              <div style={{ fontSize:'15px',fontWeight:'700',color:'white' }}>Profile Settings</div>
              <div style={{ fontSize:'11px',color:'rgba(255,255,255,0.6)',marginTop:'1px' }}>Manage your account</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.15)',border:'none',color:'white',borderRadius:'6px',width:'28px',height:'28px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>
            <X size={14}/>
          </button>
        </div>

        {/* Tab bar */}
        <div style={{ display:'flex',borderBottom:'1px solid #e0e8ed' }}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{ flex:1,padding:'11px 6px',border:'none',background:'none',fontFamily:'inherit',fontSize:'11.5px',
                fontWeight:tab===t.id?'700':'500',color:tab===t.id?'#2d4a5a':'#7a9aaa',cursor:'pointer',
                borderBottom:tab===t.id?'2px solid #2d4a5a':'2px solid transparent',
                marginBottom:'-1px',display:'flex',alignItems:'center',justifyContent:'center',gap:'5px',transition:'all 0.15s' }}>
              <t.icon size={13}/>{t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding:'20px', maxHeight:'70vh', overflowY:'auto' }}>
          {tab==='profile'  && <ProfileTab  user={user}/>}
          {tab==='password' && <PasswordTab/>}
          {tab==='security' && <SecurityTab user={user}/>}
        </div>
      </div>
    </div>
  );

  // ✅ Render via portal so it escapes any parent transform/filter/stacking context
  return ReactDOM.createPortal(modalContent, document.body);
}