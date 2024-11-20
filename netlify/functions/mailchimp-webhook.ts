import { Handler } from '@netlify/functions';
import crypto from 'crypto';

const handler: Handler = async (event) => {
  console.log('Webhook Invoked', event.httpMethod);

  // Handle GET requests for URL verification
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Webhook URL verified" })
    };
  }

  // Handle POST requests
  if (event.httpMethod === 'POST') {
    try {
      const webhookSecret = process.env.MAILCHIMP_WEBHOOK_SECRET;
      
      if (!webhookSecret) {
        throw new Error('Webhook secret not configured');
      }

      const signature = event.headers['x-mailchimp-webhook-signature'];
      if (!signature) {
        throw new Error('No signature provided');
      }

      const hash = crypto
        .createHmac('sha256', webhookSecret)
        .update(event.body || '')
        .digest('hex');

      if (hash !== signature) {
        return {
          statusCode: 401,
          body: 'Invalid signature'
        };
      }

      const payload = JSON.parse(event.body || '{}');
      
      return {
        statusCode: 200,
        body: JSON.stringify({ received: true })
      };
    } catch (error) {
      console.error('Webhook error:', error);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Webhook processing failed' })
      };
    }
  }

  // Handle other methods
  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};

export { handler };
