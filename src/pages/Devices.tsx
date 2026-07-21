import { usePairingSessions } from '../hooks/usePairingSessions';
import DeviceTable from '../components/DeviceTable';
import { Monitor } from 'lucide-react';

export default function Devices() {
  const { sessions, loading } = usePairingSessions();

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <Monitor size={16} color="var(--accent-primary)" />
            Danh sách thiết bị kết nối
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Dữ liệu cập nhật tự động theo thời gian thực
            </span>
            <div className="live-indicator" style={{ fontSize: 11, padding: '4px 10px' }}>
              <div className="live-dot" />
              LIVE
            </div>
          </div>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="loading-center">
              <div className="spinner" />
              Đang tải danh sách thiết bị...
            </div>
          ) : (
            <DeviceTable sessions={sessions} />
          )}
        </div>
      </div>
    </div>
  );
}
