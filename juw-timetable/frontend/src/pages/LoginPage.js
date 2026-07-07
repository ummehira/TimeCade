// frontend/src/pages/LoginPage.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Eye, EyeOff } from 'lucide-react';

const ROLE_ROUTES = {
  office_assistant: '/assistant',
  teacher:          '/teacher',
  student:          '/student',
};
export default function LoginPage() {
  const [juwId,    setJuwId]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const { login }  = useAuth();
  const navigate   = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await login(juwId.trim(), password);
      navigate(ROLE_ROUTES[user.role] || '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid JUW ID or password.');
    } finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div style={{ width:'44px',height:'44px',background:'rgba(255,255,255,0.15)',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',fontWeight:'800',color:'white',margin:'0 auto 8px' }}>ASA</div>
          <h2>Academic Scheduler Agent</h2>
          <p>Jinnah University for Women</p>
        </div>


        {/* Error */}
        {error && <div className="login-error" style={{ marginBottom: '14px' }}>{error}</div>}

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          <div>
            <label>JUW ID</label>
            <input
              type="text"
              placeholder="e.g. ASSIST001 or T001"
              value={juwId}
              onChange={e => setJuwId(e.target.value)}
              required autoFocus
            />
          </div>
          <div>
            <label>Password</label>
            <div className="login-input-wrap">
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ paddingRight: '40px' }}
              />
              <button type="button" className="eye-btn" onClick={() => setShowPwd(p => !p)}>
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ justifyContent: 'center', padding: '12px', fontSize: '14px', marginTop: '4px' }}
            disabled={loading}
          >
            <LogIn size={15} />
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '18px', textAlign: 'center' }}>
          <Link to="/" style={{ fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'none' }}>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
