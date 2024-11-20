import { Handler } from '@netlify/functions';
import crypto from 'crypto';
import mailchimp from '@mailchimp/mailchimp_marketing';

interface MailchimpWebhookData {
  type: string;
  fired_at: string;
  data: {
    email: string;
    list_id: string;
    merges: Record<string, string>;
  };
}

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed'
    };
  }

  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      body: 'Webhook URL verified'
    };
  }

  try {
    const payload = JSON.parse(event.body || '{}') as MailchimpWebhookData;
    console.log('Webhook payload received:', JSON.stringify(payload, null, 2));

    // Initialize Mailchimp client
    const apiKey = process.env.MAILCHIMP_API_KEY;
    const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;
    
    if (!apiKey || !audienceId) {
      throw new Error('Mailchimp configuration missing');
    }

    mailchimp.setConfig({
      apiKey,
      server: apiKey.split('-')[1]
    });

    // Handle new subscriber event
    if (payload.type === 'subscribe') {
      const { email } = payload.data;

      // Retrieve a voucher from the specified campaign
      const campaignId = 'YOUR_DEFAULT_CAMPAIGN_ID_HERE'; // <-- Specify the default campaign
      const voucherDetails = await getVoucherFromCampaign(campaignId);

      if (!voucherDetails) {
        throw new Error('No available vouchers in the campaign');
      }

      // Update subscriber with voucher details
      await mailchimp.lists.updateListMember(audienceId, email, {
        merge_fields: {
          VOUCHER: voucherDetails.voucherCode,
          VEXPIRY: voucherDetails.expiryDate.toISOString().split('T')[0],
          VQRCODE: voucherDetails.qrCodeUrl
        }
      });

      console.log(`Updated subscriber ${email} with voucher code ${voucherDetails.voucherCode}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error('Webhook processing error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Webhook processing failed' })
    };
  }
};

// Helper function to get voucher from a campaign
async function getVoucherFromCampaign(campaignId: string) {
  // Replace this with the actual logic to retrieve an unused voucher from your campaign
  // You might want to query your database or in-memory storage to find an unused voucher.
  const vouchers = await getVouchersFromDatabase(campaignId);
  const availableVoucher = vouchers.find(voucher => !voucher.assigned);

  if (availableVoucher) {
    availableVoucher.assigned = true; // Mark the voucher as assigned
    // Save the updated voucher status to the database (if applicable)
    await saveVoucherToDatabase(availableVoucher);
    return availableVoucher;
  }
  return null;
}

export { handler };


export { handler };
