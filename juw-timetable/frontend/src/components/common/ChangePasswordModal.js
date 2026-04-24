// frontend/src/components/common/ChangePasswordModal.js
import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Check, X } from 'lucide-react';
import api from '../../utils/api';

export default function ChangePasswordModal({ onClose }) {
  const [form,    setForm]    = useState({ current:'', newPass:'', confirm:'' });
  const [show,    setShow]    = useState({ current:false, newPass:false, confirm:false });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);

  const set = (k,v) => setForm(f => ({ ...f, [k]:v }));
  const toggle = (k) => setShow(s => ({ ...s, [k]:!s[k] }));

  // Password strength
  const strength = (p) => {
    if (!p) return { score:0, label:'', color:'#e0e8ed' };
    let s = 0;
    if (p.length >= 6)  s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^a-zA-Z0-9]/.test(p)) s++;
    const map = [
      { label:'Too short', color:'#ef4444' },
      { label:'Weak',      color:'#ef4444' },
      { label:'Fair',      color:'#f59e0b' },
      { label:'Good',      color:'#3b82f6' },
      { label:'Strong',    color:'#22c55e' },
      { label:'Very Strong', color:'#16a34a' },
    ];
    return { score:s, ...map[Math.min(s, map.length-1)] };
  };

  const pw = strength(form.newPass);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.current)  { setError('Please enter your current password.'); return; }
    if (!form.newPass)  { setError('Please enter a new password.'); return; }
    if (form.newPass.length < 6) { setError('New password must be at least 6 characters.'); return; }
    if (form.newPass !== form.confirm) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        current_password: form.current,
        new_password:     form.newPass,
      });
      setSuccess(true);
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password.');
    } finally { setLoading(false); }
  };

  const inputStyle = { width:'100%', padding:'9px 36px 9px 12px', border:'1px solid #dde3e8', borderRadius:'7px', fontSize:'13px', fontFamily:'inherit', outline:'none', color:'#1a2e3a', boxSizing:'border-box' };
  const labelStyle = { fontSize:'11px', fontWeight:'700', color:'#5a7080', textTransform:'uppercase', letterSpacing:'0.5px', display:'block', marginBottom:'6px' };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:'20px' }}>
      <div style={{ background:'white', borderRadius:'14px', maxWidth:'440px', width:'100%', overflow:'hidden', boxShadow:'0 20px 50px rgba(0,0,0,0.2)' }}>

        {/* Header */}
        <div style={{ background:'#2d4a5a', padding:'16px 20px', color:'white', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <Lock size={18}/>
            <div>
              <div style={{ fontSize:'15px', fontWeight:'700' }}>Change Password</div>
              <div style={{ fontSize:'11px', opacity:0.7, marginTop:'1px' }}>Update your account password</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.15)', border:'none', color:'white', borderRadius:'6px', width:'28px', height:'28px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={14}/>
          </button>
        </div>

        {success ? (
          <div style={{ padding:'40px 20px', textAlign:'center' }}>
            <div style={{ width:'56px', height:'56px', background:'#dcfce7', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <Check size={28} color="#16a34a"/>
            </div>
            <div style={{ fontSize:'16px', fontWeight:'700', color:'#1a2e3a', marginBottom:'6px' }}>Password Changed!</div>
            <div style={{ fontSize:'13px', color:'#7a9aaa' }}>Your password has been updated successfully.</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding:'20px' }}>

            {/* Current password */}
            <div style={{ marginBottom:'16px' }}>
              <label style={labelStyle}>Current Password</label>
              <div style={{ position:'relative' }}>
                <input type={show.current?'text':'password'} value={form.current}
                  onChange={e=>set('current',e.target.value)} style={inputStyle} placeholder="Enter current password"/>
                <button type="button" onClick={()=>toggle('current')}
                  style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#7a9aaa', display:'flex' }}>
                  {show.current ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            {/* New password */}
            <div style={{ marginBottom:'10px' }}>
              <label style={labelStyle}>New Password</label>
              <div style={{ position:'relative' }}>
                <input type={show.newPass?'text':'password'} value={form.newPass}
                  onChange={e=>set('newPass',e.target.value)} style={inputStyle} placeholder="Enter new password (min 6 characters)"/>
                <button type="button" onClick={()=>toggle('newPass')}
                  style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#7a9aaa', display:'flex' }}>
                  {show.newPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            {/* Strength bar */}
            {form.newPass && (
              <div style={{ marginBottom:'16px' }}>
                <div style={{ height:'4px', background:'#e0e8ed', borderRadius:'2px', overflow:'hidden', marginBottom:'4px' }}>
                  <div style={{ height:'100%', width:`${(pw.score/5)*100}%`, background:pw.color, borderRadius:'2px', transition:'all 0.3s' }}/>
                </div>
                <div style={{ fontSize:'11px', color:pw.color, fontWeight:'600' }}>{pw.label}</div>
              </div>
            )}

            {/* Confirm password */}
            <div style={{ marginBottom:'16px' }}>
              <label style={labelStyle}>Confirm New Password</label>
              <div style={{ position:'relative' }}>
                <input type={show.confirm?'text':'password'} value={form.confirm}
                  onChange={e=>set('confirm',e.target.value)} style={inputStyle} placeholder="Re-enter new password"/>
                <button type="button" onClick={()=>toggle('confirm')}
                  style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#7a9aaa', display:'flex' }}>
                  {show.confirm ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
              {form.confirm && form.newPass && (
                <div style={{ fontSize:'11px', marginTop:'4px', color:form.newPass===form.confirm?'#16a34a':'#ef4444', fontWeight:'600', display:'flex', alignItems:'center', gap:'4px' }}>
                  {form.newPass===form.confirm ? <><Check size={12}/> Passwords match</> : <><X size={12}/> Passwords do not match</>}
                </div>
              )}
            </div>

            {error && (
              <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'7px', padding:'10px 12px', fontSize:'12.5px', color:'#dc2626', marginBottom:'14px', display:'flex', alignItems:'center', gap:'8px' }}>
                <X size={14} style={{ flexShrink:0 }}/>{error}
              </div>
            )}

            <div style={{ display:'flex', gap:'10px' }}>
              <button type="submit" disabled={loading}
                style={{ flex:1, background:'#2d4a5a', color:'white', border:'none', padding:'11px', borderRadius:'7px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:'7px' }}>
                <Lock size={14}/> {loading ? 'Changing...' : 'Change Password'}
              </button>
              <button type="button" onClick={onClose}
                style={{ background:'white', color:'#5a7080', border:'1px solid #dde3e8', padding:'11px 18px', borderRadius:'7px', fontSize:'13px', cursor:'pointer', fontFamily:'inherit' }}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}