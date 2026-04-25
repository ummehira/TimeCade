// frontend/src/pages/LandingPage.js
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const NAV_LINKS = ['Home', 'Features', 'About', 'Contact'];

const FEATURES = [
  {
    title: 'Conflict Detection',
    desc: 'Instantly spot and resolve scheduling conflicts with smart visual alerts before they cause problems.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a2e3a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    )
  },
  {
    title: 'Drag & Drop',
    desc: 'Reschedule classes effortlessly with an intuitive drag-and-drop interface — validated in real time.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a2e3a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/>
        <polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/>
        <line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/>
      </svg>
    )
  },
  {
    title: 'Role-Based Access',
    desc: 'Separate dashboards for Office Assistant, Department Admin, Teacher, and Student roles.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a2e3a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    )
  },
  {
    title: 'Approval Workflow',
    desc: 'Admin changes go through the Office Assistant for review, ensuring full control over the schedule.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a2e3a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4"/>
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
      </svg>
    )
  },
];

const FOOTER_NAV   = ['Home', 'Features', 'About', 'Dashboard Login'];
const FOOTER_FEATS = ['Conflict Detection', 'Drag & Drop', 'Role-Based Access', 'Approval Workflow'];

// ── Animated timetable demo ─────────────────────────────────────────────────
function TimetableDemo() {
  const [step, setStep] = useState(0);
  // steps: 0=idle, 1=dragging, 2=dropped, 3=conflict, 4=resolved, then loop
  useEffect(() => {
    const timings = [1800, 900, 1400, 1000, 1200];
    const t = setTimeout(() => setStep(s => (s + 1) % 5), timings[step]);
    return () => clearTimeout(t);
  }, [step]);

  const dragging = step === 1;
  const dropped  = step >= 2;
  const conflict = step === 3;
  const resolved = step === 4;

  const cellStyle = (bg, extra = {}) => ({
    borderRadius: '6px', padding: '7px 9px', fontSize: '10px',
    fontWeight: '600', color: 'white', lineHeight: '1.35',
    background: bg, transition: 'all 0.3s ease', ...extra
  });

  const emptyCell = { borderRadius: '6px', background: '#f0f4f7', minHeight: '46px' };

  return (
    <div style={{ background: '#1a2e3a', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 28px 60px rgba(26,46,58,0.28)' }}>
      {/* Header bar */}
      <div style={{ background: '#243d4d', padding: '11px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: 'white', fontWeight: '700', fontSize: '13px' }}>Timetable Demo</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {conflict && (
            <span style={{ background: '#ef4444', color: 'white', fontSize: '9px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', animation: 'pulse 0.6s infinite alternate' }}>
              CONFLICT
            </span>
          )}
          {resolved && (
            <span style={{ background: '#22c55e', color: 'white', fontSize: '9px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px' }}>
              RESOLVED
            </span>
          )}
          <span style={{ background: '#22c55e', color: 'white', fontSize: '9px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px' }}>LIVE</span>
        </div>
      </div>

      {/* Grid */}
      <div style={{ background: 'white', padding: '12px' }}>
        {/* Column headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '58px repeat(3,1fr)', gap: '5px', marginBottom: '5px' }}>
          {['Time', 'Monday', 'Tuesday', 'Wednesday'].map(h => (
            <div key={h} style={{ background: '#2d4a5a', color: 'white', padding: '8px 6px', borderRadius: '6px', fontSize: '10px', fontWeight: '700', textAlign: 'center' }}>{h}</div>
          ))}
        </div>

        {/* 9:00 row */}
        <div style={{ display: 'grid', gridTemplateColumns: '58px repeat(3,1fr)', gap: '5px', marginBottom: '5px', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#7a9aaa', fontWeight: '600' }}>9:00</div>
          <div style={cellStyle('#2d4a5a')}>Prof. Practices<br /><span style={{ opacity: 0.75, fontWeight: '400', fontSize: '9px' }}>Ms. Surayya · C-60</span></div>
          <div style={emptyCell} />
          {/* The cell being dragged into / conflict cell */}
          <div style={{
            ...cellStyle(
              conflict ? '#ef4444' : resolved ? '#22c55e' : dropped ? '#4a7a93' : '#f0f4f7',
              { color: dropped ? 'white' : 'transparent', position: 'relative',
                boxShadow: conflict ? '0 0 0 2px #ef4444' : resolved ? '0 0 0 2px #22c55e' : 'none' }
            )
          }}>
            {dropped ? (
              <>Web Eng<br /><span style={{ opacity: 0.75, fontWeight: '400', fontSize: '9px' }}>Ms. Hira · C-61</span></>
            ) : null}
          </div>
        </div>

        {/* 10:00 row */}
        <div style={{ display: 'grid', gridTemplateColumns: '58px repeat(3,1fr)', gap: '5px', marginBottom: '8px', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#7a9aaa', fontWeight: '600' }}>10:00</div>
          <div style={emptyCell} />
          <div style={cellStyle('#4a7a93')}>AI<br /><span style={{ opacity: 0.75, fontWeight: '400', fontSize: '9px' }}>Ms. Arifa · B-16</span></div>
          {/* The dragging card */}
          <div style={{ position: 'relative' }}>
            <div style={emptyCell} />
            {dragging && (
              <div style={{
                position: 'absolute', top: '-8px', left: '8px', zIndex: 10,
                background: '#4a7a93', borderRadius: '6px', padding: '7px 9px',
                color: 'white', fontSize: '10px', fontWeight: '700',
                boxShadow: '0 10px 24px rgba(74,122,147,0.5)',
                transform: 'rotate(-4deg) scale(1.05)',
                transition: 'all 0.3s ease', lineHeight: '1.35', minWidth: '90px'
              }}>
                Web Eng<br /><span style={{ opacity: 0.75, fontWeight: '400', fontSize: '9px' }}>Ms. Hira · C-61</span>
              </div>
            )}
          </div>
        </div>

        {/* Status bar */}
        <div style={{
          background: conflict ? '#fef2f2' : resolved ? '#dcfce7' : dragging ? '#eff6ff' : '#1a2e3a',
          color: conflict ? '#dc2626' : resolved ? '#16a34a' : dragging ? '#2563eb' : 'white',
          borderRadius: '6px', padding: '7px 12px',
          textAlign: 'center', fontSize: '10px', fontWeight: '700',
          transition: 'all 0.4s ease',
          border: conflict ? '1px solid #fecaca' : resolved ? '1px solid #86efac' : 'none'
        }}>
          {step === 0 && 'Drag & Drop to Reschedule'}
          {step === 1 && 'Dragging Web Engineering...'}
          {step === 2 && 'Checking for conflicts...'}
          {step === 3 && 'Conflict detected — room already booked!'}
          {step === 4 && 'Conflict resolved — schedule updated'}
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: '8px', background: '#f8fafc', borderRadius: '6px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
          <div style={{ flex: 1, height: '2px', background: '#e0e6ea', borderRadius: '1px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#4a7a93', borderRadius: '1px', width: `${(step / 4) * 100}%`, transition: 'width 0.4s ease' }} />
          </div>
          <span style={{ fontSize: '9px', color: '#7a9aaa', fontFamily: 'monospace' }}>0:0{step} / 0:15</span>
        </div>
      </div>

      <style>{`@keyframes pulse{from{opacity:1}to{opacity:0.5}}`}</style>
    </div>
  );
}

// ── Main Landing Page ───────────────────────────────────────────────────────
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const S = {
    page: { fontFamily: "'Plus Jakarta Sans', sans-serif", background: '#fff', color: '#1a2e3a', overflowX: 'hidden' },

    // NAV
    nav: {
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, height: '64px',
      background: scrolled ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(14px)',
      borderBottom: scrolled ? '1px solid #e8edf0' : '1px solid transparent',
      padding: '0 52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      transition: 'all 0.3s', boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.05)' : 'none'
    },
    navLogo: { display: 'flex', alignItems: 'center', gap: '10px' },
    navLogoImg: { height: '34px', width: '34px', objectFit: 'contain', borderRadius: '8px' },
    navLogoName: { fontSize: '17px', fontWeight: '800', color: '#1a2e3a', lineHeight: 1 },
    navLogoSub: { fontSize: '10px', color: '#7a9aaa', fontWeight: '500' },
    navLinks: { display: 'flex', alignItems: 'center', gap: '34px' },
    navLink: { textDecoration: 'none', color: '#4a6070', fontSize: '14px', fontWeight: '500' },
    navBtn: { background: '#1a2e3a', color: 'white', border: 'none', padding: '9px 22px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' },

    // HERO
    hero: {
      minHeight: '100vh', paddingTop: '64px',
      background: 'linear-gradient(145deg,#d0e6ee 0%,#e4f1f6 45%,#eef5f8 70%,#d8e8ed 100%)',
      display: 'flex', alignItems: 'center', padding: '80px 52px', gap: '56px'
    },
    heroLeft: { flex: 1, maxWidth: '560px' },
    heroTag: { display: 'inline-block', background: '#e8734a', color: 'white', padding: '5px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', marginBottom: '24px', letterSpacing: '0.2px' },
    heroH1: { fontSize: '50px', fontWeight: '800', lineHeight: '1.1', color: '#1a2e3a', marginBottom: '20px', letterSpacing: '-1.5px' },
    heroP: { fontSize: '16px', color: '#4a6070', lineHeight: '1.75', marginBottom: '36px', maxWidth: '460px' },
    heroCta: { background: '#1a2e3a', color: 'white', border: 'none', padding: '15px 34px', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: '9px' },
    heroRight: { flex: '0 0 430px' },

    // FEATURES
    featsSection: { padding: '96px 52px', background: '#f5f3ee' },
    featsInner: { maxWidth: '1060px', margin: '0 auto' },
    featsTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '52px' },
    featsH2: { fontSize: '34px', fontWeight: '800', color: '#1a2e3a', lineHeight: '1.2', maxWidth: '380px' },
    featsBadge: { background: 'white', border: '0.5px solid #dde3e8', padding: '7px 18px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', color: '#4a6070' },
    featsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1px', background: '#d8dedf', borderRadius: '14px', overflow: 'hidden' },
    featCard: (i) => ({ background: i === 1 ? '#ede9e0' : 'white', padding: '36px 28px' }),
    featIcon: { width: '48px', height: '48px', border: '1.5px solid #c0d0d8', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', background: 'white' },
    featTitle: { fontSize: '15px', fontWeight: '700', color: '#1a2e3a', marginBottom: '9px' },
    featDesc: { fontSize: '13px', color: '#6a8090', lineHeight: '1.65' },

    // ABOUT
    aboutSection: { padding: '96px 52px', background: 'white' },
    aboutInner: { maxWidth: '1060px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' },
    aboutLabel: { fontSize: '11px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', color: '#4a7a93', marginBottom: '14px' },
    aboutH2: { fontSize: '34px', fontWeight: '800', color: '#1a2e3a', lineHeight: '1.2', marginBottom: '18px' },
    aboutP: { fontSize: '15px', color: '#5a7080', lineHeight: '1.8', marginBottom: '28px' },
    aboutBtn: { background: 'transparent', color: '#1a2e3a', border: '2px solid #1a2e3a', padding: '11px 26px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' },
    statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
    statCard: { background: '#f5f8fa', borderRadius: '12px', padding: '26px 22px', border: '1px solid #e8edf0' },
    statNum: { fontSize: '34px', fontWeight: '800', color: '#1a2e3a', lineHeight: 1 },
    statLabel: { fontSize: '13px', fontWeight: '700', color: '#2d4a5a', marginTop: '7px' },
    statSub: { fontSize: '11px', color: '#8fa5b0', marginTop: '3px', lineHeight: '1.4' },

    // FOOTER
    footer: { background: '#162430', padding: '56px 52px 0' },
    footerInner: { maxWidth: '820px', margin: '0 auto' },
    footerGrid: { display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr 1fr', gap: '36px', paddingBottom: '48px' },
    footerLogoRow: { display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '12px' },
    footerLogoImg: { width: '34px', height: '34px', borderRadius: '8px', objectFit: 'contain', background: 'rgba(255,255,255,0.1)', padding: '4px' },
    footerBrand: { color: 'white', fontWeight: '800', fontSize: '16px' },
    footerP: { fontSize: '12.5px', lineHeight: '1.65', color: '#7a9aaa', maxWidth: '220px' },
    footerSocials: { display: 'flex', gap: '8px', marginTop: '16px' },
    socialBtn: { width: '34px', height: '34px', border: '1px solid #2d4a5a', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
    footerColHead: { color: 'white', fontSize: '10px', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '14px' },
    footerDivider: { borderTop: '1px solid #2d4a5a', marginBottom: '14px' },
    footerLink: { display: 'block', color: '#7a9aaa', textDecoration: 'none', fontSize: '12.5px', marginBottom: '10px' },
    footerContactRow: { display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '14px' },
    footerContactIcon: { width: '30px', height: '30px', border: '1px solid #2d4a5a', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    footerContactLabel: { fontSize: '9px', letterSpacing: '1px', color: '#4a6070', fontWeight: '700', textTransform: 'uppercase' },
    footerContactVal: { fontSize: '12px', color: '#a8c0cc', marginTop: '1px' },
    footerBottom: { borderTop: '1px solid #2d4a5a', padding: '18px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    footerCopy: { fontSize: '11px', color: '#4a6070' },
    footerLinks: { display: 'flex', gap: '20px' },
    footerSmLink: { fontSize: '11px', color: '#4a6070', textDecoration: 'none' },
  };

  return (
    <div style={S.page}>

      {/* ── NAVBAR ── */}
      <nav style={S.nav}>
        <div style={S.navLogo}>
          <img src="/logo.png" alt="Timecade" style={S.navLogoImg} />
          <div>
            <div style={S.navLogoName}>Timecade</div>
            <div style={S.navLogoSub}>Smart Timetable Management</div>
          </div>
        </div>
        <div style={S.navLinks}>
          {NAV_LINKS.map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} style={S.navLink}>{l}</a>
          ))}
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <button style={S.navBtn}>Login</button>
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section id="home" style={S.hero}>
        <div style={S.heroLeft}>
          <div style={S.heroTag}>CS &amp; SE Department</div>
          <h1 style={S.heroH1}>
            Schedules in<br />perfect cascade
          </h1>
          <p style={S.heroP}>
            The ultimate timetable management system designed for Computer Science and Software Engineering departments. Manage classes, track conflicts, and optimise schedules effortlessly.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <button style={S.heroCta}>
                Get Started
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>
            </Link>
            <a href="#features" style={{ fontSize: '14px', color: '#2d4a5a', fontWeight: '600', textDecoration: 'none' }}>
              See Features
            </a>
          </div>
        </div>
        <div style={S.heroRight}>
          <TimetableDemo />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={S.featsSection}>
        <div style={S.featsInner}>
          <div style={S.featsTop}>
            <h2 style={S.featsH2}>
              Manage schedules with<br />clarity and precision.
            </h2>
            <span style={S.featsBadge}>Services</span>
          </div>
          <div style={S.featsGrid}>
            {FEATURES.map((f, i) => (
              <div key={f.title} style={S.featCard(i)}>
                <div style={S.featIcon}>{f.icon}</div>
                <div style={S.featTitle}>{f.title}</div>
                <div style={S.featDesc}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" style={S.aboutSection}>
        <div style={S.aboutInner}>
          <div>
            <div style={S.aboutLabel}>About Timecade</div>
            <h2 style={S.aboutH2}>Built for JUW's<br />CS &amp; SE Department</h2>
            <p style={S.aboutP}>
              Timecade is a production-ready academic scheduling platform for Jinnah University for Women. It handles everything from batch management to conflict detection, with a role-based system that gives everyone exactly the access they need.
            </p>
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <button style={S.aboutBtn}>Access Dashboard</button>
            </Link>
          </div>
          <div style={S.statsGrid}>
            {[
              { num: '4',   label: 'User Roles',     sub: 'Assistant, Admin, Teacher, Student' },
              { num: '33+', label: 'Teachers',        sub: 'From the 2025 semester PDF' },
              { num: '6',   label: 'Days / Week',     sub: 'Monday through Saturday' },
              { num: '3',   label: 'Conflict Types',  sub: 'Teacher, Room, Batch' },
            ].map(s => (
              <div key={s.label} style={S.statCard}>
                <div style={S.statNum}>{s.num}</div>
                <div style={S.statLabel}>{s.label}</div>
                <div style={S.statSub}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer id="contact" style={S.footer}>
        <div style={S.footerInner}>
          <div style={S.footerGrid}>

            {/* Brand */}
            <div>
              <div style={S.footerLogoRow}>
                <img src="/logo.png" alt="Timecade" style={S.footerLogoImg} />
                <span style={S.footerBrand}>Timecade</span>
              </div>
              <p style={S.footerP}>
                Smart timetable management for CS &amp; SE departments. Manage schedules, resolve conflicts, and stay organised.
              </p>
              <div style={S.footerSocials}>
                <div style={S.socialBtn}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7a9aaa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                  </svg>
                </div>
                <div style={S.socialBtn}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7a9aaa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div>
              <div style={S.footerColHead}>Navigation</div>
              <div style={S.footerDivider} />
              {FOOTER_NAV.map(l => <a key={l} href="#" style={S.footerLink}>{l}</a>)}
            </div>

            {/* Features */}
            <div>
              <div style={S.footerColHead}>Features</div>
              <div style={S.footerDivider} />
              {FOOTER_FEATS.map(l => <a key={l} href="#features" style={S.footerLink}>{l}</a>)}
            </div>

            {/* Contact */}
            <div>
              <div style={S.footerColHead}>Get in Touch</div>
              <div style={S.footerDivider} />
              {[
                { label: 'Email',      val: 'timecade@gmail.com' },
                { label: 'Instagram',  val: '@timecade' },
                { label: 'Department', val: 'CS & SE Dept, Karachi' },
              ].map(c => (
                <div key={c.label} style={S.footerContactRow}>
                  <div style={S.footerContactIcon}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7a9aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="9"/>
                    </svg>
                  </div>
                  <div>
                    <div style={S.footerContactLabel}>{c.label}</div>
                    <div style={S.footerContactVal}>{c.val}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom bar */}
          <div style={S.footerBottom}>
            <span style={S.footerCopy}>2025 Timecade. All rights reserved. Built for CS &amp; SE Department.</span>
            <div style={S.footerLinks}>
              {['Privacy Policy', 'Terms of Use', 'Support'].map(l => (
                <a key={l} href="#" style={S.footerSmLink}>{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}