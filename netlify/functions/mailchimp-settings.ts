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
    
    // Check for missing required fields
    if (!apiKey || !audienceId || !webhookSecret) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Initialize Mailchimp client
    mailchimp.setConfig({
      apiKey,
      server: apiKey.split('-')[1]
    });

    // Test API connection
    try {
      await mailchimp.ping.get();
    } catch (error) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid Mailchimp API key' })
      };
    }

    // Set up merge fields
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
      body: JSON.stringify({ 
        success: true,
        message: 'Mailchimp configuration complete'
      })
    };

  } catch (error) {
    console.error('Mailchimp settings error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error'
      })
    };
  }
};

// Export handler for Netlify
export { handler };

