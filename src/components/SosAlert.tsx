import { MapPin, ExternalLink, AlertTriangle } from 'lucide-react';
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
  const mapsUrl = `https://www.google.com/maps?q=${session.latitude},${session.longitude}`;

  return (
    <div className="sos-alert-card">
      <div className="sos-pulse-icon">
        <AlertTriangle size={22} color="#ef4444" />
      </div>

      <div className="sos-alert-content">
        <div className="sos-alert-header">
          <span className="sos-code">#{session.code}</span>
          <span className="badge badge-sos">
            <span className="badge-dot" />
            SOS ACTIVE
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
  );
}
