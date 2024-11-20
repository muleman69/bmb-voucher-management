import { Handler } from '@netlify/functions';
import crypto from 'crypto';

const handler: Handler = async (event) => {
  console.log('Webhook Invoked'); // Log each time the webhook is called

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    console.log('Method Not Allowed:', event.httpMethod); // Log method used
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
    console.log('Webhook Secret Read Successfully');

    // Verify the webhook signature
    const signature = event.headers['x-mailchimp-webhook-signature'];
    if (!signature) {
      console.log('No signature provided');
      throw new Error('No signature provided');
    }
    console.log('Signature Received:', signature);

    const hash = crypto
      .createHmac('sha256', webhookSecret)
      .update(event.body || '')
      .digest('hex');

    console.log('Calculated Hash:', hash);

    if (hash !== signature) {
      console.log('Invalid signature:', signature, 'Expected:', hash);
      return {
        statusCode: 401,
        body: 'Invalid signature'
      };
    }
    console.log('Signature Verified Successfully');

    // Parse the webhook payload
    const payload = JSON.parse(event.body || '{}');
    console.log('Webhook Payload:', payload);
    
    // Handle the webhook event
    // This will be connected to your front-end logic later
    console.log('Webhook received:', payload);

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true })
    };
  } catch (error) {
    console.error('Webhook error:', error.message);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Webhook processing failed' })
    };
  }
}

export { handler };
