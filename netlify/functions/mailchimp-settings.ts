import mailchimp from '@mailchimp/mailchimp_marketing';

class MailchimpService {
  apiKey: string;
  audienceId: string;
  webhookSecret: string;

  constructor(apiKey: string, audienceId: string, webhookSecret: string) {
    if (!apiKey || !audienceId || !webhookSecret) {
      throw new Error('Missing required fields for Mailchimp configuration');
    }
    
    this.apiKey = apiKey;
    this.audienceId = audienceId;
    this.webhookSecret = webhookSecret;

    // Initialize Mailchimp client
    mailchimp.setConfig({
      apiKey: this.apiKey,
      server: this.apiKey.split('-')[1] // Extract server from apiKey
    });
  }

  async testApiConnection() {
    try {
      await mailchimp.ping.get();
    } catch (error) {
      throw new Error('Invalid Mailchimp API key');
    }
  }

  async configureMergeFields() {
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
        await mailchimp.lists.addListMergeField(this.audienceId, field);
      } catch (error: any) {
        // Ignore 400 errors as they likely mean the field already exists
        if (error.status !== 400) {
          throw new Error(`Failed to create merge field: ${field.tag}`);
        }
      }
    }
  }
}

export { MailchimpService };

// Netlify function handler for webhook integration
import { Handler } from '@netlify/functions';

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
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Instantiate MailchimpService
    const mailchimpService = new MailchimpService(apiKey, audienceId, webhookSecret);

    // Test API connection
    await mailchimpService.testApiConnection();

    // Configure merge fields
    await mailchimpService.configureMergeFields();

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

export { handler };
