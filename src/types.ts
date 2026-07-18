// Shared type dùng chung cho tất cả components và pages
export interface PairingSession {
  code: string;
  status: 'STANDBY' | 'SOS_ACTIVE';
  latitude: number;
  longitude: number;
  address: string;
  timestamp: number;
}

export interface AdminUser {
  uid: string;
  email: string;
  role: string;
  createdAt: number;
}
