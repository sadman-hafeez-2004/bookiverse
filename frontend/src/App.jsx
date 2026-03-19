import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore, useOnlineStore } from './store';
import { getSocket } from './lib/socket';

import Navbar          from './components/Navbar';
import ProtectedRoute  from './components/ProtectedRoute';
import { Toasts }      from './components/ui';

import PublicHome  from './pages/PublicHome';
import Home        from './pages/Home';
import { LoginPage, RegisterPage } from './pages/Auth';
import Profile     from './pages/Profile';
import BookDetail  from './pages/BookDetail';
import Chat        from './pages/Chat';
import {
  ReadersPage, UploadPage, SettingsPage,
  AuthorDetailPage, SearchPage, AdminPage,
} from './pages/Pages';

function AppInner() {
  const { user, loading, init } = useAuthStore();
  const { setOnline, setOffline, setAll } = useOnlineStore();

  useEffect(() => { init(); }, []);

  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    if (!socket) return;
    socket.emit('users:online');
    socket.on('users:online', ({ onlineUsers }) => setAll(onlineUsers));
    socket.on('user:online',  ({ userId }) => setOnline(userId));
    socket.on('user:offline', ({ userId }) => setOffline(userId));
    return () => {
      socket.off('users:online');
      socket.off('user:online');
      socket.off('user:offline');
    };
  }, [user]);

  if (loading) return null;

  return (
    <>
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/"         element={user ? <Home /> : <PublicHome />} />
        <Route path="/login"    element={user ? <Navigate to="/" /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <RegisterPage />} />
        <Route path="/books/:id"   element={<BookDetail />} />
        <Route path="/authors/:id" element={<AuthorDetailPage />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/readers"     element={<ReadersPage />} />
        <Route path="/search"      element={<SearchPage />} />

        {/* Protected */}
        <Route path="/upload"   element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/chat"               element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/chat/:conversationId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Toasts />
    </>
  );
}

export default function App() {
  return <BrowserRouter><AppInner /></BrowserRouter>;
}
