// Shared type dùng chung cho tất cả components và pages
export interface PairingSession {
  code: string;
  name?: string;
  status: 'STANDBY' | 'SOS_ACTIVE';
  latitude: number;
  longitude: number;
  address: string;
  timestamp: number;
  acknowledged?: boolean;
  acknowledgedAt?: number;
  battery?: number;
  network?: string;
  isOffline?: boolean;
}

export interface AdminUser {
  uid: string;
  email: string;
  role: string;
  createdAt: number;
}
