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
          // Validate the inputs
          if (!apiKey || !audienceId || !webhookSecret) {
            throw new Error('All fields are required');
          }

          set({
            mailchimpApiKey: apiKey,
            mailchimpAudienceId: audienceId,
            mailchimpWebhookSecret: webhookSecret
          });

          toast.success('Mailchimp settings saved successfully');
        } catch (error) {
          console.error('Error saving settings:', error);
          toast.error('Failed to save settings');
          throw error;
        }
      }
    }),
    {
      name: 'settings-storage',
      getStorage: () => localStorage
    }
  )
);
