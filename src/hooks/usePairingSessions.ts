import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import type { PairingSession } from '../types';

export function usePairingSessions() {
  const [sessions, setSessions] = useState<PairingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pairingsRef = ref(db, 'pairings');

    const unsubscribe = onValue(pairingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const now = Date.now();
        const list: PairingSession[] = Object.entries(data).map(([code, val]: [string, any]) => {
          let timestamp = val.timestamp || 0;
          
          // Nếu timestamp quá nhỏ (ví dụ độ dài 10 số thay vì 13 số), có nghĩa là App Android đang gửi lên số Giây thay vì Mili-giây
          if (timestamp > 0 && timestamp < 100000000000) {
            timestamp = timestamp * 1000;
          }
          
          // Tăng thời gian phát hiện Offline lên 5 phút để tránh lỗi sai lệch múi giờ (Clock drift) hoặc mạng chậm
          const isOffline = (now - timestamp) > 5 * 60 * 1000; 

          return {
            code,
            name: val.name || '',
            status: val.status || 'STANDBY',
            latitude: val.latitude || 0,
            longitude: val.longitude || 0,
            address: val.address || '',
            timestamp,
            acknowledged: val.acknowledged || false,
            battery: val.battery,
            network: val.network,
            isOffline
          };
        });
        // Sort: SOS first, then by timestamp desc
        list.sort((a, b) => {
          if (a.status === 'SOS_ACTIVE' && b.status !== 'SOS_ACTIVE') return -1;
          if (b.status === 'SOS_ACTIVE' && a.status !== 'SOS_ACTIVE') return 1;
          return b.timestamp - a.timestamp;
        });
        setSessions(list);
      } else {
        setSessions([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { sessions, loading };
}
