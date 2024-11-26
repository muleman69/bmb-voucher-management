import QRCode from 'qrcode';

export const generateUniqueCode = (length: number = 8): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    code += chars[randomIndex];
  }
  
  return code;
};

export const generateQRCode = async (code: string): Promise<string> => {
  try {
    // First try to generate a base64 data URL as fallback
    const qrDataUrl = await QRCode.toDataURL(code, {
      width: 300,
      margin: 2,
      color: {
        dark: '#115E59',
        light: '#FFFFFF'
      }
    });

    // For production, use the Netlify function
    if (process.env.NODE_ENV === 'production') {
      return `https://buildmybrand.xyz/.netlify/functions/serve-qr-code/${encodeURIComponent(code)}`;
    }

    // For development, use the data URL
    return qrDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};
