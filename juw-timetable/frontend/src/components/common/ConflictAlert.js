// frontend/src/components/common/ConflictAlert.js
import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConflictAlert({ conflicts, onClose }) {
  if (!conflicts?.length) return null;
  return (
    <div className="conflict-overlay">
      <div className="conflict-modal">
        <div className="conflict-header">
          <AlertTriangle size={20} />
          <h3>Scheduling Conflict Detected</h3>
        </div>
        <div className="conflict-body">
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '14px' }}>
            The following conflicts must be resolved before saving.
          </p>
          {conflicts.map((c, i) => (
            <div className="conflict-item" key={i}>
              <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>{c.message}</span>
            </div>
          ))}
        </div>
        <div className="conflict-footer">
          <button className="btn btn-danger" onClick={onClose}>
            <X size={13} /> Close and Resolve
          </button>
        </div>
      </div>
    </div>
  );
}
