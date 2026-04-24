// frontend/src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token      = localStorage.getItem('juw_token');
    const storedUser = localStorage.getItem('juw_user');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (_) {
        localStorage.removeItem('juw_token');
        localStorage.removeItem('juw_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (juw_id, password) => {
    const res = await api.post('/auth/login', { juw_id, password });
    const { token, user } = res.data;
    localStorage.setItem('juw_token', token);
    localStorage.setItem('juw_user', JSON.stringify(user));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('juw_token');
    localStorage.removeItem('juw_user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
