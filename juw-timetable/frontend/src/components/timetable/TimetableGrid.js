// frontend/src/components/timetable/TimetableGrid.js
import React, { useState, useRef } from 'react';
import { Trash2 } from 'lucide-react';

const DAYS  = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const SLOTS = [
  { id:1, label:'9:00 - 10:00'  },
  { id:2, label:'10:00 - 11:00' },
  { id:3, label:'11:00 - 12:00' },
  { id:4, label:'12:00 - 1:00'  },
  { id:5, label:'1:00 - 2:00'   },
];

export default function TimetableGrid({ entries = [], canEdit = false, onDrop, onDelete }) {
  const [dragOver, setDragOver] = useState(null);
  const dragRef = useRef(null);

  // Build grid lookup
  const grid = {};
  DAYS.forEach(d => { grid[d] = {}; SLOTS.forEach(s => { grid[d][s.id] = []; }); });
  entries.forEach(e => {
    if (grid[e.day]?.[e.time_slot] !== undefined) grid[e.day][e.time_slot].push(e);
  });

  const onDragStart = (e, entry) => { dragRef.current = entry; e.dataTransfer.effectAllowed = 'move'; };
  const onDragOver  = (e, day, slot) => { e.preventDefault(); setDragOver(`${day}-${slot}`); };
  const onDragLeave = () => setDragOver(null);
  const onDropCell  = (e, day, slot) => {
    e.preventDefault(); setDragOver(null);
    if (dragRef.current && onDrop) onDrop(dragRef.current, day, slot);
    dragRef.current = null;
  };

  return (
    <div className="tt-wrapper">
      <table className="tt-table">
        <thead>
          <tr>
            <th style={{ width: '85px' }}>Day</th>
            {SLOTS.map(s => <th key={s.id}>{s.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {DAYS.map(day => (
            <tr key={day}>
              <td className="tt-day-label">{day}</td>
              {SLOTS.map(slot => {
                const cellEntries = grid[day][slot.id];
                const isOver      = dragOver === `${day}-${slot.id}`;
                return (
                  <td key={slot.id} style={{ padding: '3px' }}
                    onDragOver={canEdit ? e => onDragOver(e, day, slot.id) : undefined}
                    onDrop={canEdit     ? e => onDropCell(e, day, slot.id) : undefined}
                    onDragLeave={canEdit ? onDragLeave : undefined}
                  >
                    <div className={`tt-drop-zone ${isOver ? 'drag-over' : ''}`}>
                      {cellEntries.length === 0 && isOver && (
                        <div style={{ height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'var(--accent)', fontWeight: 600 }}>
                          Drop here
                        </div>
                      )}
                      {cellEntries.map(entry => (
                        <TimetableCell
                          key={entry.id}
                          entry={entry}
                          canEdit={canEdit}
                          onDragStart={onDragStart}
                          onDelete={onDelete}
                        />
                      ))}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TimetableCell({ entry, canEdit, onDragStart, onDelete }) {
  return (
    <div
      className="tt-cell"
      style={{ background: entry.color || '#4A90D9' }}
      draggable={canEdit}
      onDragStart={canEdit ? e => onDragStart(e, entry) : undefined}
      title={`${entry.subject_name} | ${entry.teacher_name} | ${entry.room_code || entry.room_id}`}
    >
      <div className="tt-cell-subject">{entry.short_name || entry.subject_name}</div>
      <div className="tt-cell-teacher">{entry.teacher_name?.split(' ').slice(-2).join(' ')}</div>
      <div className="tt-cell-room">{entry.room_code || entry.room_id}</div>
      <div className="tt-cell-batch">{entry.batch_name}</div>
      {canEdit && onDelete && (
        <div className="tt-cell-actions">
          <button className="tt-del-btn" onClick={e => { e.stopPropagation(); onDelete(entry.id); }}>
            <Trash2 size={9} />
          </button>
        </div>
      )}
    </div>
  );
}
