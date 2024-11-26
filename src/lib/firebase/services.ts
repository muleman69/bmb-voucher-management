import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  getDocs,
  Timestamp,
  serverTimestamp,
  writeBatch,
  increment,
  DocumentReference
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
    const batch = writeBatch(db);
    let batchCount = 0;
    const BATCH_SIZE = 500; // Firebase limit

    try {
      console.log(`Starting to generate ${quantity} vouchers for campaign: ${campaignName}`);

      // First, create or get campaign document
      const campaignRef = await this.getOrCreateCampaign(campaignName, expiryDate, mailchimpCampaignId);

      for (let i = 0; i < quantity; i++) {
        // Generate unique code
        const code = await this.generateUniqueCode();
        
        // Generate and upload QR code
        const qrDataUrl = await QRCode.toDataURL(code, {
          width: 300,
          margin: 2,
          color: {
            dark: '#115E59',
            light: '#FFFFFF'
          }
        });

        // Upload QR code to Firebase Storage with retry logic
        const qrCodeUrl = await this.uploadQRCode(code, qrDataUrl);

        // Create voucher document
        const voucherRef = doc(collection(db, 'vouchers'));
        const voucherData: Omit<Voucher, 'id'> = {
          code,
          qrCodeUrl,
          campaignName,
          expiryDate: Timestamp.fromDate(expiryDate),
          isUsed: false,
          createdAt: Timestamp.now(),
          mailchimpCampaignId
        };

        batch.set(voucherRef, voucherData);
        vouchers.push({ id: voucherRef.id, ...voucherData });

        batchCount++;

        // Commit batch when it reaches the limit
        if (batchCount === BATCH_SIZE) {
          await batch.commit();
          batch = writeBatch(db);
          batchCount = 0;
        }
      }

      // Commit any remaining documents
      if (batchCount > 0) {
        await batch.commit();
      }

      // Update campaign statistics
      await this.updateCampaignStatistics(campaignName, quantity);

      console.log(`Successfully generated ${quantity} vouchers for campaign: ${campaignName}`);
      return vouchers;

    } catch (error) {
      console.error('Error generating vouchers:', error);
      throw new Error('Failed to generate vouchers: ' + (error as Error).message);
    }
  },

  async uploadQRCode(code: string, qrDataUrl: string, retries = 3): Promise<string> {
    try {
      const storageRef = ref(storage, `qr-codes/${code}.png`);
      await uploadString(storageRef, qrDataUrl, 'data_url');
      return await getDownloadURL(storageRef);
    } catch (error) {
      if (retries > 0) {
        console.log(`Retrying QR code upload for ${code}, ${retries} attempts remaining`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.uploadQRCode(code, qrDataUrl, retries - 1);
      }
      throw error;
    }
  },

  async generateUniqueCode(length: number = 8): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let attempts = 0;
    const MAX_ATTEMPTS = 10;

    while (attempts < MAX_ATTEMPTS) {
      const code = Array.from(
        { length }, 
        () => chars.charAt(Math.floor(Math.random() * chars.length))
      ).join('');

      // Check if code exists
      const q = query(collection(db, 'vouchers'), where('code', '==', code));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return code;
      }

      attempts++;
    }

    throw new Error('Failed to generate unique code after maximum attempts');
  },

  async redeemVoucher(code: string): Promise<boolean> {
    try {
      const vouchersRef = collection(db, 'vouchers');
      const q = query(vouchersRef, where('code', '==', code));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return false;
      }

      const voucherDoc = querySnapshot.docs[0];
      const voucher = voucherDoc.data() as Voucher;

      if (voucher.isUsed || voucher.expiryDate.toDate() < new Date()) {
        return false;
      }

      const batch = writeBatch(db);

      // Update voucher
      batch.update(doc(db, 'vouchers', voucherDoc.id), {
        isUsed: true,
        usedAt: serverTimestamp()
      });

      // Update campaign statistics
      const campaignsRef = collection(db, 'campaigns');
      const campaignQuery = query(campaignsRef, where('name', '==', voucher.campaignName));
      const campaignSnapshot = await getDocs(campaignQuery);

      if (!campaignSnapshot.empty) {
        batch.update(doc(db, 'campaigns', campaignSnapshot.docs[0].id), {
          usedVouchers: increment(1)
        });
      }

      await batch.commit();
      return true;

    } catch (error) {
      console.error('Error redeeming voucher:', error);
      throw new Error('Failed to redeem voucher');
    }
  },

  async updateCampaignStatistics(campaignName: string, addedVouchers: number): Promise<void> {
    const campaignsRef = collection(db, 'campaigns');
    const q = query(campaignsRef, where('name', '==', campaignName));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      await updateDoc(doc(db, 'campaigns', querySnapshot.docs[0].id), {
        totalVouchers: increment(addedVouchers)
      });
    }
  },

  async getOrCreateCampaign(
    name: string, 
    expiryDate: Date, 
    mailchimpCampaignId?: string
  ): Promise<DocumentReference> {
    const campaignsRef = collection(db, 'campaigns');
    const q = query(campaignsRef, where('name', '==', name));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return doc(db, 'campaigns', querySnapshot.docs[0].id);
    }

    const campaignData = {
      name,
      expiryDate: Timestamp.fromDate(expiryDate),
      totalVouchers: 0,
      usedVouchers: 0,
      createdAt: serverTimestamp(),
      mailchimpCampaignId
    };

    return await addDoc(collection(db, 'campaigns'), campaignData);
  }
};
