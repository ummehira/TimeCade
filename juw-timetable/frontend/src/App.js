// frontend/src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import LandingPage        from './pages/LandingPage';
import LoginPage          from './pages/LoginPage';
import AssistantDashboard from './pages/assistant/AssistantDashboard';
import TeacherDashboard   from './pages/teacher/TeacherDashboard';
import StudentDashboard   from './pages/student/StudentDashboard';

// ── Route guard ───────────────────────────────────────────────────────────
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!user)   return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role))
    return <Navigate to="/login" replace />;
  return children;
}

// ── After login redirect each role to its dashboard ───────────────────────
function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const map = {
    office_assistant: '/assistant',
    teacher:          '/teacher',
    student:          '/student',
  };
  return <Navigate to={map[user.role] || '/login'} replace />;
}
// ── App ───────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/"          element={<LandingPage />} />
          <Route path="/login"     element={<LoginPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />

          {/* Office Assistant */}
          <Route path="/assistant/*" element={
            <ProtectedRoute allowedRoles={['office_assistant']}>
              <AssistantDashboard />
            </ProtectedRoute>
          } />
          {/* Teacher */}
          <Route path="/teacher/*" element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherDashboard />
            </ProtectedRoute>
          } />

          {/* Student */}
          <Route path="/student/*" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}