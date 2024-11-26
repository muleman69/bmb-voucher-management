import { Timestamp } from 'firebase/firestore';

export interface Voucher {
  id: string;
  code: string;
  qrCodeUrl: string;
  campaignName: string;
  expiryDate: Timestamp;
  isUsed: boolean;
  usedAt?: Timestamp;
  createdAt: Timestamp;
  assignedTo?: string;
  assignedAt?: Timestamp;
  mailchimpCampaignId?: string;
}

export interface Campaign {
  id: string;
  name: string;
  createdAt: Timestamp;
  expiryDate: Timestamp;
  totalVouchers: number;
  usedVouchers: number;
  mailchimpCampaignId?: string;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'staff';
  createdAt: Timestamp;
}
