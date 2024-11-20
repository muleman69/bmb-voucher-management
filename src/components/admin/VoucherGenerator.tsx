import React, { useState } from 'react';
import { QrCode, Send } from 'lucide-react';
import { useVoucherStore } from '../../stores/voucherStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { MailchimpService } from '../../services/mailchimpIntegration';
import toast from 'react-hot-toast';

const VoucherGenerator: React.FC = () => {
  const [campaignName, setCampaignName] = useState('');
  const [quantity, setQuantity] = useState<string>('100');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [mailchimpCampaignId, setMailchimpCampaignId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const generateVouchers = useVoucherStore((state) => state.generateVouchers);
  const { mailchimpApiKey, mailchimpAudienceId, mailchimpWebhookSecret } = useSettingsStore();
  const voucherStore = useVoucherStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    
    try {
      const numQuantity = parseInt(quantity) || 0;
      if (numQuantity > 0 && numQuantity <= 500) {
        await generateVouchers(
          numQuantity, 
          new Date(expiryDate), 
          campaignName,
          mailchimpCampaignId || undefined
        );

        // Initialize Mailchimp service if API key is available
        if (mailchimpApiKey && mailchimpAudienceId && mailchimpWebhookSecret) {
          const mailchimpService = new MailchimpService(
            { 
              apiKey: mailchimpApiKey, 
              audienceId: mailchimpAudienceId,
              webhookSecret: mailchimpWebhookSecret
            },
            voucherStore
          );

          // Verify the campaign exists if ID was provided
          if (mailchimpCampaignId) {
            try {
              const campaign = await mailchimpService.verifyCampaign(mailchimpCampaignId);
              toast.success(`Vouchers generated and linked to campaign: ${campaign.settings.title}`);
            } catch (error) {
              toast.error('Invalid Mailchimp Campaign ID. Vouchers generated but not linked.');
            }
          } else {
            toast.success(`Successfully generated ${numQuantity} vouchers for ${campaignName}`);
          }
        } else {
          toast.success(`Generated ${numQuantity} vouchers for ${campaignName} (Mailchimp not configured)`);
        }

        // Reset form
        setCampaignName('');
        setQuantity('100');
        setExpiryDate('');
        setMailchimpCampaignId('');
      }
    } catch (error) {
      console.error('Error generating vouchers:', error);
      toast.error('Failed to generate vouchers. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 500)) {
      setQuantity(value);
    }
  };

  // Calculate minimum date for expiry (today)
  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-3 mb-6">
          <QrCode className="h-6 w-6 text-teal-600" />
          <h2 className="text-2xl font-bold text-gray-800">Generate Vouchers</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Campaign Name
            </label>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g., Summer 2024 Promotion"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Vouchers
            </label>
            <input
              type="number"
              min="1"
              max="500"
              value={quantity}
              onChange={handleQuantityChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <p className="mt-1 text-sm text-gray-500">Maximum: 500 vouchers per batch</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expiry Date
            </label>
            <input
              type="date"
              value={expiryDate}
              min={minDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          {mailchimpApiKey && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mailchimp Campaign ID (Optional)
              </label>
              <input
                type="text"
                value={mailchimpCampaignId}
                onChange={(e) => setMailchimpCampaignId(e.target.value)}
                placeholder="e.g., abc123def"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Link these vouchers to a specific Mailchimp campaign. Find this ID in the URL when editing your campaign (e.g., /campaigns/show/abc123def)
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isGenerating || !quantity || parseInt(quantity) < 1 || parseInt(quantity) > 500 || !expiryDate || !campaignName}
            className="w-full bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
            <span>{isGenerating ? 'Generating...' : 'Generate Vouchers'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default VoucherGenerator;