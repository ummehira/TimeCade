// frontend/src/context/SemesterContext.js
// One global "active semester". The office switches it once (top bar) and every
// page — batch/teacher/room timetables, batches, dashboards, AI agent — follows it.
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

export const SEMESTER_OPTIONS = [1, 2];
export const semesterLabel = n => n === 1 ? 'Session 1 (First Semester)' : n === 2 ? 'Session 2 (Second Semester)' : `Session ${n}`;
export const semesterShort = n => n === 1 ? '1st Sem' : n === 2 ? '2nd Sem' : `Sem ${n}`;

const SemesterContext = createContext({ semester: 1, loading: true, canChange: false, changeSemester: async () => {} });

export function SemesterProvider({ children }) {
  const { user } = useAuth();
  const [semester, setSemester] = useState(1);
  const [loading,  setLoading]  = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const r = await api.get('/settings/active-semester');
      setSemester(r.data.semester);
    } catch (_) { /* keep default */ }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const changeSemester = async n => {
    const r = await api.put('/settings/active-semester', { semester: n });
    setSemester(r.data.semester);
    return r.data.semester;
  };

  const canChange = user?.role === 'office_assistant' || user?.role === 'department_admin';

  return (
    <SemesterContext.Provider value={{ semester, loading, canChange, changeSemester, refresh }}>
      {children}
    </SemesterContext.Provider>
  );
}

export const useSemester = () => useContext(SemesterContext);
