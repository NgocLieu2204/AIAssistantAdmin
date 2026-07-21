import { useState } from 'react';
import { Search, ExternalLink, Trash2, Edit2, Battery, Wifi, History, Smartphone, AlertCircle } from 'lucide-react';
import type { PairingSession } from '../types';
import { ref, remove, update } from 'firebase/database';
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
  const [filter, setFilter] = useState<'ALL' | 'SOS_ACTIVE' | 'ONLINE' | 'OFFLINE'>('ALL');
  
  // Bulk selection
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());

  // Editing name
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');

  const filtered = sessions.filter(s => {
    const matchSearch =
      s.code.includes(search) ||
      s.address.toLowerCase().includes(search.toLowerCase()) ||
      (s.name && s.name.toLowerCase().includes(search.toLowerCase()));
      
    let matchFilter = true;
    if (filter === 'SOS_ACTIVE') matchFilter = s.status === 'SOS_ACTIVE';
    if (filter === 'ONLINE') matchFilter = s.status === 'STANDBY' && !s.isOffline;
    if (filter === 'OFFLINE') matchFilter = s.isOffline === true;
    
    return matchSearch && matchFilter;
  });

  const handleDelete = async (code: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa dữ liệu của thiết bị #${code}?`)) {
      try {
        await remove(ref(db, `pairings/${code}`));
        setSelectedCodes(prev => {
          const newSet = new Set(prev);
          newSet.delete(code);
          return newSet;
        });
      } catch (err) {
        console.error('Lỗi khi xóa thiết bị:', err);
        alert('Có lỗi xảy ra khi xóa thiết bị.');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCodes.size === 0) return;
    if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedCodes.size} thiết bị đã chọn?`)) {
      try {
        const promises = Array.from(selectedCodes).map(code => remove(ref(db, `pairings/${code}`)));
        await Promise.all(promises);
        setSelectedCodes(new Set());
      } catch (err) {
        console.error('Lỗi khi xóa hàng loạt:', err);
        alert('Có lỗi xảy ra khi xóa danh sách thiết bị.');
      }
    }
  };

  const handleToggleSelect = (code: string) => {
    setSelectedCodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(code)) newSet.delete(code);
      else newSet.add(code);
      return newSet;
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedCodes(new Set(filtered.map(s => s.code)));
    } else {
      setSelectedCodes(new Set());
    }
  };

  const saveName = async (code: string) => {
    try {
      await update(ref(db, `pairings/${code}`), { name: editNameValue.trim() });
      setEditingCode(null);
    } catch (err) {
      alert('Lỗi khi lưu tên thiết bị');
    }
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="toolbar" style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 300 }}>
          <div className="search-input-wrapper" style={{ flex: 1 }}>
            <Search size={15} className="search-icon" />
            <input
              id="device-search"
              type="text"
              className="search-input"
              placeholder="Tìm theo tên, mã số hoặc địa chỉ..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className={`filter-btn ${filter === 'ALL' ? 'active' : ''}`} onClick={() => setFilter('ALL')}>
            Tất cả ({sessions.length})
          </button>
          <button className={`filter-btn ${filter === 'SOS_ACTIVE' ? 'active-sos active' : ''}`} onClick={() => setFilter('SOS_ACTIVE')}>
            SOS ({sessions.filter(s => s.status === 'SOS_ACTIVE').length})
          </button>
          <button className={`filter-btn ${filter === 'ONLINE' ? 'active' : ''}`} onClick={() => setFilter('ONLINE')}>
            Online ({sessions.filter(s => s.status === 'STANDBY' && !s.isOffline).length})
          </button>
          <button className={`filter-btn ${filter === 'OFFLINE' ? 'active' : ''}`} style={{ borderColor: filter === 'OFFLINE' ? '#ef4444' : '' }} onClick={() => setFilter('OFFLINE')}>
            Offline ({sessions.filter(s => s.isOffline).length})
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedCodes.size > 0 && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, color: '#f87171' }}>Đã chọn {selectedCodes.size} thiết bị</span>
          <button onClick={handleBulkDelete} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Trash2 size={14} /> Xóa hàng loạt
          </button>
        </div>
      )}

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
                <th style={{ width: 40, textAlign: 'center' }}>
                  <input type="checkbox" onChange={handleSelectAll} checked={selectedCodes.size === filtered.length && filtered.length > 0} style={{ cursor: 'pointer' }} />
                </th>
                <th>Thiết bị</th>
                <th>Trạng thái mạng</th>
                <th>Tọa độ / Địa chỉ</th>
                <th>Cập nhật cuối</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(session => (
                <tr key={session.code} className={session.status === 'SOS_ACTIVE' ? 'sos-row' : ''}>
                  <td style={{ textAlign: 'center' }}>
                    <input type="checkbox" checked={selectedCodes.has(session.code)} onChange={() => handleToggleSelect(session.code)} style={{ cursor: 'pointer' }} />
                  </td>
                  <td>
                    {editingCode === session.code ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input type="text" autoFocus value={editNameValue} onChange={e => setEditNameValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveName(session.code)} style={{ background: '#111827', border: '1px solid var(--accent-primary)', color: '#fff', padding: '4px 8px', borderRadius: 4, width: 150 }} />
                        <button onClick={() => saveName(session.code)} style={{ background: 'var(--accent-primary)', color: '#000', border: 'none', padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>Lưu</button>
                        <button onClick={() => setEditingCode(null)} style={{ background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer' }}>Hủy</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
                          <Smartphone size={16} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 6 }}>
                            {session.name || `Thiết bị #${session.code}`}
                            <button onClick={() => { setEditingCode(session.code); setEditNameValue(session.name || ''); }} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: 2 }} title="Đổi tên">
                              <Edit2 size={12} />
                            </button>
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>Mã: {session.code}</div>
                        </div>
                      </div>
                    )}
                  </td>
                  <td>
                    {session.isOffline ? (
                      <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <AlertCircle size={10} style={{ marginRight: 4 }} />
                        OFFLINE
                      </span>
                    ) : session.status === 'SOS_ACTIVE' ? (
                      <div>
                        <span className="badge badge-sos">
                          <span className="badge-dot" /> SOS ACTIVE
                        </span>
                        {session.acknowledged && (
                          <div style={{ marginTop: 4, fontSize: 11, color: '#22c55e', fontWeight: 600 }}>✓ Đã xác nhận</div>
                        )}
                      </div>
                    ) : (
                      <span className="badge badge-standby" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}>
                        <span className="badge-dot" style={{ background: '#22c55e' }} /> ONLINE
                      </span>
                    )}
                  </td>
                  <td>
                    {session.latitude !== 0 ? (
                      <div>
                        <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#38bdf8', marginBottom: 2 }}>{session.latitude.toFixed(4)}, {session.longitude.toFixed(4)}</div>
                        <div className="td-address" style={{ fontSize: 12, maxWidth: 250 }}>{session.address}</div>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td className="td-time">{timeAgo(session.timestamp)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {session.latitude !== 0 && (
                        <a href={`https://www.google.com/maps?q=${session.latitude},${session.longitude}`} target="_blank" rel="noopener noreferrer" className="btn-maps" style={{ padding: '4px 8px', fontSize: 11 }}>
                          <ExternalLink size={12} style={{ marginRight: 4 }} /> Bản đồ
                        </a>
                      )}
                      <button onClick={() => handleDelete(session.code)} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 4, padding: '4px 8px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <Trash2 size={12} style={{ marginRight: 4 }} /> Xóa
                      </button>
                    </div>
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
