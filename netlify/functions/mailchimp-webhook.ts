import { Handler } from '@netlify/functions';
import mailchimp from '@mailchimp/mailchimp_marketing';
import md5 from 'md5';

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
      // Parse the form data instead of expecting JSON
      const formData = new URLSearchParams(event.body);
      console.log('Form data received:', Object.fromEntries(formData));

      // Extract information from the form data
      const email = formData.get('email');
      const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;
      const campaignId = formData.get('CAMPAIGNID');

      if (!email) {
        throw new Error('Email not provided in the form data');
      }

      console.log(`Processing submission for email: ${email}`);

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
      expiryDate.setDate(expiryDate.getDate() + 7); // 7 days validity

      // Update subscriber with voucher details
      await mailchimp.lists.updateListMember(audienceId, md5(email.toLowerCase()), {
        merge_fields: {
          VOUCHER: voucherCode,
          VEXPIRY: expiryDate.toISOString().split('T')[0],
          CAMPAIGNID: campaignId || '9074479' // Use provided campaign ID or default
        },
      });

      console.log(`Updated subscriber ${email} with voucher code ${voucherCode}`);

      return {
        statusCode: 200,
        body: JSON.stringify({ 
          success: true,
          voucherCode,
          expiryDate: expiryDate.toISOString().split('T')[0]
        }),
      };
    } catch (error) {
      console.error('Webhook processing error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: String(error) }),
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


