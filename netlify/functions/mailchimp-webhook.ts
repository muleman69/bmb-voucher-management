import { Handler } from '@netlify/functions';
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
  console.log('Webhook Invoked', event.httpMethod);

  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Webhook URL verified" }),
    };
  }

  if (event.httpMethod === 'POST') {
    try {
      let payload: MailchimpWebhookData;
      
      // Attempt to parse the payload safely
      try {
        // Sometimes the incoming data may not be JSON, catch any error
        payload = JSON.parse(event.body || '{}') as MailchimpWebhookData;
      } catch (parseError) {
        console.error('Parsing error:', parseError);
        return {
          statusCode: 400,
          body: 'Invalid JSON payload received',
        };
      }

      console.log('Webhook payload received:', JSON.stringify(payload, null, 2));

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

      // Handle new subscriber event
      if (payload.type === 'subscribe') {
        const { email } = payload.data;

        // Generate a new voucher code (implement your logic here)
        const voucherCode = generateVoucherCode();
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30); // 30 days validity

        // Update subscriber with voucher details
        await mailchimp.lists.updateListMember(audienceId, email, {
          merge_fields: {
            VOUCHER: voucherCode,
            VEXPIRY: expiryDate.toISOString().split('T')[0],
          },
        });

        console.log(`Updated subscriber ${email} with voucher code ${voucherCode}`);
      }

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
