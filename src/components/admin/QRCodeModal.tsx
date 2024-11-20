import React from 'react';
import { X } from 'lucide-react';
import { useVoucherStore } from '../../stores/voucherStore';

interface QRCodeModalProps {
  voucherCode: string;
  onClose: () => void;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ voucherCode, onClose }) => {
  const voucher = useVoucherStore((state) => 
    state.vouchers.find((v) => v.code === voucherCode)
  );

  if (!voucher) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Voucher QR Code</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-center">
            <img
              src={voucher.qrCode}
              alt={`QR Code for voucher ${voucher.code}`}
              className="w-64 h-64"
            />
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">Voucher Code</p>
            <p className="text-lg font-mono font-bold">{voucher.code}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;