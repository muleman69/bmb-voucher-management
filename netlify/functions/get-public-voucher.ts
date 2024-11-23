import { Handler } from '@netlify/functions';
import mailchimp from '@mailchimp/mailchimp_marketing';

const handler: Handler = async (event) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }

  try {
    const {
      MAILCHIMP_API_KEY,
      MAILCHIMP_AUDIENCE_ID
    } = process.env;

    if (!MAILCHIMP_API_KEY || !MAILCHIMP_AUDIENCE_ID) {
      throw new Error('Missing required environment variables');
    }

    const code = event.queryStringParameters?.code;
    
    if (!code) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Voucher code is required' })
      };
    }

    // Initialize Mailchimp client
    mailchimp.setConfig({
      apiKey: MAILCHIMP_API_KEY,
      server: MAILCHIMP_API_KEY.split('-')[1]
    });

    // Search for members with this voucher code
    const searchResponse = await mailchimp.searchMembers.search(code);
    
    if (!searchResponse.exact_matches.members?.length) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Voucher not found' })
      };
    }

    // Get the first member with this voucher code
    const member = searchResponse.exact_matches.members[0];
    const voucherData = {
      code: member.merge_fields.VOUCHER,
      expiryDate: member.merge_fields.VEXPIRY,
      isUsed: member.merge_fields.VUSED || false
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(voucherData)
    };

  } catch (error) {
    console.error('Error fetching voucher:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

export { handler };
