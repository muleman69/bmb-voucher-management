import { Handler } from '@netlify/functions';
import mailchimp from '@mailchimp/mailchimp_marketing';
import md5 from 'md5';
import type { VoucherData, MailchimpWebhookData } from './utils/types';

const handler: Handler = async (event) => {
  console.log('Webhook Invoked', event.httpMethod);

  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Webhook URL verified" })
    };
  }

  if (event.httpMethod === 'POST') {
    try {
      const {
        MAILCHIMP_API_KEY,
        MAILCHIMP_AUDIENCE_ID,
        MAILCHIMP_WEBHOOK_SECRET
      } = process.env;

      if (!MAILCHIMP_API_KEY || !MAILCHIMP_AUDIENCE_ID || !MAILCHIMP_WEBHOOK_SECRET) {
        throw new Error('Missing required environment variables');
      }

      // Parse webhook data
      let data: MailchimpWebhookData;
      try {
        data = JSON.parse(event.body || '{}');
      } catch {
        const formData = new URLSearchParams(event.body || '');
        data = Object.fromEntries(formData);
      }

      const email = data['data[merges][EMAIL]'] || data['data[email]'];
      if (!email) {
        throw new Error('Email not found in webhook data');
      }

      console.log(`Processing webhook for email: ${email}`);

      // Initialize Mailchimp client
      mailchimp.setConfig({
        apiKey: MAILCHIMP_API_KEY,
        server: MAILCHIMP_API_KEY.split('-')[1]
      });

      // Create voucher data
      const voucher: VoucherData = {
        code: `AGAVIA${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        qrCode: `https://buildmybrand.xyz/voucher/${code}`,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        isUsed: false
      };

      // Update Mailchimp subscriber with voucher data
      const subscriberHash = md5(email.toLowerCase());
      await mailchimp.lists.updateListMember(MAILCHIMP_AUDIENCE_ID, subscriberHash, {
        merge_fields: {
          VOUCHER: voucher.code,
          VEXPIRY: voucher.expiryDate.split('T')[0],
          VQRCODE: voucher.qrCode
        }
      });

      console.log(`Successfully assigned voucher ${voucher.code} to ${email}`);

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          email,
          voucher: voucher.code
        })
      };

    } catch (error) {
      console.error('Webhook error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: String(error),
          details: error instanceof Error ? error.stack : undefined
        })
      };
    }
  }

  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};

export { handler };
