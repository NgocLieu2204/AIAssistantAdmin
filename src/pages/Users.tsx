import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { ref, onValue, set, remove } from 'firebase/database';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, secondaryAuth, auth } from '../firebase';
import type { AdminUser } from '../types';
import { Users as UsersIcon, UserPlus, Trash2, Mail, Lock, Shield } from 'lucide-react';

export default function Users() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Admin');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Lấy danh sách admin từ Realtime DB
  useEffect(() => {
    const adminsRef = ref(db, 'admins');
    const unsubscribe = onValue(adminsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list: AdminUser[] = Object.values(data);
        // Sắp xếp mới nhất lên đầu
        list.sort((a, b) => b.createdAt - a.createdAt);
        setAdmins(list);
      } else {
        setAdmins([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleCreateAdmin = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      // 1. Tạo tài khoản Firebase Auth trên secondary app
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const newUid = userCredential.user.uid;

      // 2. Đăng xuất secondary app ngay lập tức để không ảnh hưởng
      await signOut(secondaryAuth);

      // 3. Lưu thông tin profile vào bảng admins
      const newAdmin: AdminUser = {
        uid: newUid,
        email: email.toLowerCase(),
        role: role,
        createdAt: Date.now(),
      };
      
      await set(ref(db, `admins/${newUid}`), newAdmin);

      // Thành công, đóng modal và reset form
      setShowModal(false);
      setEmail('');
      setPassword('');
      setRole('Admin');
      
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setFormError('Email này đã được sử dụng.');
      } else if (err.code === 'auth/weak-password') {
        setFormError('Mật khẩu quá yếu (tối thiểu 6 ký tự).');
      } else {
        setFormError('Lỗi tạo tài khoản: ' + err.message);
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string, adminEmail: string) => {
    // Không cho phép tự xóa chính mình nếu muốn an toàn (optional)
    if (auth.currentUser?.email === adminEmail) {
      alert('Bạn không thể tự xóa tài khoản của chính mình khỏi danh sách!');
      return;
    }

    if (window.confirm(`Bạn có chắc muốn xóa quyền truy cập của ${adminEmail}?\n\n(Lưu ý: Thao tác này chỉ xóa quyền khỏi DB. Để xóa hẳn tài khoản, cần vào Firebase Console)`)) {
      try {
        await remove(ref(db, `admins/${adminId}`));
      } catch (err) {
        alert('Lỗi khi xóa: ' + err);
      }
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <Shield size={16} color="var(--accent-primary)" />
            Quản trị viên hệ thống
          </h3>
          <button 
            className="btn-primary" 
            style={{ padding: '8px 16px' }}
            onClick={() => setShowModal(true)}
          >
            <UserPlus size={16} />
            Thêm Admin
          </button>
        </div>

        <div className="card-body">
          {loading ? (
            <div className="loading-center">
              <div className="spinner" />
              Đang tải danh sách...
            </div>
          ) : admins.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <UsersIcon size={28} color="var(--text-muted)" />
              </div>
              <h3>Chưa có dữ liệu admin</h3>
              <p>Thêm tài khoản admin đầu tiên để quản lý</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Vai trò</th>
                    <th>Ngày tạo</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin.uid}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {admin.email}
                        {auth.currentUser?.email === admin.email && (
                          <span style={{ 
                            marginLeft: 8, fontSize: 10, padding: '2px 6px', 
                            background: 'rgba(34,197,94,0.15)', color: '#22c55e', 
                            borderRadius: 4, border: '1px solid rgba(34,197,94,0.3)' 
                          }}>BẠN</span>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-standby">
                          <span className="badge-dot" />
                          {admin.role}
                        </span>
                      </td>
                      <td className="td-time">
                        {new Date(admin.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td>
                        <button 
                          onClick={() => handleDeleteAdmin(admin.uid, admin.email)}
                          disabled={auth.currentUser?.email === admin.email}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            background: auth.currentUser?.email === admin.email ? 'transparent' : 'rgba(239,68,68,0.1)', 
                            color: auth.currentUser?.email === admin.email ? 'var(--text-muted)' : '#ef4444',
                            border: `1px solid ${auth.currentUser?.email === admin.email ? 'var(--border)' : 'rgba(239,68,68,0.3)'}`, 
                            borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600,
                            cursor: auth.currentUser?.email === admin.email ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <Trash2 size={12} />
                          Thu hồi
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

      {/* Modal Thêm Admin */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 450, margin: 20 }}>
            <div className="card-header">
              <h3 className="card-title">Tạo tài khoản Admin mới</h3>
              <button 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 24, cursor: 'pointer' }}
                onClick={() => setShowModal(false)}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleCreateAdmin} style={{ padding: 20 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="admin-email">
                  <Mail size={12} style={{ verticalAlign: 'middle', marginRight: 5 }} />
                  Email đăng nhập
                </label>
                <input
                  id="admin-email"
                  type="email"
                  className="form-input"
                  placeholder="admin@aivision.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="admin-password">
                  <Lock size={12} style={{ verticalAlign: 'middle', marginRight: 5 }} />
                  Mật khẩu (Tối thiểu 6 ký tự)
                </label>
                <input
                  id="admin-password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="admin-role">
                  <Shield size={12} style={{ verticalAlign: 'middle', marginRight: 5 }} />
                  Vai trò
                </label>
                <select 
                  id="admin-role" 
                  className="form-input" 
                  value={role} 
                  onChange={e => setRole(e.target.value)}
                  style={{ backgroundColor: 'var(--bg-lighter)', color: 'white' }}
                >
                  <option value="Admin">Admin</option>
                  <option value="Moderator">Moderator (Chỉ xem)</option>
                </select>
              </div>

              {formError && (
                <div className="form-error" style={{ marginBottom: 15 }}>{formError}</div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button 
                  type="button" 
                  className="btn-primary" 
                  style={{ flex: 1, background: 'var(--bg-glass)', border: '1px solid var(--border)', color: 'white' }}
                  onClick={() => setShowModal(false)}
                  disabled={formLoading}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ flex: 2 }}
                  disabled={formLoading}
                >
                  {formLoading ? 'Đang tạo...' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
