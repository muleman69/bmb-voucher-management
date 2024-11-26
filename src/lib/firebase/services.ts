import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  getDocs,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, storage } from './config';
import QRCode from 'qrcode';
import type { Voucher, Campaign } from './schema';

export const voucherServices = {
  async generateVouchers(
    quantity: number,
    expiryDate: Date,
    campaignName: string,
    mailchimpCampaignId?: string
  ): Promise<Voucher[]> {
    const vouchers: Voucher[] = [];

    for (let i = 0; i < quantity; i++) {
      // Generate unique code
      const code = await this.generateUniqueCode();

      // Generate QR code
      const qrDataUrl = await QRCode.toDataURL(code);
      
      // Upload QR code to Firebase Storage
      const storageRef = ref(storage, `qr-codes/${code}.png`);
      await uploadString(storageRef, qrDataUrl, 'data_url');
      const qrCodeUrl = await getDownloadURL(storageRef);

      // Create voucher document
      const voucherData: Omit<Voucher, 'id'> = {
        code,
        qrCodeUrl,
        campaignName,
        expiryDate: Timestamp.fromDate(expiryDate),
        isUsed: false,
        createdAt: Timestamp.now(),
        mailchimpCampaignId
      };

      const docRef = await addDoc(collection(db, 'vouchers'), voucherData);
      vouchers.push({ id: docRef.id, ...voucherData });

      // Update campaign voucher count
      await this.updateCampaignCount(campaignName);
    }

    return vouchers;
  },

  async generateUniqueCode(length: number = 8): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code: string;
    let isUnique = false;

    while (!isUnique) {
      code = '';
      for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Check if code exists
      const q = query(collection(db, 'vouchers'), where('code', '==', code));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        isUnique = true;
        break;
      }
    }

    return code!;
  },

  async redeemVoucher(code: string): Promise<boolean> {
    const vouchersRef = collection(db, 'vouchers');
    const q = query(vouchersRef, where('code', '==', code));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) return false;

    const voucherDoc = querySnapshot.docs[0];
    const voucher = voucherDoc.data() as Voucher;

    if (voucher.isUsed || voucher.expiryDate.toDate() < new Date()) {
      return false;
    }

    await updateDoc(doc(db, 'vouchers', voucherDoc.id), {
      isUsed: true,
      usedAt: serverTimestamp()
    });

    return true;
  },

  // Remove `private` keyword here as it’s not allowed in object literals
  async updateCampaignCount(campaignName: string): Promise<void> {
    const campaignsRef = collection(db, 'campaigns');
    const q = query(campaignsRef, where('name', '==', campaignName));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const campaignDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, 'campaigns', campaignDoc.id), {
        totalVouchers: campaignDoc.data().totalVouchers + 1
      });
    }
  }
};

export const campaignServices = {
  async createCampaign(name: string, expiryDate: Date, mailchimpCampaignId?: string): Promise<Campaign> {
    const campaignData = {
      name,
      expiryDate: Timestamp.fromDate(expiryDate),
      totalVouchers: 0,
      usedVouchers: 0,
      createdAt: serverTimestamp(),
      mailchimpCampaignId
    };

    const docRef = await addDoc(collection(db, 'campaigns'), campaignData);
    return { id: docRef.id, ...campaignData };
  }
};
