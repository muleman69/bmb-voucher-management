import { Handler } from '@netlify/functions';
import mailchimp from '@mailchimp/mailchimp_marketing';
import md5 from 'md5';
import crypto from 'crypto';
import { useVoucherStore } from '../stores/voucherStore';
import { useSettingsStore } from '../stores/settingsStore';

interface MailchimpData {
  'data[merges][EMAIL]'?: string;
  'data[email]'?: string;
  'data[merges][FNAME]'?: string;
  'data[merges][LNAME]'?: string;
  'data[merges][CAMPAIGNID]'?: string;
}

const handler: Handler = async (event) => {
  console.log('Webhook Invoked', event.httpMethod);

  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Webhook URL verified" }),
    };
  }

  if (event.httpMethod === 'POST') {
    try {
      // Verify webhook signature
      const webhookSecret = process.env.MAILCHIMP_WEBHOOK_SECRET;
      if (!webhookSecret) {
        throw new Error('Webhook secret not configured');
      }

      // Parse the incoming data
      let data: MailchimpData;
      try {
        const rawData = event.body || '{}';
        data = JSON.parse(rawData);
      } catch {
        const formData = new URLSearchParams(event.body);
        data = Object.fromEntries(formData);
      }

      // Extract email and campaign ID
      const email = data['data[merges][EMAIL]'] || data['data[email]'];
      const campaignId = data['data[merges][CAMPAIGNID]'] || 'default';

      if (!email) {
        throw new Error('Email not found in webhook data');
      }

      console.log(`Processing for email: ${email}, campaign: ${campaignId}`);

      // Get an unassigned voucher
      const voucherStore = useVoucherStore.getState();
      const settings = useSettingsStore.getState();
      
      const campaign = voucherStore.getCampaignByMailchimpId(campaignId);
      if (!campaign) {
        throw new Error('No campaign found for given ID');
      }

      const voucher = voucherStore.getUnassignedVoucherForCampaign(campaign);
      if (!voucher) {
        throw new Error('No available vouchers for campaign');
      }

      // Assign voucher to subscriber
      await voucherStore.assignVoucher(voucher.code, email);

      // Update subscriber in Mailchimp with voucher details
      mailchimp.setConfig({
        apiKey: settings.mailchimpApiKey,
        server: settings.mailchimpApiKey.split('-')[1],
      });

      const subscriberHash = md5(email.toLowerCase());
      await mailchimp.lists.updateListMember(settings.mailchimpAudienceId, subscriberHash, {
        merge_fields: {
          VOUCHER: voucher.code,
          VEXPIRY: new Date(voucher.expiryDate).toISOString().split('T')[0],
          VQRCODE: voucher.qrCode
        },
      });

      console.log(`Successfully assigned voucher ${voucher.code} to ${email}`);

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          email,
          voucher: voucher.code
        }),
      };

    } catch (error) {
      console.error('Webhook processing error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: String(error),
          details: error instanceof Error ? error.stack : undefined
        }),
      };
    }
  }

  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Method not allowed' }),
  };
};

export { handler };
