import { Handler } from '@netlify/functions';
import mailchimp from '@mailchimp/mailchimp_marketing';
import md5 from 'md5';

interface MailchimpData {
  'data[merges][EMAIL]'?: string;
  'data[email]'?: string;
  'data[merges][CAMPAIGNID]'?: string;
  'data[merges][FNAME]'?: string;
  'data[merges][LNAME]'?: string;
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
      // Parse the incoming data
      let data: MailchimpData;
      try {
        const rawData = event.body || '{}';
        // Try parsing as JSON first
        data = JSON.parse(rawData);
      } catch (e) {
        // If JSON parsing fails, try form data
        const formData = new URLSearchParams(event.body);
        data = Object.fromEntries(formData);
      }

      console.log('Data received:', data);

      // Extract email from the Mailchimp data structure
      const email = data['data[merges][EMAIL]'] || data['data[email]'];
      const campaignId = data['data[merges][CAMPAIGNID]'] || '9074479';

      if (!email) {
        console.error('Email missing from data:', data);
        throw new Error('Email not found in webhook data');
      }

      console.log(`Processing for email: ${email}, campaign: ${campaignId}`);

      // Initialize Mailchimp client
      const apiKey = process.env.MAILCHIMP_API_KEY;
      const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;

      if (!apiKey || !audienceId) {
        throw new Error('Mailchimp configuration missing');
      }

      mailchimp.setConfig({
        apiKey,
        server: apiKey.split('-')[1],
      });

      // Generate voucher code
      const voucherCode = generateVoucherCode();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7);

      // Update subscriber in Mailchimp
      const subscriberHash = md5(email.toLowerCase());
      await mailchimp.lists.updateListMember(audienceId, subscriberHash, {
        merge_fields: {
          VOUCHER: voucherCode,
          VEXPIRY: expiryDate.toISOString().split('T')[0],
          CAMPAIGNID: campaignId
        },
      });

      console.log(`Successfully updated subscriber ${email} with voucher ${voucherCode}`);

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          email,
          voucherCode,
          expiryDate: expiryDate.toISOString().split('T')[0]
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

function generateVoucherCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'AGAVIA-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export { handler };


