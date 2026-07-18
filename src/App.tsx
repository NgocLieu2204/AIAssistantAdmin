import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { usePairingSessions } from './hooks/usePairingSessions';

import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import MapView from './pages/MapView';
import LoginPage from './pages/LoginPage';
import Users from './pages/Users';
import AppUsers from './pages/AppUsers';

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Tổng quan hệ thống giám sát AIVision' },
  '/devices': { title: 'Thiết bị & Phiên kết nối', subtitle: 'Quản lý tất cả phiên ghép đôi đang hoạt động' },
  '/map': { title: 'Bản đồ SOS', subtitle: 'Vị trí tất cả thiết bị trên bản đồ thời gian thực' },
  '/app-users': { title: 'Quản lý App User', subtitle: 'Danh sách người dùng đã đăng ký qua ứng dụng Android' },
  '/users': { title: 'Quản lý Admin', subtitle: 'Phân quyền và tài khoản quản trị hệ thống' },
};

// Dùng string thay vì kiểu User để tránh lỗi Vite ESM với firebase/auth type
function AppLayout({ userEmail }: { userEmail: string }) {
  const location = useLocation();
  const { sessions } = usePairingSessions();
  const sosSessions = sessions.filter(s => s.status === 'SOS_ACTIVE');

  const pageInfo = PAGE_TITLES[location.pathname] || PAGE_TITLES['/'];

  return (
    <div className="app-layout">
      <Sidebar
        sosCount={sosSessions.length}
        userEmail={userEmail}
      />
      <div className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div>
            <div className="topbar-title">{pageInfo.title}</div>
            <div className="topbar-subtitle">{pageInfo.subtitle}</div>
          </div>
          <div className="topbar-right">
            {sosSessions.length > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                padding: '6px 14px', borderRadius: 99,
                fontSize: 12, fontWeight: 700,
                color: '#ef4444',
                animation: 'pulse-badge 1.5s infinite',
              }}>
                🚨 {sosSessions.length} SOS đang hoạt động
              </div>
            )}
            <div className="live-indicator">
              <div className="live-dot" />
              LIVE
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="page-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/devices" element={<Devices />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/app-users" element={<AppUsers />} />
            <Route path="/users" element={<Users />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  // null = loading, '' = not logged in, string = email của user
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUserEmail(currentUser.email || 'Admin');
      } else {
        setUserEmail('');
      }
    });
    return () => unsubscribe();
  }, []);

  // Đang tải auth state
  if (userEmail === null) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--bg-base)',
        flexDirection: 'column', gap: 16,
      }}>
        <div style={{
          width: 56, height: 56,
          borderRadius: 16,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 30px rgba(99,102,241,0.4)',
          marginBottom: 8,
        }}>
          <span style={{ fontSize: 24 }}>👁</span>
        </div>
        <div className="spinner" />
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Đang xác thực...</div>
      </div>
    );
  }

  // Chưa đăng nhập
  if (userEmail === '') {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Đã đăng nhập
  return <AppLayout userEmail={userEmail} />;
}
