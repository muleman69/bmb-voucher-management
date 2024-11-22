import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';

interface SettingsState {
  mailchimpApiKey: string;
  mailchimpAudienceId: string;
  mailchimpWebhookSecret: string;
  setMailchimpConfig: (apiKey: string, audienceId: string, webhookSecret: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      mailchimpApiKey: '',
      mailchimpAudienceId: '',
      mailchimpWebhookSecret: '',
      setMailchimpConfig: async (apiKey, audienceId, webhookSecret) => {
        try {
          // Save to store first
          set({
            mailchimpApiKey: apiKey,
            mailchimpAudienceId: audienceId,
            mailchimpWebhookSecret: webhookSecret
          });

          // Configure Mailchimp through our Netlify function
          const response = await fetch('/.netlify/functions/mailchimp-settings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              apiKey,
              audienceId,
              webhookSecret
            })
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to configure Mailchimp');
          }

          toast.success('Mailchimp settings saved successfully');
        } catch (error) {
          console.error('Error saving settings:', error);
          toast.error(error instanceof Error ? error.message : 'Failed to save settings');
          throw error;
        }
      }
    }),
    {
      name: 'settings-storage'
    }
  )
);
