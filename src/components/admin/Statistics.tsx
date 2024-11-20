import React from 'react';
import { useVoucherStore } from '../../stores/voucherStore';
import { BarChart3, Ticket, CheckCircle, XCircle } from 'lucide-react';

const Statistics = () => {
  const vouchers = useVoucherStore((state) => state.vouchers);

  const stats = {
    total: vouchers.length,
    used: vouchers.filter((v) => v.isUsed).length,
    unused: vouchers.filter((v) => !v.isUsed).length,
    expired: vouchers.filter((v) => v.expiryDate < new Date()).length,
  };

  const recentRedemptions = vouchers
    .filter((v) => v.isUsed && v.usedAt)
    .sort((a, b) => b.usedAt!.getTime() - a.usedAt!.getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <BarChart3 className="h-6 w-6 text-teal-600" />
        Voucher Statistics
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Vouchers</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <Ticket className="h-8 w-8 text-teal-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Used Vouchers</p>
              <p className="text-2xl font-bold text-gray-800">{stats.used}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Available Vouchers</p>
              <p className="text-2xl font-bold text-gray-800">{stats.unused}</p>
            </div>
            <Ticket className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Expired Vouchers</p>
              <p className="text-2xl font-bold text-gray-800">{stats.expired}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Recent Redemptions
        </h3>
        <div className="space-y-4">
          {recentRedemptions.map((voucher) => (
            <div
              key={voucher.id}
              className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0"
            >
              <div>
                <p className="font-medium text-gray-800">{voucher.code}</p>
                <p className="text-sm text-gray-500">
                  {voucher.usedAt?.toLocaleString()}
                </p>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                Redeemed
              </span>
            </div>
          ))}
          {recentRedemptions.length === 0 && (
            <p className="text-gray-500 text-center py-4">
              No recent redemptions
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Statistics;