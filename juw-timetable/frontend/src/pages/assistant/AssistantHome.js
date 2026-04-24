// frontend/src/pages/assistant/AssistantHome.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

export default function AssistantHome() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalBatches:0, totalTeachers:0, totalRooms:0, totalClasses:0 });

  useEffect(() => {
    api.get('/office/stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  const cards = [
    { label:'Total Batches',  value: stats.totalBatches,  sub:'Active Batches'    },
    { label:'Total Teachers', value: stats.totalTeachers, sub:'Teaching Staff'    },
    { label:'Classrooms',     value: stats.totalRooms,    sub:'Available Rooms'   },
    { label:'Total Classes',  value: stats.totalClasses,  sub:'Scheduled Classes' },
  ];

  return (
    <div className="page-content">
      <div className="stats-grid">
        {cards.map(c => (
          <div className="stat-card" key={c.label}>
            <h3>{c.label}</h3>
            <div className="num">{c.value}</div>
            <div className="sub">{c.sub}</div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-body">
          <div className="welcome-banner">
            <strong>Welcome, {user?.full_name?.split(' ').slice(0,2).join(' ')}!</strong><br />
            You are logged in as <strong>Office Assistant</strong>. Use the sidebar to manage
            timetables, courses, rooms, and approve admin requests.
          </div>
        </div>
      </div>
    </div>
  );
}
