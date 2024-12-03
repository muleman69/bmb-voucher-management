// netlify/functions/serve-qr-code.ts
import { Handler } from '@netlify/functions';
import QRCode from 'qrcode';

export const handler: Handler = async (event) => {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, max-age=31536000',
    'Content-Type': 'image/png'
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
    // Extract voucher code from the URL path
    const voucherCode = event.path.split('/').pop();
    
    if (!voucherCode) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Voucher code is required' })
      };
    }

    console.log('Generating QR code for voucher:', voucherCode); // Debug log

    // Generate QR code as PNG buffer
    const qrCodeBuffer = await QRCode.toBuffer(voucherCode, {
      type: 'png',
      width: 300,
      margin: 1,
      color: {
        dark: '#115E59',
        light: '#FFFFFF'
      }
    });

    // Return the QR code image
    return {
      statusCode: 200,
      headers,
      body: qrCodeBuffer.toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    console.error('Error generating QR code:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to generate QR code' })
    };
  }
};
