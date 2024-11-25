import { Handler } from '@netlify/functions';
import QRCode from 'qrcode';

export const handler: Handler = async (event) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  const code = event.path.split('/').pop();

  if (!code) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'No code provided' })
    };
  }

  try {
    const qrSvg = await QRCode.toString(decodeURIComponent(code), {
      type: 'svg',
      width: 300,
      margin: 2,
      color: {
        dark: '#115E59',
        light: '#FFFFFF'
      }
    });

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000',
      },
      body: qrSvg
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to generate QR code' })
    };
  }
};
