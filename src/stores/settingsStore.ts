import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface SettingsState {
  mailchimpApiKey: string;
  mailchimpAudienceId: string;
  mailchimpWebhookSecret: string;
  setMailchimpConfig: (apiKey: string, audienceId: string, webhookSecret: string) => void;
}

const migrate = (persistedState: any, version: number) => {
  if (version === 0) {
    return {
      ...persistedState,
      mailchimpWebhookSecret: '',
      version: 1,
    };
  }
  return persistedState;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      mailchimpApiKey: '',
      mailchimpAudienceId: '',
      mailchimpWebhookSecret: '',
      setMailchimpConfig: (apiKey, audienceId, webhookSecret) =>
        set({ mailchimpApiKey: apiKey, mailchimpAudienceId: audienceId, mailchimpWebhookSecret: webhookSecret }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate,
    }
  )
);