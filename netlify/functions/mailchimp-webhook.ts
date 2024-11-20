import { Handler } from '@netlify/functions';
import mailchimp from '@mailchimp/mailchimp_marketing';
import md5 from 'md5';

interface MailchimpWebhookData {
  type: string;
  fired_at: string;
  data: {
    email?: string;
    list_id: string;
    merges: Record<string, string>;
  };
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
      // Parse the webhook payload
      const rawPayload = JSON.parse(event.body || '{}');
      console.log('Webhook payload received:', JSON.stringify(rawPayload, null, 2));

      // Extract information from the payload
      const email = rawPayload['data[email]'];
      const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;
      const campaignId = rawPayload['data[merges][CAMPAIGN_ID]']; // Extract campaign ID from payload merge fields

      if (!email) {
        throw new Error('Email not provided in the payload');
      }

      if (!campaignId) {
        throw new Error('Campaign ID not provided in the payload');
      }

      // No need to hardcode or validate campaign ID in the backend.
      console.log(`Processing Campaign ID: ${campaignId}`);

      // Initialize Mailchimp client
      const apiKey = process.env.MAILCHIMP_API_KEY;

      if (!apiKey || !audienceId) {
        throw new Error('Mailchimp configuration missing');
      }

      mailchimp.setConfig({
        apiKey,
        server: apiKey.split('-')[1],
      });

      // Generate a new voucher code
      const voucherCode = generateVoucherCode();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30); // 30 days validity

      // Update subscriber with voucher details
      await mailchimp.lists.updateListMember(audienceId, md5(email.toLowerCase()), {
        merge_fields: {
          VOUCHER: voucherCode,
          VEXPIRY: expiryDate.toISOString().split('T')[0],
        },
      });

      console.log(`Updated subscriber ${email} with voucher code ${voucherCode}`);

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true }),
      };
    } catch (error) {
      console.error('Webhook processing error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Webhook processing failed' }),
      };
    }
  }

  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Method not allowed' }),
  };
};

// Helper function to generate voucher code
function generateVoucherCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export { handler };


