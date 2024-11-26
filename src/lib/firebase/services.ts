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

    console.log(`Starting to generate ${quantity} vouchers for campaign: ${campaignName}`);

    for (let i = 0; i < quantity; i++) {
      console.log(`Generating voucher ${i + 1}/${quantity}`);

      // Generate unique code
      const code = await this.generateUniqueCode();
      console.log(`Generated unique code: ${code}`);

      // Generate QR code
      const qrDataUrl = await QRCode.toDataURL(code);
      console.log(`Generated QR code for ${code}`);

      // Upload QR code to Firebase Storage
      const storageRef = ref(storage, `qr-codes/${code}.png`);
      await uploadString(storageRef, qrDataUrl, 'data_url');
      const qrCodeUrl = await getDownloadURL(storageRef);
      console.log(`Uploaded QR code to storage and got URL: ${qrCodeUrl}`);

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
      console.log(`Created voucher document with ID: ${docRef.id}`);
      vouchers.push({ id: docRef.id, ...voucherData });

      // Update campaign voucher count
      console.log(`Updating campaign voucher count for campaign: ${campaignName}`);
      await this.updateCampaignCount(campaignName);
    }

    console.log(`Finished generating ${quantity} vouchers for campaign: ${campaignName}`);
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

    console.log(`Generated unique and unused code: ${code}`);
    return code!;
  },

  async redeemVoucher(code: string): Promise<boolean> {
    console.log(`Attempting to redeem voucher with code: ${code}`);

    const vouchersRef = collection(db, 'vouchers');
    const q = query(vouchersRef, where('code', '==', code));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log(`Voucher with code: ${code} not found.`);
      return false;
    }

    const voucherDoc = querySnapshot.docs[0];
    const voucher = voucherDoc.data() as Voucher;

    if (voucher.isUsed || voucher.expiryDate.toDate() < new Date()) {
      console.log(`Voucher with code: ${code} is either used or expired.`);
      return false;
    }

    await updateDoc(doc(db, 'vouchers', voucherDoc.id), {
      isUsed: true,
      usedAt: serverTimestamp()
    });

    console.log(`Voucher with code: ${code} successfully redeemed.`);
    return true;
  },

  async updateCampaignCount(campaignName: string): Promise<void> {
    console.log(`Updating campaign count for: ${campaignName}`);

    const campaignsRef = collection(db, 'campaigns');
    const q = query(campaignsRef, where('name', '==', campaignName));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const campaignDoc = querySnapshot.docs[0];
      const updatedCount = campaignDoc.data().totalVouchers + 1;
      console.log(`Incrementing voucher count for campaign: ${campaignName} to ${updatedCount}`);
      await updateDoc(doc(db, 'campaigns', campaignDoc.id), {
        totalVouchers: updatedCount
      });
    } else {
      console.log(`Campaign with name: ${campaignName} not found.`);
    }
  }
};

export const campaignServices = {
  async createCampaign(name: string, expiryDate: Date, mailchimpCampaignId?: string): Promise<Campaign> {
    console.log(`Creating campaign: ${name} with expiry date: ${expiryDate}`);

    const campaignData = {
      name,
      expiryDate: Timestamp.fromDate(expiryDate),
      totalVouchers: 0,
      usedVouchers: 0,
      createdAt: serverTimestamp(),
      mailchimpCampaignId
    };

    const docRef = await addDoc(collection(db, 'campaigns'), campaignData);
    console.log(`Created campaign with ID: ${docRef.id}`);
    return { id: docRef.id, ...campaignData };
  }
};
