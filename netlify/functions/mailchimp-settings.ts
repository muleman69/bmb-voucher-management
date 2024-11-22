import { Handler } from '@netlify/functions';
import mailchimp from '@mailchimp/mailchimp_marketing';

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { apiKey, audienceId, webhookSecret } = JSON.parse(event.body || '{}');

    if (!apiKey || !audienceId || !webhookSecret) {
      throw new Error('Missing required fields');
    }

    // Configure Mailchimp client
    mailchimp.setConfig({
      apiKey,
      server: apiKey.split('-')[1]
    });

    // Test connection and set up merge fields
    const mergeFields = [
      {
        tag: 'VOUCHER',
        name: 'Voucher Code',
        type: 'text',
        required: false
      },
      {
        tag: 'VEXPIRY',
        name: 'Voucher Expiry',
        type: 'date',
        required: false
      },
      {
        tag: 'VQRCODE',
        name: 'Voucher QR Code',
        type: 'imageurl',
        required: false
      }
    ];

    // Create merge fields
    for (const field of mergeFields) {
      try {
        await mailchimp.lists.addListMergeField(audienceId, field);
      } catch (error: any) {
        // Ignore 400 errors as they likely mean the field already exists
        if (error.status !== 400) {
          throw error;
        }
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };

  } catch (error) {
    console.error('Settings error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: String(error) })
    };
  }
};

export { handler };
