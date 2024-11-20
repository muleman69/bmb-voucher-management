import React, { useState, useEffect } from 'react';
import { QrCode, Search } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useVoucherStore } from '../stores/voucherStore';
import toast from 'react-hot-toast';

const VoucherRedemption = () => {
  const [manualCode, setManualCode] = useState('');
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);
  
  const redeemVoucher = useVoucherStore((state) => state.redeemVoucher);

  useEffect(() => {
    // Initialize scanner
    const newScanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: 250,
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true
      },
      false
    );

    setScanner(newScanner);

    // Success callback
    const onScanSuccess = async (decodedText: string) => {
      try {
        const success = await redeemVoucher(decodedText);
        const message = success
          ? 'Voucher successfully redeemed!'
          : 'Invalid or expired voucher.';
        
        if (success) {
          toast.success(message);
        } else {
          toast.error(message);
        }
        
        setResult({ success, message });
        
        // Stop scanning after successful redemption
        if (success) {
          newScanner.clear();
        }
      } catch (error) {
        const errorMessage = 'Error redeeming voucher. Please try again.';
        toast.error(errorMessage);
        setResult({
          success: false,
          message: errorMessage,
        });
      }
    };

    // Error callback
    const onScanError = (error: any) => {
      // Ignore frequent scan errors
      console.debug('QR Scan Error:', error);
    };

    // Render the scanner
    newScanner.render(onScanSuccess, onScanError);

    // Cleanup on unmount
    return () => {
      if (newScanner) {
        newScanner.clear().catch(console.error);
      }
    };
  }, []); // Empty dependency array - run once on mount

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const success = await redeemVoucher(manualCode);
      const message = success
        ? 'Voucher successfully redeemed!'
        : 'Invalid or expired voucher.';
      
      if (success) {
        toast.success(message);
      } else {
        toast.error(message);
      }
      
      setResult({ success, message });
      setManualCode('');
    } catch (error) {
      const errorMessage = 'Error redeeming voucher. Please try again.';
      toast.error(errorMessage);
      setResult({
        success: false,
        message: errorMessage,
      });
    }
  };

  const handleRestartScanner = () => {
    if (scanner) {
      scanner.clear().then(() => {
        scanner.render((decodedText) => {
          redeemVoucher(decodedText);
        }, console.debug);
      }).catch(console.error);
      setResult(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-3 mb-6">
          <QrCode className="h-6 w-6 text-teal-600" />
          <h2 className="text-2xl font-bold text-gray-800">Redeem Voucher</h2>
        </div>

        <div className="space-y-6">
          <div className="aspect-square max-w-md mx-auto bg-gray-100 rounded-lg overflow-hidden">
            <div id="qr-reader" className="w-full h-full"></div>
          </div>

          {result && (
            <button
              onClick={handleRestartScanner}
              className="w-full bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700 transition-colors"
            >
              Scan Another Code
            </button>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or enter code manually</span>
            </div>
          </div>

          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  placeholder="Enter voucher code"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <button
                type="submit"
                className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition-colors"
              >
                Redeem
              </button>
            </div>
          </form>

          {result && (
            <div
              className={`p-4 rounded-md ${
                result.success
                  ? 'bg-green-50 text-green-800'
                  : 'bg-red-50 text-red-800'
              }`}
            >
              {result.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoucherRedemption;