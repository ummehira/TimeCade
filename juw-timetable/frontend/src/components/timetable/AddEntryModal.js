// frontend/src/components/timetable/AddEntryModal.js
import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import api from '../../utils/api';

const DAYS  = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const SLOTS = [
  { id:1, label:'9:00 - 10:00'  },
  { id:2, label:'10:00 - 11:00' },
  { id:3, label:'11:00 - 12:00' },
  { id:4, label:'12:00 - 1:00'  },
  { id:5, label:'1:00 - 2:00'   },
];

export default function AddEntryModal({ onClose, onSave }) {
  const [form, setForm]         = useState({ batch_id:'', subject_id:'', teacher_id:'', room_id:'', day:'', time_slot:'', is_lab:false });
  const [batches, setBatches]   = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/office/batches'),
      api.get('/office/subjects'),
      api.get('/office/teachers'),
      api.get('/office/rooms'),
    ]).then(([b, s, t, r]) => {
      setBatches(b.data);
      setSubjects(s.data);
      setTeachers(t.data);
      setRooms(r.data.filter(x => x.is_available));
    });
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await onSave(form); }
    catch (err) { setError(err.response?.data?.message || 'Failed to save.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3><Plus size={15} /> Add Timetable Entry</h3>
          <button className="icon-btn" onClick={onClose}><X size={17} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="login-error" style={{ marginBottom: '14px' }}>{error}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label>Batch</label>
                <select required value={form.batch_id} onChange={e => set('batch_id', e.target.value)}>
                  <option value="">Select Batch</option>
                  {batches.map(b => <option key={b.id} value={b.id}>{b.batch_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Subject</label>
                <select required value={form.subject_id} onChange={e => set('subject_id', e.target.value)}>
                  <option value="">Select Subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Teacher</label>
                <select required value={form.teacher_id} onChange={e => set('teacher_id', e.target.value)}>
                  <option value="">Select Teacher</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Room</label>
                <select required value={form.room_id} onChange={e => set('room_id', e.target.value)}>
                  <option value="">Select Room</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.room_id} (cap: {r.capacity})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Day</label>
                <select required value={form.day} onChange={e => set('day', e.target.value)}>
                  <option value="">Select Day</option>
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Time Slot</label>
                <select required value={form.time_slot} onChange={e => set('time_slot', e.target.value)}>
                  <option value="">Select Slot</option>
                  {SLOTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" id="is_lab" checked={form.is_lab} onChange={e => set('is_lab', e.target.checked)} style={{ width: 'auto' }} />
              <label htmlFor="is_lab" style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', textTransform: 'none', letterSpacing: 0 }}>
                This is a lab session
              </label>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Plus size={13} /> {loading ? 'Saving...' : 'Add Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
