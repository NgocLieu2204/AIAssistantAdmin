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
        const list: PairingSession[] = Object.entries(data).map(([code, val]: [string, any]) => ({
          code,
          status: val.status || 'STANDBY',
          latitude: val.latitude || 0,
          longitude: val.longitude || 0,
          address: val.address || '',
          timestamp: val.timestamp || 0,
        }));
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
