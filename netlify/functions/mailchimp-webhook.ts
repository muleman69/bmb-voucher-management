import { Handler } from '@netlify/functions';
import crypto from 'crypto';

const handler: Handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed'
    };
  }

  try {
    // Get the webhook secret from environment variable
    const webhookSecret = process.env.MAILCHIMP_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('Webhook secret not configured');
    }

    // Verify the webhook signature
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

    // Parse the webhook payload
    const payload = JSON.parse(event.body || '{}');
    
    // Handle the webhook event
    // This will be connected to your front-end logic later
    console.log('Webhook received:', payload);

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

export { handler };