import React from 'react';
import { useParams } from 'react-router-dom';
import { useVoucherStore } from '../stores/voucherStore';

const VoucherPage = () => {
  const { code } = useParams<{ code: string }>();
  const voucher = useVoucherStore((state) => 
    state.vouchers.find(v => v.code === code)
  );

  if (!voucher) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Voucher Not Found</h1>
          <p className="text-gray-600">The requested voucher code is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Agavia Bar Voucher</h1>
        <div className="mb-4">
          <img 
            src={voucher.qrCode} 
            alt={`QR Code for voucher ${voucher.code}`} 
            className="mx-auto w-64 h-64"
          />
        </div>
        <p className="text-lg font-mono font-bold text-gray-800 mb-2">{voucher.code}</p>
        <p className="text-gray-600">
          Valid until: {new Date(voucher.expiryDate).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default VoucherPage;
