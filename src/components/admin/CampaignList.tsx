import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useVoucherStore } from '../../stores/voucherStore';
import { FolderOpen, Tag, Calendar, Ticket, Trash2 } from 'lucide-react';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import toast from 'react-hot-toast';

const CampaignList = () => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  
  const vouchers = useVoucherStore((state) => state.vouchers);
  const deleteCampaign = useVoucherStore((state) => state.deleteCampaign);
  
  // Get unique campaigns and their stats
  const campaigns = Object.values(vouchers.reduce((acc, voucher) => {
    if (!acc[voucher.campaignName]) {
      acc[voucher.campaignName] = {
        name: voucher.campaignName,
        totalVouchers: 0,
        usedVouchers: 0,
        expiryDate: new Date(voucher.expiryDate),
        createdAt: new Date(voucher.createdAt),
      };
    }
    
    acc[voucher.campaignName].totalVouchers++;
    if (voucher.isUsed) {
      acc[voucher.campaignName].usedVouchers++;
    }
    
    return acc;
  }, {} as Record<string, {
    name: string;
    totalVouchers: number;
    usedVouchers: number;
    expiryDate: Date;
    createdAt: Date;
  }>)).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const handleDeleteClick = (campaignName: string) => {
    setSelectedCampaign(campaignName);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedCampaign) {
      try {
        await deleteCampaign(selectedCampaign);
        toast.success('Campaign deleted successfully');
      } catch (error) {
        console.error('Error deleting campaign:', error);
        toast.error('Failed to delete campaign');
      }
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <FolderOpen className="h-7 w-7 text-teal-600" />
        Campaign List
      </h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((campaign) => (
          <div
            key={campaign.name}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow relative group"
          >
            <button
              onClick={() => handleDeleteClick(campaign.name)}
              className="absolute top-4 right-4 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
              title="Delete Campaign"
            >
              <Trash2 className="h-5 w-5" />
            </button>

            <Link to={`/admin/list/${encodeURIComponent(campaign.name)}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-teal-600" />
                  <h3 className="font-semibold text-gray-800">{campaign.name}</h3>
                </div>
                <span className="bg-teal-100 text-teal-800 text-xs px-2 py-1 rounded-full">
                  {((campaign.usedVouchers / campaign.totalVouchers) * 100).toFixed(0)}% Used
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Ticket className="h-4 w-4" />
                    Vouchers
                  </span>
                  <span className="font-medium text-gray-800">
                    {campaign.usedVouchers} / {campaign.totalVouchers}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Expires
                  </span>
                  <span className="font-medium text-gray-800">
                    {campaign.expiryDate.toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          </div>
        ))}

        {campaigns.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-lg shadow-md">
            <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Campaigns Yet</h3>
            <p className="text-gray-500">
              Start by generating vouchers for your first campaign.
            </p>
          </div>
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        campaignName={selectedCampaign || ''}
      />
    </div>
  );
};

export default CampaignList;