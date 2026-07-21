import { useEffect, useRef, useState } from 'react';
import { usePairingSessions } from '../hooks/usePairingSessions';
import { Map, AlertTriangle, CheckCircle, Search } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default marker icon issue with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const SOS_ICON = L.divIcon({
  className: '',
  html: `
    <div style="
      width:36px;height:36px;
      background:radial-gradient(circle, #ef4444 40%, rgba(239,68,68,0.3) 100%);
      border-radius:50%;
      border:3px solid #ef4444;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 0 16px rgba(239,68,68,0.7);
      animation:mapPulse 1.2s infinite;
    ">
      <span style="font-size:16px;">🆘</span>
    </div>
    <style>
      @keyframes mapPulse {
        0%,100%{box-shadow:0 0 10px rgba(239,68,68,0.7);}
        50%{box-shadow:0 0 24px rgba(239,68,68,1);}
      }
    </style>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const STANDBY_ICON = L.divIcon({
  className: '',
  html: `
    <div style="
      width:28px;height:28px;
      background:rgba(34,197,94,0.9);
      border-radius:50%;
      border:2px solid #22c55e;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 0 10px rgba(34,197,94,0.5);
    ">
      <span style="font-size:13px;">📍</span>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

export default function MapView() {
  const { sessions, loading } = usePairingSessions();
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const searchLower = searchQuery.trim().toLowerCase();
  const suggestions = searchLower.length > 0 
    ? sessions.filter(s => 
        s.code.toLowerCase().includes(searchLower) || 
        (s.address && s.address.toLowerCase().includes(searchLower))
      ).slice(0, 5)
    : [];

  const handleSearchLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !leafletMap.current) return;
    
    // 1. Tự động tìm kiếm vị trí SOS (hoặc thiết bị) nội bộ trước
    const targetSession = sessions.find(s => 
      s.code.toLowerCase() === searchQuery.trim().toLowerCase() || 
      (s.address && s.address.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    );

    if (targetSession && (targetSession.latitude !== 0 || targetSession.longitude !== 0)) {
      // Tìm thấy thiết bị SOS -> Bay đến thiết bị đó
      leafletMap.current.flyTo([targetSession.latitude, targetSession.longitude], 17, {
        animate: true,
        duration: 1.5
      });
      
      // Mở popup của thiết bị đó
      setTimeout(() => {
        markersRef.current.forEach(m => {
          const latLng = m.getLatLng();
          if (latLng.lat === targetSession.latitude && latLng.lng === targetSession.longitude) {
            m.openPopup();
          }
        });
      }, 1500); // Đợi flyTo xong
      return;
    }

    // 2. Nếu không phải là thiết bị, tìm qua API OpenStreetMap
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        leafletMap.current.flyTo([parseFloat(lat), parseFloat(lon)], 16, {
          animate: true,
          duration: 1.5
        });
      } else {
        alert("Không tìm thấy địa điểm này!");
      }
    } catch (error) {
      console.error("Search error:", error);
      alert("Lỗi khi tìm kiếm địa điểm.");
    } finally {
      setIsSearching(false);
    }
  };

  // Init map once
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    const map = L.map(mapRef.current, {
      center: [10.762, 106.660], // Ho Chi Minh City default
      zoom: 12,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    leafletMap.current = map;

    return () => {
      map.remove();
      leafletMap.current = null;
    };
  }, []);

  // Update markers when sessions change
  useEffect(() => {
    const map = leafletMap.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const validSessions = sessions.filter(s => s.latitude !== 0 || s.longitude !== 0);

    validSessions.forEach(s => {
      const icon = s.status === 'SOS_ACTIVE' ? SOS_ICON : STANDBY_ICON;
      const marker = L.marker([s.latitude, s.longitude], { icon }).addTo(map);

      const popupContent = `
        <div style="
          font-family:Inter,sans-serif;
          background:#111827;
          color:#f1f5f9;
          border-radius:10px;
          padding:14px 16px;
          min-width:220px;
          border:1px solid rgba(255,255,255,0.1);
        ">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
            <span style="
              font-size:18px;font-weight:800;letter-spacing:2px;
              color:${s.status === 'SOS_ACTIVE' ? '#ef4444' : '#22c55e'};
            ">#${s.code}</span>
            <span style="
              font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px;
              background:${s.status === 'SOS_ACTIVE' ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.15)'};
              color:${s.status === 'SOS_ACTIVE' ? '#ef4444' : '#22c55e'};
              border:1px solid ${s.status === 'SOS_ACTIVE' ? 'rgba(239,68,68,0.4)' : 'rgba(34,197,94,0.3)'};
            ">${s.status}</span>
            ${(s.status === 'SOS_ACTIVE' && s.acknowledged) ? `
              <span style="font-size:10px;font-weight:700;color:#22c55e;">✓ Đã xác nhận</span>
            ` : ''}
          </div>
          ${s.address ? `<div style="font-size:12px;color:#94a3b8;margin-bottom:8px;">📍 ${s.address}</div>` : ''}
          <div style="font-size:11px;color:#475569;font-family:monospace;">
            ${s.latitude.toFixed(5)}, ${s.longitude.toFixed(5)}
          </div>
          ${s.status === 'SOS_ACTIVE' ? `
            <a href="https://www.google.com/maps?q=${s.latitude},${s.longitude}" 
              target="_blank"
              style="
                display:inline-flex;align-items:center;gap:6px;margin-top:12px;
                background:rgba(239,68,68,0.15);color:#ef4444;
                border:1px solid rgba(239,68,68,0.3);border-radius:7px;
                padding:6px 12px;font-size:12px;font-weight:600;text-decoration:none;
              ">
              🗺 Mở Google Maps
            </a>
          ` : ''}
        </div>
      `;

      marker.bindPopup(L.popup({
        className: 'dark-popup',
        maxWidth: 280,
      }).setContent(popupContent));

      markersRef.current.push(marker);
    });

    // Fit map to markers if any SOS
    const sosSessions = validSessions.filter(s => s.status === 'SOS_ACTIVE');
    if (sosSessions.length > 0) {
      const group = L.featureGroup(
        sosSessions.map(s => L.marker([s.latitude, s.longitude]))
      );
      map.fitBounds(group.getBounds().pad(0.3));
    } else if (validSessions.length > 0) {
      const group = L.featureGroup(
        validSessions.map(s => L.marker([s.latitude, s.longitude]))
      );
      map.fitBounds(group.getBounds().pad(0.3));
    }
  }, [sessions]);

  const sosSessions = sessions.filter(s => s.status === 'SOS_ACTIVE');
  const standbySessions = sessions.filter(s => s.status === 'STANDBY');
  const validSessions = sessions.filter(s => s.latitude !== 0 || s.longitude !== 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 110px)' }}>
      {/* Map stats bar */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap', flexShrink: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 10, padding: '8px 16px',
        }}>
          <AlertTriangle size={16} color="#ef4444" />
          <span style={{ color: '#ef4444', fontWeight: 700, fontSize: 14 }}>{sosSessions.length}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>SOS đang hoạt động</span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
          borderRadius: 10, padding: '8px 16px',
        }}>
          <CheckCircle size={16} color="#22c55e" />
          <span style={{ color: '#22c55e', fontWeight: 700, fontSize: 14 }}>{standbySessions.length}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Standby</span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--bg-glass)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '8px 16px',
        }}>
          <Map size={16} color="var(--accent-primary)" />
          <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 14 }}>{validSessions.length}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Có tọa độ GPS</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20, flex: 1, minHeight: 0 }}>
        {/* Left Column Wrapper */}
        <div style={{ width: 340, display: 'flex', flexDirection: 'column', gap: 16, flexShrink: 0, position: 'relative' }}>
          
          {/* Search bar */}
          <div style={{ position: 'relative', zIndex: 1000 }}>
            <form onSubmit={handleSearchLocation} style={{ display: 'flex', width: '100%', position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
              }}>
                <Map size={18} />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm thiết bị hoặc địa điểm..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                style={{
                  width: '100%',
                  background: '#111827',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: 12,
                  padding: '12px 40px 12px 42px',
                  color: '#f1f5f9',
                  fontSize: 14,
                  outline: 'none',
                  fontFamily: 'Inter, sans-serif',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => {
                  setShowSuggestions(true);
                  e.target.style.borderColor = '#f59e0b';
                  e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.15)';
                }}
                onBlur={(e) => {
                  setTimeout(() => setShowSuggestions(false), 200);
                  e.target.style.borderColor = 'rgba(245, 158, 11, 0.3)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                type="submit"
                disabled={isSearching}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: isSearching ? '#94a3b8' : '#f59e0b',
                  cursor: isSearching ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 4
                }}
              >
                {isSearching ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <Search size={18} />}
              </button>
            </form>
            
            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 8,
                background: '#111827', border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: 12, overflow: 'hidden', zIndex: 1001,
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
              }}>
                {suggestions.map(s => (
                  <div key={s.code} 
                    onClick={() => {
                      setSearchQuery(s.code);
                      setShowSuggestions(false);
                      if (leafletMap.current && s.latitude !== 0) {
                        leafletMap.current.flyTo([s.latitude, s.longitude], 17, { animate: true });
                        markersRef.current.forEach(m => {
                          const latLng = m.getLatLng();
                          if (latLng.lat === s.latitude && latLng.lng === s.longitude) m.openPopup();
                        });
                      }
                    }}
                    style={{
                      padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)',
                      display: 'flex', flexDirection: 'column', gap: 6, transition: 'var(--transition)'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ fontWeight: 600, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ color: s.status === 'SOS_ACTIVE' ? '#ef4444' : '#22c55e' }}>#{s.code}</span>
                      <span style={{ 
                        fontSize: 10, padding: '2px 6px', borderRadius: 4, 
                        background: s.status === 'SOS_ACTIVE' ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
                        color: s.status === 'SOS_ACTIVE' ? '#ef4444' : '#22c55e'
                      }}>{s.status}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>📍 {s.address || 'Đang cập nhật...'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Left Sidebar - Session List */}
          <div className="custom-scrollbar" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 12, 
            overflowY: 'auto', 
            paddingRight: 8,
            flex: 1
          }}>
            {sessions.length === 0 && (
              <div className="empty-state" style={{ padding: '40px 10px' }}>
                <p>Chưa có dữ liệu thiết bị</p>
              </div>
            )}
            {sessions.map(s => (
              <div key={s.code} style={{
                background: 'var(--bg-card)',
                border: `1px solid ${s.status === 'SOS_ACTIVE' ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
                borderRadius: 12,
                padding: '16px',
                cursor: 'pointer',
                transition: 'var(--transition)'
              }}
              onClick={() => {
                if (s.latitude && s.longitude && leafletMap.current) {
                  leafletMap.current.flyTo([s.latitude, s.longitude], 17, { animate: true });
                  // Open popup
                  markersRef.current.forEach(m => {
                    const latLng = m.getLatLng();
                    if (latLng.lat === s.latitude && latLng.lng === s.longitude) m.openPopup();
                  });
                }
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ 
                    fontWeight: 800, 
                    fontSize: 16,
                    color: s.status === 'SOS_ACTIVE' ? '#ef4444' : '#22c55e'
                  }}>#{s.code}</span>
                  <span className={`badge ${s.status === 'SOS_ACTIVE' ? 'badge-sos' : 'badge-standby'}`}>
                    {s.status}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, display: 'flex', gap: 6 }}>
                  <span>📍</span> 
                  <span style={{ flex: 1 }}>{s.address || 'Đang cập nhật vị trí...'}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', paddingLeft: 22, fontFamily: 'monospace' }}>
                  {s.latitude !== 0 ? `${s.latitude.toFixed(5)}, ${s.longitude.toFixed(5)}` : 'Chưa có tọa độ GPS'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Map Container */}
        <div className="map-container" style={{ flex: 1, position: 'relative', height: '100%', margin: 0 }}>

          {loading && (
            <div style={{
              position: 'absolute',
              inset: 0,
              zIndex: 999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(10,13,20,0.7)',
              backdropFilter: 'blur(4px)',
              borderRadius: 'var(--radius-lg)',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto 12px' }} />
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Đang tải dữ liệu bản đồ...</div>
              </div>
            </div>
          )}
          <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-lg)' }} />

          {/* Legend */}
          <div className="map-legend">
            <h4>Chú giải bản đồ</h4>
            <div className="legend-item">
              <div className="legend-dot" style={{ background: '#ef4444', boxShadow: '0 0 6px #ef4444' }} />
              SOS đang hoạt động
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ background: '#22c55e' }} />
              Standby (an toàn)
            </div>
          </div>
        </div>
      </div>

      {/* Dark popup style override */}
      <style>{`
        .dark-popup .leaflet-popup-content-wrapper {
          background: transparent !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6) !important;
          padding: 0 !important;
          border-radius: 10px !important;
        }
        .dark-popup .leaflet-popup-tip {
          background: #111827 !important;
        }
        .dark-popup .leaflet-popup-content {
          margin: 0 !important;
        }
        .leaflet-control-attribution {
          background: rgba(10,13,20,0.8) !important;
          color: var(--text-muted) !important;
        }
        .leaflet-control-attribution a { color: var(--accent-primary) !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}
