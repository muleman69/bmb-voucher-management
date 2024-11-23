import { Handler } from '@netlify/functions';
import { db } from './utils/firebase';  // Make sure this path matches your firebase utility file
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Handler } from '@netlify/functions';
import { db } from './utils/firebase';
import { collection, query, where, getDocs } from '@google-cloud/firestore';

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
    const code = event.queryStringParameters?.code;
    
    if (!code) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Voucher code is required' })
      };
    }

    // Query Firestore for the voucher
    const vouchersRef = collection(db, 'vouchers');
    const q = query(vouchersRef, where('code', '==', code));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Voucher not found' })
      };
    }

    // Get the voucher data
    const voucherDoc = querySnapshot.docs[0];
    const voucherData = voucherDoc.data();

    // Return only the necessary public information
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        code: voucherData.code,
        expiryDate: voucherData.expiryDate,
        isUsed: voucherData.isUsed
      })
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
