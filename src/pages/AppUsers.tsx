import { useState, useEffect, useRef } from 'react';
import { ref, onValue, remove, update, push } from 'firebase/database';
import { sendPasswordResetEmail } from 'firebase/auth';
import { db, auth } from '../firebase';
import { 
  Smartphone, Search, Trash2, MoreVertical, Key, Bell, Ban, 
  CheckCircle, Phone, User, Activity, AlertTriangle, X, Save 
} from 'lucide-react';
import StatCard from '../components/StatCard';

interface AppUser {
  uid: string;
  email: string;
  createdAt: number;
  lastLogin?: number;
  pairingCode?: string;
  sosSentCount?: number;
  banned?: boolean;
  emergencyContact?: string;
  adminNote?: string;
}

export default function AppUsers() {
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Dropdown state
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  // Modals state
  const [profileModalUser, setProfileModalUser] = useState<AppUser | null>(null);
  const [noteValue, setNoteValue] = useState('');
  const [notifModalUser, setNotifModalUser] = useState<AppUser | null>(null);
  const [notifMessage, setNotifMessage] = useState('');
  
  // Click outside to close dropdown
  const tableRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tableRef.current && !tableRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch users
  useEffect(() => {
    const usersRef = ref(db, 'app_users');
    const extraRef = ref(db, 'users');
    let appUsersData: Record<string, any> = {};
    let extraData: Record<string, any> = {};

    const updateState = () => {
      const list: AppUser[] = Object.entries(appUsersData).map(([uid, u]) => ({
        uid,
        email: u.email || '',
        createdAt: u.createdAt || 0,
        banned: u.banned || false,
        adminNote: u.adminNote || '',
        pairingCode: extraData[uid]?.pairingCode || 'Chưa có',
        sosSentCount: extraData[uid]?.sosSentCount || 0,
        emergencyContact: extraData[uid]?.emergencyContact || ''
      }));
      list.sort((a, b) => b.createdAt - a.createdAt);
      setAppUsers(list);
    };

    const unsubAppUsers = onValue(usersRef, (snapshot) => {
      appUsersData = snapshot.val() || {};
      updateState();
      setLoading(false);
    });

    const unsubExtra = onValue(extraRef, (snapshot) => {
      extraData = snapshot.val() || {};
      updateState();
    });

    return () => {
      unsubAppUsers();
      unsubExtra();
    };
  }, []);

  const handleDeleteUser = async (uid: string, email: string) => {
    setActiveDropdown(null);
    if (window.confirm(`Bạn có chắc muốn xóa dữ liệu của người dùng: ${email}?`)) {
      try {
        await remove(ref(db, `app_users/${uid}`));
        await remove(ref(db, `users/${uid}`));
      } catch (err) {
        alert('Lỗi khi xóa: ' + err);
      }
    }
  };

  const handleToggleBan = async (uid: string, currentBanned: boolean) => {
    setActiveDropdown(null);
    try {
      await update(ref(db, `app_users/${uid}`), { banned: !currentBanned });
    } catch (err) {
      alert('Lỗi khi đổi trạng thái: ' + err);
    }
  };

  const handleResetPassword = async (email: string) => {
    setActiveDropdown(null);
    if (window.confirm(`Gửi email đặt lại mật khẩu cho ${email}?`)) {
      try {
        await sendPasswordResetEmail(auth, email);
        alert(`Đã gửi email khôi phục thành công đến ${email}`);
      } catch (err) {
        alert('Lỗi gửi email: ' + err);
      }
    }
  };

  const handleSaveNote = async () => {
    if (!profileModalUser) return;
    try {
      await update(ref(db, `app_users/${profileModalUser.uid}`), { adminNote: noteValue });
      alert('Đã lưu ghi chú thành công!');
      setProfileModalUser(null);
    } catch (err) {
      alert('Lỗi khi lưu ghi chú');
    }
  };

  const handleSendNotification = async () => {
    if (!notifModalUser || !notifMessage.trim()) return;
    try {
      // Mock push notification by saving to DB
      await push(ref(db, `notifications/${notifModalUser.uid}`), {
        message: notifMessage,
        timestamp: Date.now(),
        read: false
      });
      alert('Đã gửi thông báo thành công!');
      setNotifModalUser(null);
      setNotifMessage('');
    } catch (err) {
      alert('Lỗi khi gửi thông báo');
    }
  };

  const filteredUsers = appUsers.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.pairingCode && u.pairingCode.includes(search))
  );

  // Thống kê nhanh
  const totalUsers = appUsers.length;
  const newUsersThisWeek = appUsers.filter(u => Date.now() - u.createdAt < 7 * 24 * 60 * 60 * 1000).length;
  const totalSosSends = appUsers.reduce((sum, u) => sum + (u.sosSentCount || 0), 0);

  return (
    <div>
      {/* Quick Stats */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <StatCard
          value={totalUsers}
          label="Tổng người dùng"
          icon={<User size={22} />}
          iconColor="#3b82f6"
          iconBg="rgba(59, 130, 246, 0.15)"
        />
        <StatCard
          value={newUsersThisWeek}
          label="Người dùng mới (7 ngày)"
          icon={<Activity size={22} />}
          iconColor="#10b981"
          iconBg="rgba(16, 185, 129, 0.15)"
        />
        <StatCard
          value={totalSosSends}
          label="Tổng lượt SOS"
          icon={<AlertTriangle size={22} />}
          iconColor="#f59e0b"
          iconBg="rgba(245, 158, 11, 0.15)"
        />
      </div>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="card-title">
            <Smartphone size={16} color="var(--accent-primary)" />
            Quản lý người dùng App Android
          </h3>
          <div className="search-input-wrapper" style={{ width: 250, margin: 0 }}>
            <Search size={15} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Tìm email hoặc mã..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="card-body">
          {loading ? (
            <div className="loading-center">
              <div className="spinner" />
              Đang tải danh sách...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <User size={28} color="var(--text-muted)" />
              </div>
              <h3>Không có dữ liệu</h3>
            </div>
          ) : (
            <div className="table-wrapper" ref={tableRef}>
              <table>
                <thead>
                  <tr>
                    <th>Tài khoản</th>
                    <th>Trạng thái</th>
                    <th>Liên hệ khẩn cấp</th>
                    <th>Mã kết nối</th>
                    <th>Hoạt động</th>
                    <th style={{ textAlign: 'right' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.uid} style={{ opacity: user.banned ? 0.6 : 1 }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                            {user.email.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600, color: '#f8fafc' }}>{user.email}</span>
                            <span style={{ fontSize: 11, color: '#64748b' }}>Ngày đk: {new Date(user.createdAt).toLocaleDateString('vi-VN')}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        {user.banned ? (
                          <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                            <Ban size={10} style={{ marginRight: 4 }} /> BANNED
                          </span>
                        ) : (
                          <span className="badge" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
                            <CheckCircle size={10} style={{ marginRight: 4 }} /> ACTIVE
                          </span>
                        )}
                      </td>
                      <td>
                        {user.emergencyContact ? (
                          <a href={`tel:${user.emergencyContact}`} style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', fontSize: 13 }}>
                            <Phone size={12} /> {user.emergencyContact}
                          </a>
                        ) : (
                          <span style={{ color: '#64748b', fontSize: 12 }}>N/A</span>
                        )}
                      </td>
                      <td style={{ letterSpacing: 1, fontFamily: 'monospace', color: '#f59e0b', fontWeight: 600 }}>
                        {user.pairingCode}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
                          <span style={{ color: '#94a3b8' }}>Lượt SOS: <strong style={{ color: '#fff' }}>{user.sosSentCount}</strong></span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', position: 'relative' }}>
                        <button 
                          onClick={() => setActiveDropdown(activeDropdown === user.uid ? null : user.uid)}
                          style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
                        >
                          <MoreVertical size={16} />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {activeDropdown === user.uid && (
                          <div style={{ position: 'absolute', right: 30, top: 20, background: '#1e293b', border: '1px solid #334155', borderRadius: 8, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)', zIndex: 100, minWidth: 180, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <button onClick={() => { setProfileModalUser(user); setNoteValue(user.adminNote || ''); setActiveDropdown(null); }} className="dropdown-item">
                              <User size={14} /> Xem hồ sơ chi tiết
                            </button>
                            <button onClick={() => { setNotifModalUser(user); setActiveDropdown(null); }} className="dropdown-item">
                              <Bell size={14} /> Gửi thông báo Push
                            </button>
                            <button onClick={() => handleResetPassword(user.email)} className="dropdown-item">
                              <Key size={14} /> Gửi Email Reset Pass
                            </button>
                            <div style={{ height: 1, background: '#334155', margin: '4px 0' }} />
                            <button onClick={() => handleToggleBan(user.uid, user.banned || false)} className="dropdown-item" style={{ color: user.banned ? '#22c55e' : '#ef4444' }}>
                              {user.banned ? <><CheckCircle size={14} /> Mở khóa tài khoản</> : <><Ban size={14} /> Khóa tài khoản</>}
                            </button>
                            <button onClick={() => handleDeleteUser(user.uid, user.email)} className="dropdown-item" style={{ color: '#ef4444' }}>
                              <Trash2 size={14} /> Xóa dữ liệu
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      {profileModalUser && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: 450 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><User size={18} color="var(--accent-primary)" /> Hồ sơ Người dùng</h3>
              <button onClick={() => setProfileModalUser(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 'bold' }}>
                {profileModalUser.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: 16 }}>{profileModalUser.email}</h4>
                <div style={{ color: '#94a3b8', fontSize: 13 }}>UID: {profileModalUser.uid}</div>
              </div>
            </div>
            
            <div style={{ background: '#0f172a', padding: 12, borderRadius: 8, marginBottom: 20, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#64748b' }}>Trạng thái:</span>
                <span style={{ color: profileModalUser.banned ? '#ef4444' : '#22c55e', fontWeight: 600 }}>{profileModalUser.banned ? 'Bị khóa' : 'Đang hoạt động'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#64748b' }}>Lượt gửi SOS:</span>
                <span style={{ color: '#fff' }}>{profileModalUser.sosSentCount} lần</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Ngày đăng ký:</span>
                <span style={{ color: '#fff' }}>{new Date(profileModalUser.createdAt).toLocaleString('vi-VN')}</span>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>Ghi chú của Admin (Private):</label>
              <textarea 
                value={noteValue} 
                onChange={e => setNoteValue(e.target.value)}
                placeholder="Ghi chú về tình trạng sức khỏe, địa chỉ cụ thể..."
                style={{ width: '100%', height: 100, background: '#111827', border: '1px solid #334155', borderRadius: 8, padding: 12, color: '#fff', fontSize: 14, resize: 'none' }}
              />
            </div>
            
            <button onClick={handleSaveNote} className="btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: 12 }}>
              <Save size={16} /> Lưu Ghi Chú
            </button>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {notifModalUser && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: 400 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><Bell size={18} color="#f59e0b" /> Gửi Thông Báo</h3>
              <button onClick={() => setNotifModalUser(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16, lineHeight: 1.5 }}>
              Soạn tin nhắn gửi trực tiếp đến thiết bị của <strong>{notifModalUser.email}</strong>. Thiết bị sẽ tự động hiển thị thông báo Notification (nếu App đã được cấp quyền).
            </p>
            <textarea 
              value={notifMessage} 
              onChange={e => setNotifMessage(e.target.value)}
              placeholder="Nhập nội dung thông báo..."
              style={{ width: '100%', height: 100, background: '#111827', border: '1px solid #334155', borderRadius: 8, padding: 12, color: '#fff', fontSize: 14, resize: 'none', marginBottom: 16 }}
            />
            <button onClick={handleSendNotification} className="btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: 12, background: '#f59e0b', color: '#000' }}>
              <Bell size={16} /> Gửi Thông Báo Ngay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
