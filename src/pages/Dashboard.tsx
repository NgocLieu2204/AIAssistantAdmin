import { usePairingSessions } from '../hooks/usePairingSessions';
import StatCard from '../components/StatCard';
import SosAlert from '../components/SosAlert';
import { Activity, AlertTriangle, CheckCircle, Wifi, Clock } from 'lucide-react';

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  return `${Math.floor(hrs / 24)} ngày trước`;
}

export default function Dashboard() {
  const { sessions, loading } = usePairingSessions();

  const sosSessions = sessions.filter(s => s.status === 'SOS_ACTIVE');
  const standbySessions = sessions.filter(s => s.status === 'STANDBY');

  // Recent activity: last 10 events by timestamp
  const recentActivity = [...sessions]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10);

  return (
    <div>
      {/* Stats */}
      <div className="stats-grid">
        <StatCard
          value={sessions.length}
          label="Tổng phiên kết nối"
          icon={<Wifi size={22} />}
          iconColor="#6366f1"
          iconBg="rgba(99,102,241,0.15)"
          gradient="linear-gradient(90deg, #6366f1, #8b5cf6)"
          badgeText="REALTIME"
          badgeColor="#6366f1"
        />
        <StatCard
          value={sosSessions.length}
          label="SOS đang hoạt động"
          icon={<AlertTriangle size={22} />}
          iconColor="#ef4444"
          iconBg="rgba(239,68,68,0.15)"
          gradient="linear-gradient(90deg, #ef4444, #f97316)"
          badgeText={sosSessions.length > 0 ? '⚠ KHẨN CẤP' : 'AN TOÀN'}
          badgeColor={sosSessions.length > 0 ? '#ef4444' : '#22c55e'}
        />
        <StatCard
          value={standbySessions.length}
          label="Đang chờ (Standby)"
          icon={<CheckCircle size={22} />}
          iconColor="#22c55e"
          iconBg="rgba(34,197,94,0.12)"
          gradient="linear-gradient(90deg, #22c55e, #10b981)"
          badgeText="STANDBY"
          badgeColor="#22c55e"
        />
        <StatCard
          value={
            sessions.length > 0
              ? timeAgo(Math.max(...sessions.map(s => s.timestamp)))
              : '—'
          }
          label="Cập nhật gần nhất"
          icon={<Clock size={22} />}
          iconColor="#06b6d4"
          iconBg="rgba(6,182,212,0.12)"
          gradient="linear-gradient(90deg, #06b6d4, #6366f1)"
        />
      </div>

      <div className="dashboard-grid">
        {/* Left column */}
        <div className="dashboard-left">
          {/* SOS Alerts */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <AlertTriangle size={16} color="#ef4444" />
                Cảnh báo SOS đang hoạt động
              </h3>
              {sosSessions.length > 0 && (
                <span className="badge badge-sos">
                  <span className="badge-dot" />
                  {sosSessions.length} khẩn cấp
                </span>
              )}
            </div>
            <div className="card-body">
              {loading ? (
                <div className="loading-center">
                  <div className="spinner" />
                  Đang tải dữ liệu realtime...
                </div>
              ) : sosSessions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <CheckCircle size={28} color="var(--standby-green)" />
                  </div>
                  <h3 style={{ color: 'var(--standby-green)' }}>Tất cả an toàn!</h3>
                  <p>Không có tín hiệu SOS nào đang hoạt động.</p>
                </div>
              ) : (
                <div className="scroll-area" style={{ maxHeight: 400 }}>
                  {sosSessions.map(s => (
                    <SosAlert key={s.code} session={s} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* All sessions summary */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <Wifi size={16} color="var(--accent-primary)" />
                Tất cả phiên kết nối
              </h3>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {sessions.length} phiên
              </span>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="loading-center">
                  <div className="spinner" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <Wifi size={28} color="var(--text-muted)" />
                  </div>
                  <h3>Chưa có dữ liệu</h3>
                  <p>Khi người dùng mở app, dữ liệu sẽ xuất hiện tại đây.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {sessions.slice(0, 8).map(s => (
                    <div
                      key={s.code}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 14px',
                        borderRadius: 10,
                        background: s.status === 'SOS_ACTIVE'
                          ? 'rgba(239,68,68,0.07)'
                          : 'var(--bg-glass)',
                        border: `1px solid ${s.status === 'SOS_ACTIVE' ? 'rgba(239,68,68,0.2)' : 'var(--border)'}`,
                      }}
                    >
                      <span style={{
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        fontSize: 16,
                        letterSpacing: 2,
                        color: s.status === 'SOS_ACTIVE' ? '#ef4444' : 'var(--text-primary)',
                        minWidth: 70,
                      }}>
                        {s.code}
                      </span>
                      <span className={`badge ${s.status === 'SOS_ACTIVE' ? 'badge-sos' : 'badge-standby'}`}>
                        <span className="badge-dot" />
                        {s.status === 'SOS_ACTIVE' ? 'SOS' : 'STANDBY'}
                      </span>
                      <span style={{ flex: 1, fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.address || '—'}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                        {timeAgo(s.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column – Activity Feed */}
        <div className="dashboard-right">
          <div className="card" style={{ flex: 1 }}>
            <div className="card-header">
              <h3 className="card-title">
                <Activity size={16} color="var(--accent-cyan)" />
                Nhật ký sự kiện
              </h3>
            </div>
            <div className="card-body">
              {recentActivity.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <Activity size={28} color="var(--text-muted)" />
                  </div>
                  <h3>Chưa có sự kiện</h3>
                  <p>Lịch sử hoạt động sẽ xuất hiện tại đây.</p>
                </div>
              ) : (
                <div style={{ maxHeight: 520, overflowY: 'auto' }}>
                  {recentActivity.map((s, i) => (
                    <div key={`${s.code}-${i}`} className="activity-item">
                      <div
                        className="activity-dot"
                        style={{
                          background: s.status === 'SOS_ACTIVE'
                            ? 'var(--sos-red)'
                            : 'var(--standby-green)',
                        }}
                      />
                      <div className="activity-content">
                        <div className="activity-title">
                          {s.status === 'SOS_ACTIVE'
                            ? `🚨 SOS – Mã #${s.code}`
                            : `✅ Kết nối – Mã #${s.code}`}
                        </div>
                        {s.address && (
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {s.address}
                          </div>
                        )}
                        <div className="activity-time">{timeAgo(s.timestamp)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
