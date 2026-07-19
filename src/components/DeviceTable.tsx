import { useState } from 'react';
import { Search, ExternalLink, Trash2 } from 'lucide-react';
import type { PairingSession } from '../types';
import { ref, remove } from 'firebase/database';
import { db } from '../firebase';

interface DeviceTableProps {
  sessions: PairingSession[];
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  return `${Math.floor(hrs / 24)} ngày trước`;
}

export default function DeviceTable({ sessions }: DeviceTableProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'SOS_ACTIVE' | 'STANDBY'>('ALL');

  const filtered = sessions.filter(s => {
    const matchSearch =
      s.code.includes(search) ||
      s.address.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'ALL' || s.status === filter;
    return matchSearch && matchFilter;
  });

  const handleDelete = async (code: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn ngắt kết nối và xóa dữ liệu của thiết bị #${code}?`)) {
      try {
        await remove(ref(db, `pairings/${code}`));
      } catch (err) {
        console.error('Lỗi khi xóa phiên:', err);
        alert('Có lỗi xảy ra khi xóa phiên kết nối.');
      }
    }
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="toolbar" style={{ marginBottom: 20 }}>
        <div className="search-input-wrapper">
          <Search size={15} className="search-icon" />
          <input
            id="device-search"
            type="text"
            className="search-input"
            placeholder="Tìm theo mã số hoặc địa chỉ..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <button
          id="filter-all"
          className={`filter-btn ${filter === 'ALL' ? 'active' : ''}`}
          onClick={() => setFilter('ALL')}
        >
          Tất cả ({sessions.length})
        </button>
        <button
          id="filter-sos"
          className={`filter-btn ${filter === 'SOS_ACTIVE' ? 'active-sos active' : ''}`}
          onClick={() => setFilter('SOS_ACTIVE')}
        >
          SOS ({sessions.filter(s => s.status === 'SOS_ACTIVE').length})
        </button>
        <button
          id="filter-standby"
          className={`filter-btn ${filter === 'STANDBY' ? 'active' : ''}`}
          onClick={() => setFilter('STANDBY')}
        >
          Standby ({sessions.filter(s => s.status === 'STANDBY').length})
        </button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Search size={28} color="var(--text-muted)" />
          </div>
          <h3>Không tìm thấy kết quả</h3>
          <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Mã kết nối</th>
                <th>Trạng thái</th>
                <th>Địa chỉ</th>
                <th>Tọa độ</th>
                <th>Cập nhật lần cuối</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(session => (
                <tr key={session.code} className={session.status === 'SOS_ACTIVE' ? 'sos-row' : ''}>
                  <td className="td-code">{session.code}</td>
                  <td>
                    {session.status === 'SOS_ACTIVE' ? (
                      <div>
                        <span className="badge badge-sos">
                          <span className="badge-dot" />
                          SOS ACTIVE
                        </span>
                        {session.acknowledged && (
                          <div style={{ marginTop: 6, fontSize: 11, color: '#22c55e', fontWeight: 600 }}>
                            ✓ Đã xác nhận
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="badge badge-standby">
                        <span className="badge-dot" />
                        STANDBY
                      </span>
                    )}
                  </td>
                  <td className="td-address">
                    {session.address || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td>
                    {session.latitude !== 0 ? (
                      <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>
                        {session.latitude.toFixed(4)}, {session.longitude.toFixed(4)}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td className="td-time">{timeAgo(session.timestamp)}</td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    {session.latitude !== 0 && (
                      <a
                        href={`https://www.google.com/maps?q=${session.latitude},${session.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-maps"
                        style={{ display: 'inline-flex', padding: '6px 12px' }}
                      >
                        <ExternalLink size={12} />
                        Maps
                      </a>
                    )}
                    <button 
                      onClick={() => handleDelete(session.code)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                        border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6,
                        padding: '6px 12px', fontSize: 12, fontWeight: 600,
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
  );
}
