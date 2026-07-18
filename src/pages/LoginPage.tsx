import { useState, FormEvent } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { Eye as EyeIcon, LogIn, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.');
      } else if (code === 'auth/too-many-requests') {
        setError('Quá nhiều lần thử. Vui lòng thử lại sau vài phút.');
      } else {
        setError('Đăng nhập thất bại: ' + (err?.message || 'Lỗi không xác định'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-glow" />

      {/* Decorative dots */}
      <div style={{
        position: 'absolute', top: 60, right: 80,
        width: 200, height: 200,
        background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: 80, left: 80,
        width: 160, height: 160,
        background: 'radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <EyeIcon size={26} color="white" />
          </div>
          <div className="login-logo-text">
            <h1>AI Vision Admin</h1>
            <p>Bảng điều khiển quản trị</p>
          </div>
        </div>

        <p className="login-subtitle">
          Đăng nhập để giám sát tất cả thiết bị,<br />
          cảnh báo SOS và vị trí người dùng theo thời gian thực.
        </p>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              <Mail size={12} style={{ verticalAlign: 'middle', marginRight: 5 }} />
              Email quản trị
            </label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="admin@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">
              <Lock size={12} style={{ verticalAlign: 'middle', marginRight: 5 }} />
              Mật khẩu
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  cursor: 'pointer', color: 'var(--text-muted)',
                  display: 'flex', alignItems: 'center',
                }}
              >
                <EyeIcon size={16} />
              </button>
            </div>
          </div>

          {error && (
            <div className="form-error">{error}</div>
          )}

          <button
            id="btn-login"
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                Đang đăng nhập...
              </>
            ) : (
              <>
                <LogIn size={16} />
                Đăng nhập
              </>
            )}
          </button>
        </form>

        <div style={{
          marginTop: 24,
          padding: '14px 16px',
          background: 'rgba(99,102,241,0.06)',
          border: '1px solid rgba(99,102,241,0.15)',
          borderRadius: 'var(--radius-md)',
          fontSize: 12,
          color: 'var(--text-muted)',
          textAlign: 'center',
          lineHeight: 1.8,
        }}>
          🔒 Chỉ tài khoản Admin được phép đăng nhập.<br />
          Dữ liệu Firebase Realtime DB của dự án <strong style={{ color: 'var(--text-secondary)' }}>aivisionassistant</strong>.
        </div>
      </div>
    </div>
  );
}
