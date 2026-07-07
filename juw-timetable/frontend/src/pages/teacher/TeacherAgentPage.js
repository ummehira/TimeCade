import React, { useState } from 'react';
import api from '../../utils/api';

export default function TeacherAgentPage() {
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState(null);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!message.trim()) return;

    setLoading(true);

    try {
      const res = await api.post('/teacher-agent/message', {
        message,
      });

      setReply(res.data);
    } catch (err) {
      setReply({
        summary: err.response?.data?.message || 'Agent failed.',
        rows: [],
        conflicts: [],
        alternatives: [],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content" style={{ padding: 20 }}>
      <div className="card">
        <div className="card-header">
          <h2>Teacher AI Agent</h2>
        </div>

        <div className="card-body">
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Ask about your timetable, availability, or reschedule request..."
            style={{
              width: '100%',
              minHeight: 100,
              padding: 12,
              borderRadius: 8,
              border: '1px solid #dde3e8',
              fontFamily: 'inherit',
            }}
          />

          <button
            onClick={send}
            disabled={loading}
            style={{
              marginTop: 12,
              background: '#2d4a5a',
              color: 'white',
              border: 'none',
              borderRadius: 7,
              padding: '10px 18px',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            {loading ? 'Checking...' : 'Ask Agent'}
          </button>

          {reply && (
            <div style={{ marginTop: 20 }}>
              <h3>Response</h3>
              <p>{reply.summary}</p>

              {reply.rows?.length > 0 && (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
                  <thead>
                    <tr>
                      {['Course', 'Batch', 'Teacher', 'Classroom', 'Day', 'Time', 'Availability', 'Conflict'].map(h => (
                        <th key={h} style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reply.rows.map((r, i) => (
                      <tr key={i}>
                        <td style={{ border: '1px solid #ddd', padding: 8 }}>{r.course || '-'}</td>
                        <td style={{ border: '1px solid #ddd', padding: 8 }}>{r.batch || '-'}</td>
                        <td style={{ border: '1px solid #ddd', padding: 8 }}>{r.teacher || '-'}</td>
                        <td style={{ border: '1px solid #ddd', padding: 8 }}>{r.classroom || '-'}</td>
                        <td style={{ border: '1px solid #ddd', padding: 8 }}>{r.day || '-'}</td>
                        <td style={{ border: '1px solid #ddd', padding: 8 }}>{r.time || '-'}</td>
                        <td style={{ border: '1px solid #ddd', padding: 8 }}>{r.availabilityStatus || '-'}</td>
                        <td style={{ border: '1px solid #ddd', padding: 8 }}>{r.conflictStatus || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {reply.conflicts?.length > 0 && (
                <>
                  <h4>Conflicts</h4>
                  <ul>
                    {reply.conflicts.map((c, i) => (
                      <li key={i}>{c.message}</li>
                    ))}
                  </ul>
                </>
              )}

              {reply.alternatives?.length > 0 && (
                <>
                  <h4>Suggested Alternatives</h4>
                  <ul>
                    {reply.alternatives.map((a, i) => (
                      <li key={i}>
                        {a.day} - {a.time} - {a.classroom}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}