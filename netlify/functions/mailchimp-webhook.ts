import { Handler } from '@netlify/functions';

const handler: Handler = async (event) => {
  console.log('Webhook Invoked', event.httpMethod);

  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Webhook URL verified" })
    };
  }

  if (event.httpMethod === 'POST') {
    try {
      const payload = JSON.parse(event.body || '{}');
      console.log('Webhook payload:', payload);
      
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

  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};

export { handler };
