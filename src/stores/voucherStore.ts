typescript
import { create } from 'zustand';
import { voucherServices, campaignServices } from '../lib/firebase/services';
import type { Voucher, Campaign } from '../lib/firebase/schema';
import toast from 'react-hot-toast';
import { 
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase/config';

interface VoucherStore {
  vouchers: Voucher[];
  campaigns: Campaign[];
  isLoading: boolean;
  generateVouchers: (quantity: number, expiryDate: Date, campaignName: string, mailchimpCampaignId?: string) => Promise<void>;
  redeemVoucher: (code: string) => Promise<boolean>;
  createCampaign: (name: string, expiryDate: Date, mailchimpCampaignId?: string) => Promise<void>;
  deleteCampaign: (campaignName: string) => Promise<void>;
  initialize: () => void;
}

export const useVoucherStore = create<VoucherStore>((set, get) => ({
  vouchers: [],
  campaigns: [],
  isLoading: true,

  initialize: () => {
    // Set up real-time listeners
    const vouchersUnsubscribe = onSnapshot(
      query(collection(db, 'vouchers'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const vouchers = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Voucher[];
        set({ vouchers, isLoading: false });
      }
    );

    const campaignsUnsubscribe = onSnapshot(
      query(collection(db, 'campaigns'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const campaigns = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Campaign[];
        set({ campaigns });
      }
    );

    // Clean up listeners on unmount
    return () => {
      vouchersUnsubscribe();
      campaignsUnsubscribe();
    };
  },

  generateVouchers: async (quantity, expiryDate, campaignName, mailchimpCampaignId) => {
    try {
      await voucherServices.generateVouchers(quantity, expiryDate, campaignName, mailchimpCampaignId);
      toast.success(`Generated ${quantity} vouchers successfully!`);
    } catch (error) {
      console.error('Error generating vouchers:', error);
      toast.error('Failed to generate vouchers');
      throw error;
    }
  },

  redeemVoucher: async (code) => {
    try {
      const success = await voucherServices.redeemVoucher(code);
      if (success) {
        toast.success('Voucher redeemed successfully!');
      } else {
        toast.error('Invalid or expired voucher');
      }
      return success;
    } catch (error) {
      console.error('Error redeeming voucher:', error);
      toast.error('Failed to redeem voucher');
      throw error;
    }
  },

  createCampaign: async (name, expiryDate, mailchimpCampaignId) => {
    try {
      await campaignServices.createCampaign(name, expiryDate, mailchimpCampaignId);
      toast.success('Campaign created successfully!');
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign');
      throw error;
    }
  },

  deleteCampaign: async (campaignName) => {
    try {
      await voucherServices.deleteCampaign(campaignName);
      toast.success('Campaign deleted successfully');
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Failed to delete campaign');
      throw error;
    }
  }
}));
