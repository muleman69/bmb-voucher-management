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
    let batch = writeBatch(db);
    let batchCount = 0;
    const BATCH_SIZE = 500; // Firebase batch limit

    try {
      console.log(`Starting to generate ${quantity} vouchers for campaign: ${campaignName}`);

      // First, create or get campaign reference
      const campaignRef = await this.getOrCreateCampaign(campaignName, expiryDate, mailchimpCampaignId);

      for (let i = 0; i < quantity; i++) {
        // Generate unique code
        const code = await this.generateUniqueCode();
        
        // Generate QR code
        const qrDataUrl = await QRCode.toDataURL(code, {
          width: 300,
          margin: 2,
          color: {
            dark: '#115E59',
            light: '#FFFFFF'
          }
        });

        // Upload QR code to Firebase Storage
        const storageRef = ref(storage, `qr-codes/${code}.png`);
        await uploadString(storageRef, qrDataUrl, 'data_url');
        const qrCodeUrl = await getDownloadURL(storageRef);

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
        vouchers.push({ id: voucherRef.id, ...voucherData } as Voucher);

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

      // Update campaign voucher count
      await updateDoc(campaignRef, {
        totalVouchers: increment(quantity)
      });

      return vouchers;

    } catch (error) {
      console.error('Error generating vouchers:', error);
      throw new Error('Failed to generate vouchers: ' + (error instanceof Error ? error.message : 'Unknown error'));
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
      return false;
    }
  },

  async assignVoucher(code: string, email: string): Promise<boolean> {
    try {
      const vouchersRef = collection(db, 'vouchers');
      const q = query(vouchersRef, where('code', '==', code));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty || querySnapshot.docs[0].data().assignedTo) {
        return false;
      }

      await updateDoc(doc(db, 'vouchers', querySnapshot.docs[0].id), {
        assignedTo: email,
        assignedAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error assigning voucher:', error);
      return false;
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

    const docRef = await addDoc(campaignsRef, {
      name,
      expiryDate: Timestamp.fromDate(expiryDate),
      totalVouchers: 0,
      usedVouchers: 0,
      createdAt: serverTimestamp(),
      mailchimpCampaignId
    });

    return docRef;
  }
};

export const campaignServices = {
  async getCampaignStats(campaignName: string): Promise<{
    total: number;
    used: number;
    expired: number;
  }> {
    const q = query(collection(db, 'vouchers'), where('campaignName', '==', campaignName));
    const querySnapshot = await getDocs(q);
    const now = new Date();

    return querySnapshot.docs.reduce((stats, doc) => {
      const voucher = doc.data() as Voucher;
      return {
        total: stats.total + 1,
        used: stats.used + (voucher.isUsed ? 1 : 0),
        expired: stats.expired + (voucher.expiryDate.toDate() < now ? 1 : 0)
      };
    }, { total: 0, used: 0, expired: 0 });
  }
};
