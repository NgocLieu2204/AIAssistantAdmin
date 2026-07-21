import { NavLink, useNavigate } from 'react-router-dom';
import { Eye, LayoutDashboard, Monitor, Map, LogOut, Bell, Users, Smartphone } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

interface SidebarProps {
  sosCount: number;
  userEmail: string;
}

export default function Sidebar({ sosCount, userEmail }: SidebarProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : 'AD';

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Eye size={20} color="white" />
        </div>
        <div className="sidebar-logo-text">
          <h2>AI Vision Admin</h2>
          <p>Bảng điều khiển</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <span className="sidebar-section-label">Tổng quan</span>

        <NavLink
          to="/"
          end
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={18} className="nav-icon" />
          Dashboard
          {sosCount > 0 && (
            <span className="nav-badge">{sosCount}</span>
          )}
        </NavLink>

        <NavLink
          to="/devices"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Monitor size={18} className="nav-icon" />
          Quản lý Thiết bị
        </NavLink>

        <NavLink
          to="/map"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Map size={18} className="nav-icon" />
          Bản đồ SOS
          {sosCount > 0 && (
            <span className="nav-badge">{sosCount}</span>
          )}
        </NavLink>

        <span className="sidebar-section-label" style={{ marginTop: 12 }}>Hệ thống</span>

        <NavLink
          to="/app-users"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Smartphone size={18} className="nav-icon" />
          Quản lý App User
        </NavLink>

        <NavLink
          to="/users"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Users size={18} className="nav-icon" />
          Quản lý Admin
        </NavLink>


      </nav>

      {/* Footer user */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{userEmail || 'Admin'}</div>
            <div className="sidebar-user-role">Quản trị viên</div>
          </div>
          <button className="btn-logout" onClick={handleLogout} title="Đăng xuất">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
