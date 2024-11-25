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
  // This now returns a URL instead of a data URL
  const baseUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:8888'
    : 'https://your-netlify-site.netlify.app';
    
  return `${baseUrl}/.netlify/functions/serve-qr-code/${encodeURIComponent(code)}`;
};
