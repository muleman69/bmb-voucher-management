import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useVoucherStore } from '../../stores/voucherStore';
import { MailchimpService } from '../../services/mailchimpIntegration';
import toast from 'react-hot-toast';

const Settings = () => {
  const { mailchimpApiKey, mailchimpAudienceId, mailchimpWebhookSecret, setMailchimpConfig } = useSettingsStore();
  const [formData, setFormData] = useState({
    mailchimpKey: mailchimpApiKey,
    mailchimpAudienceId: mailchimpAudienceId,
    mailchimpWebhookSecret: mailchimpWebhookSecret,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData({
      mailchimpKey: mailchimpApiKey,
      mailchimpAudienceId: mailchimpAudienceId,
      mailchimpWebhookSecret: mailchimpWebhookSecret,
    });
  }, [mailchimpApiKey, mailchimpAudienceId, mailchimpWebhookSecret]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // First save the config
      await setMailchimpConfig(
        formData.mailchimpKey,
        formData.mailchimpAudienceId,
        formData.mailchimpWebhookSecret
      );

      // Initialize and setup webhook
      const mailchimpService = new MailchimpService(
        {
          apiKey: formData.mailchimpKey,
          audienceId: formData.mailchimpAudienceId,
          webhookSecret: formData.mailchimpWebhookSecret
        },
        useVoucherStore.getState()
      );

      // Create webhook and ensure merge fields
      await mailchimpService.createWebhook();
      
      toast.success('Settings saved and Mailchimp integration configured');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-3 mb-6">
          <SettingsIcon className="h-6 w-6 text-teal-600" />
          <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Mailchimp Setup Instructions</h3>
          <p className="text-blue-700 mb-2">To use merge tags in your Mailchimp template:</p>
          <ol className="list-decimal list-inside text-blue-700 space-y-1">
            <li>Add *|VOUCHER_CODE|* where you want the voucher code to appear</li>
            <li>Add *|VOUCHER_EXPIRY|* to show the expiration date</li>
            <li>Add *|VOUCHER_QR|* to display the QR code image</li>
          </ol>
          <p className="text-blue-700 mt-2">
            The merge fields will be automatically created in your Mailchimp audience when you save the settings.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mailchimp API Key
            </label>
            <input
              type="password"
              name="mailchimpKey"
              value={formData.mailchimpKey}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Enter your Mailchimp API key"
            />
            <p className="mt-1 text-sm text-gray-500">
              Find this in your Mailchimp account under Account → Extras → API keys
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mailchimp Audience ID
            </label>
            <input
              type="text"
              name="mailchimpAudienceId"
              value={formData.mailchimpAudienceId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Enter your Mailchimp Audience ID"
            />
            <p className="mt-1 text-sm text-gray-500">
              Found in Audience → Settings → Audience name and defaults
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mailchimp Webhook Secret
            </label>
            <input
              type="password"
              name="mailchimpWebhookSecret"
              value={formData.mailchimpWebhookSecret}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Enter your Mailchimp Webhook Secret"
            />
            <p className="mt-1 text-sm text-gray-500">
              Used to verify webhook requests from Mailchimp
            </p>
          </div>

          <button
            type="submit"
            disabled={saving || !formData.mailchimpKey || !formData.mailchimpAudienceId || !formData.mailchimpWebhookSecret}
            className="w-full bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;