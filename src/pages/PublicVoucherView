import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Palmtree } from 'lucide-react';

interface VoucherData {
  code: string;
  expiryDate: string;
  isUsed: boolean;
}

export default function PublicVoucherView() {
  const { code } = useParams();
  const [voucher, setVoucher] = useState<VoucherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVoucher = async () => {
      try {
        const response = await fetch(`/.netlify/functions/get-public-voucher?code=${code}`);
        if (!response.ok) {
          throw new Error('Voucher not found');
        }
        const data = await response.json();
        setVoucher(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load voucher');
      } finally {
        setLoading(false);
      }
    };

    fetchVoucher();
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading voucher...</p>
        </div>
      </div>
    );
  }

  if (error || !voucher) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Voucher not found or has expired</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="text-center">
            <Palmtree className="mx-auto h-12 w-12 text-emerald-600" />
            <h2 className="mt-4 text-3xl font-bold text-gray-900">Agavia Bar Voucher</h2>
          </div>
          
          <div className="mt-6 border-t border-gray-200 pt-6">
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Voucher Code</dt>
                <dd className="mt-1 text-2xl font-bold text-gray-900">{voucher.code}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Valid Until</dt>
                <dd className="mt-1 text-lg text-gray-900">
                  {new Date(voucher.expiryDate).toLocaleDateString()}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  {voucher.isUsed ? (
                    <span className="px-2 py-1 text-sm font-semibold text-red-800 bg-red-100 rounded-full">
                      Used
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-sm font-semibold text-green-800 bg-green-100 rounded-full">
                      Valid
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-6 text-sm text-gray-500 text-center">
            <p>Present this voucher at Agavia Bar to redeem your free drink.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
