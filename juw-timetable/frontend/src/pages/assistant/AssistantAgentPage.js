import React, { useState } from 'react';
import { Bot, Send, Sparkles, AlertTriangle, CheckCircle2, ClipboardList } from 'lucide-react';
import api from '../../utils/api';
import { useResponsive } from '../../hooks/useResponsive';

const quickPrompts = [
  "Show today's timetable",
  'Show pending requests',
  'Find available rooms on Monday slot 2',
  'Show workload report for all teachers',
  'Check Room A-301 availability on Tuesday slot 3',
];

function ResultTable({ rows }) {
  if (!rows?.length) return null;
  const columns = ['course', 'batch', 'teacher', 'classroom', 'day', 'time', 'availabilityStatus', 'conflictStatus'];
  const labels = {
    course: 'Course',
    batch: 'Batch',
    teacher: 'Teacher',
    classroom: 'Classroom',
    day: 'Day',
    time: 'Time',
    availabilityStatus: 'Availability',
    conflictStatus: 'Conflict',
  };
  return (
    <div style={{ overflowX: 'auto', marginTop: 12 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720, fontSize: 12 }}>
        <thead>
          <tr style={{ background: '#2d4a5a', color: 'white' }}>
            {columns.map(col => (
              <th key={col} style={{ padding: '9px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>
                {labels[col]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row.id || idx} style={{ borderBottom: '1px solid #e8edf0' }}>
              {columns.map(col => (
                <td key={col} style={{ padding: '9px 10px', color: col === 'course' ? '#1a2e3a' : '#526b78', fontWeight: col === 'course' ? 700 : 500 }}>
                  {row[col] || '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PendingRequestsList({ rows }) {
  if (!rows?.length) return null;
  return (
    <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
      {rows.map((row, idx) => (
        <div key={row.id || idx} style={{
          border: '1px solid #dde7ec',
          borderRadius: 8,
          padding: 12,
          background: '#f9fbfc',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#2d4a5a' }}>Request #{row.id}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#6b8794', background: '#eef3f6', borderRadius: 999, padding: '3px 8px', textTransform: 'uppercase' }}>
              {row.type || 'update'} · {row.entity || 'timetable'}
            </span>
          </div>
          {row.requestedBy && (
            <div style={{ fontSize: 11.5, color: '#526b78', marginBottom: 4 }}>Requested by: {row.requestedBy}</div>
          )}
          {row.data && (
            <div style={{ fontSize: 11.5, color: '#233844', lineHeight: 1.5 }}>
              {row.data.subject_name || row.data.old_subject_name ? (row.data.subject_name || row.data.old_subject_name) : ''}
              {row.data.batch_name || row.data.old_batch_name ? ` · ${row.data.batch_name || row.data.old_batch_name}` : ''}
              {row.data.old_day ? ` · from ${row.data.old_day} ${row.data.old_slot_label || ''}` : ''}
              {row.data.day ? ` → ${row.data.day} ${row.data.slot_label || ''}` : ''}
              {row.data.old_room_code || row.data.room_code ? ` · Room ${row.data.room_code || row.data.old_room_code}` : ''}
              {row.data.teacher_reason ? ` · Reason: ${row.data.teacher_reason}` : ''}
            </div>
          )}
          {row.createdAt && (
            <div style={{ fontSize: 10.5, color: '#8a9ba5', marginTop: 6 }}>
              {new Date(row.createdAt).toLocaleString()}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ReportTable({ report }) {
  if (!report?.length) return null;
  const isRoomReport = 'utilizationPercent' in report[0];
  const columns = isRoomReport ? ['room', 'capacity', 'bookedHours', 'utilizationPercent'] : ['teacher', 'lectures', 'hours'];
  const labels = {
    room: 'Room',
    capacity: 'Capacity',
    bookedHours: 'Booked Hrs/Week',
    utilizationPercent: 'Utilization',
    teacher: 'Teacher',
    lectures: 'Lectures',
    hours: 'Hours/Week',
  };
  return (
    <div style={{ overflowX: 'auto', marginTop: 12 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480, fontSize: 12 }}>
        <thead>
          <tr style={{ background: '#2d4a5a', color: 'white' }}>
            {columns.map(col => (
              <th key={col} style={{ padding: '9px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>
                {labels[col]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {report.map((row, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #e8edf0' }}>
              {columns.map(col => (
                <td key={col} style={{ padding: '9px 10px', color: col === 'teacher' || col === 'room' ? '#1a2e3a' : '#526b78', fontWeight: col === 'teacher' || col === 'room' ? 700 : 500 }}>
                  {col === 'utilizationPercent' ? `${row[col]}%` : (row[col] ?? '-')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NoticeList({ title, items, tone }) {
  if (!items?.length) return null;
  const isConflict = tone === 'danger';
  return (
    <div style={{
      marginTop: 12,
      border: `1px solid ${isConflict ? '#fecaca' : '#b8d9f5'}`,
      background: isConflict ? '#fef2f2' : '#eef7ff',
      borderRadius: 8,
      padding: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: isConflict ? '#b91c1c' : '#1a5a7a', fontSize: 12, fontWeight: 800, marginBottom: 8 }}>
        {isConflict ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
        {title}
      </div>
      <div style={{ display: 'grid', gap: 7 }}>
        {items.map((item, idx) => (
          <div key={idx} style={{ color: isConflict ? '#7f1d1d' : '#1d4f68', fontSize: 12, lineHeight: 1.45 }}>
            {item.message || `${item.day || ''} ${item.time || ''} ${item.classroom || ''}`.trim()}
          </div>
        ))}
      </div>
    </div>
  );
}

function AgentMessage({ message }) {
  const isUser = message.role === 'user';
  const data = message.data;
  const isRequestList = data?.intent === 'view_pending_requests';
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 14 }}>
      <div style={{
        width: isUser ? 'auto' : '100%',
        maxWidth: isUser ? '78%' : '100%',
        background: isUser ? '#2d4a5a' : 'white',
        color: isUser ? 'white' : '#1a2e3a',
        border: isUser ? 'none' : '1px solid #dde7ec',
        borderRadius: 10,
        padding: isUser ? '10px 13px' : 14,
        boxShadow: isUser ? 'none' : '0 4px 12px rgba(36, 64, 80, 0.06)',
      }}>
        {isUser ? (
          <div style={{ fontSize: 13, lineHeight: 1.45 }}>{message.text}</div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Bot size={16} color="#2d4a5a" />
              <span style={{ fontSize: 12, fontWeight: 800, color: '#2d4a5a' }}>Assistant AI Agent</span>
              {data?.intent && <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: '#6b8794', background: '#f0f5f8', borderRadius: 999, padding: '3px 8px' }}>{data.intent.replace(/_/g, ' ')}</span>}
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.5, color: '#233844' }}>{data?.summary || message.text}</div>
            <NoticeList title="Missing details" items={data?.missing?.map(m => ({ message: m }))} tone="info" />
            <NoticeList title="Conflict status" items={data?.conflicts} tone="danger" />
            {isRequestList ? <PendingRequestsList rows={data?.rows} /> : <ResultTable rows={data?.rows} />}
            <ReportTable report={data?.report} />
            <NoticeList title="Suggested alternatives" items={data?.alternatives} tone="info" />
          </>
        )}
      </div>
    </div>
  );
}

function TypingBubble() {
  const dot = (delay) => ({
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#7a9aaa',
    animation: `ttTyping 1.2s infinite ${delay}s`,
  });

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 14 }}>
      <style>{`
        @keyframes ttTyping {
          0%, 80%, 100% { opacity: .35; transform: translateY(0); }
          40% { opacity: 1; transform: translateY(-4px); }
        }
      `}</style>
      <div style={{
        maxWidth: 170,
        background: 'white',
        border: '1px solid #dde7ec',
        borderRadius: '12px 12px 12px 4px',
        padding: '11px 13px',
        boxShadow: '0 4px 12px rgba(36, 64, 80, 0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Bot size={15} color="#2d4a5a" />
          <span style={{ fontSize: 11, fontWeight: 800, color: '#2d4a5a' }}>Agent</span>
        </div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center', height: 10 }}>
          <span style={dot(0)} />
          <span style={dot(0.15)} />
          <span style={dot(0.3)} />
        </div>
      </div>
    </div>
  );
}

export default function AssistantAgentPage() {
  const { isMobile } = useResponsive();
  const [messages, setMessages] = useState([
    {
      role: 'agent',
      data: {
        intent: 'ready',
        summary: 'Ask me to schedule, reschedule, or cancel a class, assign a teacher, check availability or conflicts, review pending requests, or run a workload/utilization report.',
      },
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendMessage = async (text) => {
    const prompt = text.trim();
    if (!prompt || loading) return;
    setError('');
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: prompt }]);
    setLoading(true);
    try {
      const res = await api.post('/assistant-agent/message', { message: prompt });
      setMessages(prev => [...prev, { role: 'agent', data: res.data }]);
    } catch (err) {
      setError(err.response?.data?.message || 'The agent could not process this request.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="page-content" style={{ padding: isMobile ? 12 : 20 }}>
      <div className="card" style={{ minHeight: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column' }}>
        <div className="card-header" style={{ alignItems: 'center' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bot size={16} /> Assistant AI Agent
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#aabbc8', fontSize: 12 }}>
            <Sparkles size={14} /> Live scheduling & admin actions
          </div>
        </div>

        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1, minHeight: 0 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(5, minmax(0, 1fr))',
            gap: 8,
          }}>
            {quickPrompts.map(prompt => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                disabled={loading}
                style={{
                  minHeight: 38,
                  border: '1px solid #d8e4ea',
                  background: '#f7fafc',
                  color: '#2d4a5a',
                  borderRadius: 7,
                  padding: '8px 10px',
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                }}
              >
                {prompt}
              </button>
            ))}
          </div>

          <div style={{
            flex: 1,
            minHeight: 360,
            overflowY: 'auto',
            background: '#f6f9fb',
            border: '1px solid #e1eaef',
            borderRadius: 10,
            padding: isMobile ? 10 : 16,
          }}>
            {messages.map((message, idx) => <AgentMessage key={idx} message={message} />)}
            {loading && <TypingBubble />}
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', color: '#b91c1c', fontSize: 12, fontWeight: 600 }}>
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <ClipboardList size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#7a9aaa' }} />
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Example: Schedule AI lecture for BSCS-5A on Monday slot 2 in Room A-204"
                style={{
                  width: '100%',
                  border: '1px solid #cfdde5',
                  borderRadius: 8,
                  padding: '11px 12px 11px 36px',
                  fontSize: 13,
                  outline: 'none',
                  color: '#1a2e3a',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !input.trim()}
              title="Send request"
              style={{
                width: 44,
                height: 42,
                border: 'none',
                borderRadius: 8,
                background: loading || !input.trim() ? '#9db2bd' : '#2d4a5a',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              <Send size={17} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}