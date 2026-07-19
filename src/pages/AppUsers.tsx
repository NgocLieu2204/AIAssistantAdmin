import { useState, useEffect } from 'react';
import { ref, onValue, remove } from 'firebase/database';
import { db } from '../firebase';
import { Smartphone, Search, Trash2 } from 'lucide-react';

interface AppUser {
  uid: string;
  email: string;
  createdAt: number;
  lastLogin?: number;
  pairingCode?: string;
  sosSentCount?: number;
}

export default function AppUsers() {
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Lấy danh sách app users và extra data từ Realtime DB
  useEffect(() => {
    const usersRef = ref(db, 'app_users');
    const extraRef = ref(db, 'users');
    let appUsersData: Record<string, AppUser> = {};
    let extraData: Record<string, any> = {};

    const updateState = () => {
      const list: AppUser[] = Object.values(appUsersData).map(u => ({
        ...u,
        pairingCode: extraData[u.uid]?.pairingCode || 'Chưa có',
        sosSentCount: extraData[u.uid]?.sosSentCount || 0
      }));
      // Sắp xếp mới nhất lên đầu
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
    if (window.confirm(`Bạn có chắc muốn xóa dữ liệu của người dùng App: ${email}?\n\n(Lưu ý: Thao tác này chỉ xóa dữ liệu trong Database. Tài khoản đăng nhập vẫn tồn tại trên Firebase Auth)`)) {
      try {
        await remove(ref(db, `app_users/${uid}`));
        await remove(ref(db, `users/${uid}`));
      } catch (err) {
        alert('Lỗi khi xóa: ' + err);
      }
    }
  };

  const filteredUsers = appUsers.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
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
              placeholder="Tìm theo email..."
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
                <Smartphone size={28} color="var(--text-muted)" />
              </div>
              <h3>Không có người dùng nào</h3>
              <p>Danh sách người dùng đăng ký qua App Android sẽ hiển thị tại đây.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Mã kết nối</th>
                    <th>Số lần SOS</th>
                    <th>Ngày đăng ký</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.uid}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {user.email}
                      </td>
                      <td style={{ letterSpacing: 1, fontFamily: 'monospace' }}>
                        {user.pairingCode}
                      </td>
                      <td>
                        {user.sosSentCount}
                      </td>
                      <td className="td-time">
                        {new Date(user.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td>
                        <button 
                          onClick={() => handleDeleteUser(user.uid, user.email)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            background: 'rgba(239,68,68,0.1)', 
                            color: '#ef4444',
                            border: '1px solid rgba(239,68,68,0.3)', 
                            borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600,
                            cursor: 'pointer', transition: 'all 0.2s'
                          }}
                          onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
                          onMouseOut={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                        >
                          <Trash2 size={12} />
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
