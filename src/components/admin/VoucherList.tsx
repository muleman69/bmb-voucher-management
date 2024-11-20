import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useVoucherStore } from '../../stores/voucherStore';
import { Search, Download, QrCode, ArrowLeft } from 'lucide-react';
import QRCodeModal from './QRCodeModal';

const VoucherList = () => {
  const { campaignName } = useParams<{ campaignName: string }>();
  const decodedCampaignName = decodeURIComponent(campaignName || '');
  
  const vouchers = useVoucherStore((state) => 
    state.vouchers.filter(v => v.campaignName === decodedCampaignName)
  );
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'used' | 'unused'>('all');
  const [selectedVoucher, setSelectedVoucher] = useState<string | null>(null);

  const filteredVouchers = vouchers
    .filter((voucher) => {
      if (filter === 'used') return voucher.isUsed;
      if (filter === 'unused') return !voucher.isUsed;
      return true;
    })
    .filter((voucher) =>
      voucher.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const exportVouchers = () => {
    const csv = [
      ['Code', 'Status', 'Created At', 'Expiry Date', 'Used At'],
      ...filteredVouchers.map((v) => [
        v.code,
        v.isUsed ? 'Used' : 'Unused',
        formatDate(v.createdAt),
        formatDate(v.expiryDate),
        v.usedAt ? formatDate(v.usedAt) : '-',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vouchers-${decodedCampaignName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/list"
            className="text-gray-600 hover:text-teal-600 transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h2 className="text-2xl font-bold text-gray-800">{decodedCampaignName}</h2>
        </div>
        <button
          onClick={exportVouchers}
          className="flex items-center space-x-2 bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="flex space-x-4 items-center">
        <div className="flex-1 relative">
          <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search vouchers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as 'all' | 'used' | 'unused')}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="all">All Vouchers</option>
          <option value="used">Used</option>
          <option value="unused">Unused</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expires
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Used At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredVouchers.map((voucher) => (
              <tr key={voucher.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {voucher.code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      voucher.isUsed
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {voucher.isUsed ? 'Used' : 'Available'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(voucher.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(voucher.expiryDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {voucher.usedAt ? formatDate(voucher.usedAt) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button
                    onClick={() => setSelectedVoucher(voucher.code)}
                    className="text-teal-600 hover:text-teal-800 transition-colors"
                  >
                    <QrCode className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedVoucher && (
        <QRCodeModal
          voucherCode={selectedVoucher}
          onClose={() => setSelectedVoucher(null)}
        />
      )}
    </div>
  );
};

export default VoucherList;