import { useState } from 'react';
import { MapPin, ExternalLink, AlertTriangle, CheckCircle } from 'lucide-react';
import { db } from '../firebase';
import { ref, update } from 'firebase/database';
import type { PairingSession } from '../types';

interface SosAlertProps {
  session: PairingSession;
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

export default function SosAlert({ session }: SosAlertProps) {
  const [loading, setLoading] = useState(false);
  const mapsUrl = `https://www.google.com/maps?q=${session.latitude},${session.longitude}`;

  const handleAcknowledge = async () => {
    if (!session.code) return;
    setLoading(true);
    try {
      await update(ref(db, `pairings/${session.code}`), { acknowledged: true });
    } catch (err) {
      console.error('Failed to acknowledge SOS:', err);
      alert('Không thể xác nhận SOS. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sos-alert-card" style={{ opacity: session.acknowledged ? 0.7 : 1, transition: 'all 0.3s' }}>
      <div className="sos-pulse-icon" style={{ animation: session.acknowledged ? 'none' : 'sos-ring 1.5s infinite', background: session.acknowledged ? 'transparent' : 'rgba(239, 68, 68, 0.2)' }}>
        <AlertTriangle size={22} color={session.acknowledged ? '#94a3b8' : '#ef4444'} />
      </div>

      <div className="sos-alert-content">
        <div className="sos-alert-header">
          <span className="sos-code">#{session.code}</span>
          <span className="badge badge-sos" style={{ 
            animation: session.acknowledged ? 'none' : 'pulse-badge 1.5s infinite',
            background: session.acknowledged ? 'rgba(239, 68, 68, 0.05)' : '',
            border: session.acknowledged ? '1px solid rgba(239, 68, 68, 0.1)' : ''
          }}>
            <span className="badge-dot" />
            {session.acknowledged ? 'ĐÃ TIẾP NHẬN' : 'SOS ACTIVE'}
          </span>
          <span className="sos-time">{timeAgo(session.timestamp)}</span>
        </div>

        <div className="sos-address">
          <MapPin size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
          {session.address || 'Đang cập nhật địa chỉ...'}
        </div>

        {session.latitude !== 0 && (
          <div className="sos-coords">
            📍 {session.latitude.toFixed(5)}, {session.longitude.toFixed(5)}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
        {!session.acknowledged && (
          <button
            onClick={handleAcknowledge}
            disabled={loading}
            style={{
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              color: '#22c55e',
              fontSize: 12,
              fontWeight: 600,
              padding: '7px 14px',
              borderRadius: 8,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              if (!loading) e.currentTarget.style.background = 'rgba(34, 197, 94, 0.25)';
            }}
            onMouseOut={(e) => {
              if (!loading) e.currentTarget.style.background = 'rgba(34, 197, 94, 0.15)';
            }}
          >
            {loading ? <div className="spinner" style={{ width: 13, height: 13, borderWidth: 2 }} /> : <CheckCircle size={13} />}
            Xác nhận
          </button>
        )}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-maps"
        >
          <ExternalLink size={13} />
          Mở Maps
        </a>
      </div>
    </div>
  );
}
