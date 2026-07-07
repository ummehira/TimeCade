import React, { useState, useRef, useEffect } from 'react';
import api from '../../utils/api';

const NAVY   = '#2d4a5a';
const NAVY_D = '#223946';
const GREEN  = '#3a6070';

// ── Small structured blocks rendered inside an agent bubble ──────────────
function ResultTable({ rows }) {
  if (!rows?.length) return null;
  const cols = ['Course', 'Batch', 'Teacher', 'Classroom', 'Day', 'Time', 'Availability', 'Conflict'];
  const keys = ['course', 'batch', 'teacher', 'classroom', 'day', 'time', 'availabilityStatus', 'conflictStatus'];
  return (
    <div style={{ marginTop: 10, overflowX: 'auto', borderRadius: 8, border: '1px solid #e0e8ed' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr>
            {cols.map(h => (
              <th key={h} style={{
                background: '#f0f4f7', color: '#5a7080', textTransform: 'uppercase',
                letterSpacing: '0.4px', fontSize: 10, fontWeight: 700,
                padding: '8px 10px', textAlign: 'left', whiteSpace: 'nowrap',
                borderBottom: '1px solid #e0e8ed'
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderTop: i ? '1px solid #f0f4f7' : 'none' }}>
              {keys.map(k => (
                <td key={k} style={{ padding: '8px 10px', color: '#1a2e3a', whiteSpace: 'nowrap' }}>
                  {r[k] || '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ConflictList({ conflicts }) {
  if (!conflicts?.length) return null;
  return (
    <div style={{
      marginTop: 10, background: '#fef2f2', border: '1px solid #fecaca',
      borderRadius: 8, padding: '10px 12px'
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
        Conflicts
      </div>
      {conflicts.map((c, i) => (
        <div key={i} style={{ fontSize: 12.5, color: '#9b1c1c', display: 'flex', gap: 6, marginBottom: 2 }}>
          <span style={{ fontWeight: 700 }}>✕</span>{c.message}
        </div>
      ))}
    </div>
  );
}

function AlternativesList({ alternatives, onPick }) {
  if (!alternatives?.length) return null;
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#5a7080', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
        Suggested Alternatives
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {alternatives.map((a, i) => (
          <button
            key={i}
            onClick={() => onPick?.(a)}
            style={{
              background: '#eaf2f6', border: `1px solid #cfe0e8`, color: NAVY,
              borderRadius: 20, padding: '6px 12px', fontSize: 12, fontWeight: 600,
              cursor: onPick ? 'pointer' : 'default', fontFamily: 'inherit'
            }}
          >
            {a.day} · {a.time} · {a.classroom}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Typing indicator ──────────────────────────────────────────────────────
function TypingBubble() {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 14 }}>
      <Avatar />
      <div style={{
        background: 'white', border: '1px solid #e0e8ed', borderRadius: '14px 14px 14px 4px',
        padding: '12px 16px', display: 'flex', gap: 4, alignItems: 'center'
      }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: 6, height: 6, borderRadius: '50%', background: '#aabbc8',
            display: 'inline-block', animation: `ta-bounce 1.2s ${i * 0.15}s infinite ease-in-out`
          }} />
        ))}
      </div>
    </div>
  );
}

function Avatar() {
  return (
    <div style={{
      width: 30, height: 30, borderRadius: '50%', background: NAVY, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 2
    }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <circle cx="12" cy="5" r="2" />
        <line x1="12" y1="7" x2="12" y2="11" />
        <line x1="8" y1="16" x2="8" y2="16" />
        <line x1="16" y1="16" x2="16" y2="16" />
      </svg>
    </div>
  );
}

// ── One chat bubble ───────────────────────────────────────────────────────
function Bubble({ msg, onPickAlternative }) {
  const isUser = msg.role === 'user';
  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <div style={{
          maxWidth: '72%', background: NAVY, color: 'white', borderRadius: '14px 14px 4px 14px',
          padding: '11px 15px', fontSize: 13.5, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word'
        }}>
          {msg.text}
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 14 }}>
      <Avatar />
      <div style={{
        maxWidth: '78%', background: 'white', border: msg.isError ? '1px solid #fecaca' : '1px solid #e0e8ed',
        borderRadius: '14px 14px 14px 4px', padding: '12px 16px'
      }}>
        <div style={{ fontSize: 13.5, lineHeight: 1.55, color: msg.isError ? '#b91c1c' : '#1a2e3a' }}>
          {msg.text}
        </div>
        <ResultTable rows={msg.rows} />
        <ConflictList conflicts={msg.conflicts} />
        <AlternativesList alternatives={msg.alternatives} onPick={onPickAlternative} />
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────
export default function TeacherAgentPage() {
  const [messages, setMessages] = useState([
    {
      role: 'agent',
      text: "Hi, I'm your timetable assistant. Ask me about your schedule, check your availability, or request a reschedule — for example: \u201cAm I free on Thursday at 11?\u201d or \u201cMove my DBMS class to Friday 10am.\u201d"
    }
  ]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const taRef     = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setMessages(m => [...m, { role: 'user', text }]);
    setInput('');
    if (taRef.current) taRef.current.style.height = 'auto';
    setLoading(true);

    try {
      const res = await api.post('/teacher-agent/message', { message: text });
      const data = res.data || {};
      setMessages(m => [...m, {
        role: 'agent',
        text: data.summary || 'Done.',
        rows: data.rows,
        conflicts: data.conflicts,
        alternatives: data.alternatives,
      }]);
    } catch (err) {
      setMessages(m => [...m, {
        role: 'agent',
        isError: true,
        text: err.response?.data?.message || 'Sorry, the agent could not process that request.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const onPickAlternative = alt => {
    setInput(`Move my class to ${alt.day} at ${alt.time} in ${alt.classroom}`);
    taRef.current?.focus();
  };

  const autoGrow = e => {
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px';
  };

  return (
    <div className="page-content" style={{ padding: 20, height: '100%', boxSizing: 'border-box' }}>
      <style>{`
        @keyframes ta-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
        .ta-scroll::-webkit-scrollbar { width: 6px; }
        .ta-scroll::-webkit-scrollbar-thumb { background: #dde3e8; border-radius: 3px; }
      `}</style>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 110px)', minHeight: 480, overflow: 'hidden' }}>

        {/* Header */}
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid #e0e8ed', background: 'white',
          display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg, ${NAVY}, ${GREEN})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><line x1="12" y1="7" x2="12" y2="11" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#1a2e3a' }}>Teacher AI Agent</div>
            <div style={{ fontSize: 11, color: '#7a9aaa' }}>
              {loading ? 'Thinking…' : 'Ask about your timetable, availability, or reschedule requests'}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="ta-scroll" style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', background: '#f8fafc' }}>
          {messages.map((m, i) => (
            <Bubble key={i} msg={m} onPickAlternative={onPickAlternative} />
          ))}
          {loading && <TypingBubble />}
          <div ref={bottomRef} />
        </div>

        {/* Composer */}
        <div style={{ borderTop: '1px solid #e0e8ed', background: 'white', padding: 14, flexShrink: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: 10, background: '#f8fafc',
            border: '1px solid #dde3e8', borderRadius: 14, padding: '8px 8px 8px 14px'
          }}>
            <textarea
              ref={taRef}
              value={input}
              onChange={e => { setInput(e.target.value); autoGrow(e); }}
              onKeyDown={onKeyDown}
              placeholder="Ask about your timetable, availability, or reschedule request…"
              rows={1}
              style={{
                flex: 1, resize: 'none', border: 'none', outline: 'none', background: 'transparent',
                fontFamily: 'inherit', fontSize: 13.5, lineHeight: 1.5, color: '#1a2e3a',
                padding: '6px 0', maxHeight: 140
              }}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              style={{
                background: (loading || !input.trim()) ? '#aabbc8' : NAVY, border: 'none', color: 'white',
                width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: (loading || !input.trim()) ? 'not-allowed' : 'pointer',
                flexShrink: 0, transition: 'background 0.15s'
              }}
              aria-label="Send message"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <div style={{ fontSize: 10.5, color: '#aabbc8', marginTop: 6, paddingLeft: 4 }}>
            Press Enter to send · Shift + Enter for a new line
          </div>
        </div>
      </div>
    </div>
  );
}