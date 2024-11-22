// Shared types for the function
export interface VoucherData {
  code: string;
  qrCode: string;
  expiryDate: string;
  campaignName?: string;
  isUsed: boolean;
  usedAt?: string;
}

export interface MailchimpWebhookData {
  'data[merges][EMAIL]'?: string;
  'data[email]'?: string;
  'data[merges][FNAME]'?: string;
  'data[merges][LNAME]'?: string;
  'data[merges][CAMPAIGNID]'?: string;
}
