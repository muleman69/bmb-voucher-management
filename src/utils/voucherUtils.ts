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
    const qrCodeDataUrl = await QRCode.toDataURL(code, {
      width: 256,
      margin: 1,
      errorCorrectionLevel: 'H'
    });
    
    return qrCodeDataUrl;
  } catch (err) {
    console.error('Error generating QR code:', err);
    throw new Error('Failed to generate QR code');
  }
};