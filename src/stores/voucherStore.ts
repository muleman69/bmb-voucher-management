import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { generateUniqueCode, generateQRCode } from '../utils/voucherUtils';
import toast from 'react-hot-toast';

interface Voucher {
  id: string;
  code: string;
  qrCode: string;
  campaignName: string;
  expiryDate: string;
  isUsed: boolean;
  usedAt?: string;
  createdAt: string;
  assignedTo?: string;
  assignedAt?: string;
  mailchimpCampaignId?: string;
}

interface VoucherStore {
  vouchers: Voucher[];
  generateVouchers: (quantity: number, expiryDate: Date, campaignName: string, mailchimpCampaignId?: string) => Promise<void>;
  redeemVoucher: (code: string) => Promise<boolean>;
  getVoucherByCode: (code: string) => Voucher | undefined;
  getVouchersByCampaign: (campaignName: string) => Voucher[];
  assignVoucher: (code: string, email: string) => Promise<boolean>;
  getUnassignedVoucherForCampaign: (campaignName: string) => Voucher | undefined;
  getCampaignByMailchimpId: (campaignId: string) => string | undefined;
  deleteCampaign: (campaignName: string) => Promise<void>;
}

const migrate = (persistedState: any, version: number) => {
  if (version === 0) {
    return {
      ...persistedState,
      vouchers: persistedState.vouchers.map((v: Voucher) => ({
        ...v,
        mailchimpCampaignId: v.mailchimpCampaignId || undefined,
        assignedTo: v.assignedTo || undefined,
        assignedAt: v.assignedAt || undefined,
      })),
      version: 1,
    };
  }
  return persistedState;
};

export const useVoucherStore = create<VoucherStore>()(
  persist(
    (set, get) => ({
      vouchers: [],
      
      generateVouchers: async (quantity: number, expiryDate: Date, campaignName: string, mailchimpCampaignId?: string) => {
        try {
          const existingVouchers = get().vouchers;
          const newVouchers: Voucher[] = [];
          const existingCodes = new Set(existingVouchers.map(v => v.code));
          
          for (let i = 0; i < quantity; i++) {
            let code;
            do {
              code = generateUniqueCode();
            } while (existingCodes.has(code));
            
            existingCodes.add(code);
            
            const qrCode = await generateQRCode(code);
            newVouchers.push({
              id: crypto.randomUUID(),
              code,
              qrCode,
              campaignName,
              expiryDate: expiryDate.toISOString(),
              isUsed: false,
              createdAt: new Date().toISOString(),
              mailchimpCampaignId
            });
          }
          
          set({ vouchers: [...existingVouchers, ...newVouchers] });
          toast.success(`Generated ${quantity} vouchers successfully!`);
        } catch (error) {
          console.error('Error generating vouchers:', error);
          throw error;
        }
      },
      
      redeemVoucher: async (code: string) => {
        const voucher = get().getVoucherByCode(code);
        
        if (!voucher || voucher.isUsed || new Date(voucher.expiryDate) < new Date()) {
          return false;
        }
        
        set((state) => ({
          vouchers: state.vouchers.map((v) =>
            v.code === code
              ? { ...v, isUsed: true, usedAt: new Date().toISOString() }
              : v
          ),
        }));
        
        return true;
      },
      
      getVoucherByCode: (code: string) => {
        return get().vouchers.find((v) => v.code === code);
      },

      getVouchersByCampaign: (campaignName: string) => {
        return get().vouchers.filter((v) => v.campaignName === campaignName);
      },

      assignVoucher: async (code: string, email: string) => {
        const voucher = get().getVoucherByCode(code);
        if (!voucher || voucher.assignedTo || voucher.isUsed) {
          return false;
        }

        set((state) => ({
          vouchers: state.vouchers.map((v) =>
            v.code === code
              ? { ...v, assignedTo: email, assignedAt: new Date().toISOString() }
              : v
          ),
        }));
        return true;
      },

      getUnassignedVoucherForCampaign: (campaignName: string) => {
        return get().vouchers.find(
          (v) => v.campaignName === campaignName && !v.assignedTo && !v.isUsed
        );
      },

      getCampaignByMailchimpId: (campaignId: string) => {
        const voucher = get().vouchers.find((v) => v.mailchimpCampaignId === campaignId);
        return voucher?.campaignName;
      },

      deleteCampaign: async (campaignName: string) => {
        try {
          set((state) => ({
            vouchers: state.vouchers.filter((v) => v.campaignName !== campaignName),
          }));
        } catch (error) {
          console.error('Error deleting campaign:', error);
          throw new Error('Failed to delete campaign');
        }
      },
    }),
    {
      name: 'agavia-vouchers',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate,
    }
  )
);