import mailchimp from '@mailchimp/mailchimp_marketing';
import md5 from 'md5';
import type { VoucherStore } from '../stores/voucherStore';
import toast from 'react-hot-toast';

interface MailchimpConfig {
  apiKey: string;
  audienceId: string;
  webhookSecret: string;
}

export class MailchimpService {
  private client: typeof mailchimp;
  private config: MailchimpConfig;
  private store: VoucherStore;

  constructor(config: MailchimpConfig, store: VoucherStore) {
    this.client = mailchimp;
    this.config = config;
    this.store = store;

    const server = config.apiKey.split('-')[1];
    if (!server) {
      throw new Error('Invalid Mailchimp API key format');
    }

    this.client.setConfig({
      apiKey: config.apiKey,
      server
    });
  }

  async setupMergeFields(): Promise<void> {
    try {
      const mergeFields = [
        {
          tag: 'VOUCHER',
          name: 'Voucher Code',
          type: 'text',
          required: false,
          public: true
        },
        {
          tag: 'VEXPIRY',
          name: 'Voucher Expiry',
          type: 'date',
          required: false,
          public: true
        },
        {
          tag: 'VQRCODE',
          name: 'Voucher QR Code',
          type: 'imageurl',
          required: false,
          public: true
        }
      ];

      for (const field of mergeFields) {
        try {
          await this.client.lists.addListMergeField(this.config.audienceId, field);
          console.log(`Created merge field: ${field.tag}`);
        } catch (error: any) {
          // If field already exists, continue
          if (error.status !== 400) {
            throw error;
          }
        }
      }

      toast.success('Mailchimp merge fields configured successfully');
    } catch (error) {
      console.error('Error setting up merge fields:', error);
      toast.error('Failed to configure merge fields');
      throw error;
    }
  }

  async createWebhook(): Promise<void> {
    try {
      // First ensure merge fields exist
      await this.setupMergeFields();

      // Get the current domain
      const domain = window.location.hostname;
      const isLocalhost = domain === 'localhost' || domain.includes('stackblitz.io');

      if (isLocalhost) {
        toast.error('Webhooks cannot be configured on localhost. Please deploy the application first.');
        return;
      }

      // Create webhook with proper URL
      const webhookUrl = `${window.location.origin}/.netlify/functions/mailchimp-webhook`;
      
      // List existing webhooks
      const { webhooks } = await this.client.lists.getListWebhooks(this.config.audienceId);
      
      // Remove existing webhooks
      for (const webhook of webhooks) {
        await this.client.lists.deleteListWebhook(
          this.config.audienceId,
          webhook.id
        );
      }

      // Create new webhook
      await this.client.lists.createListWebhook(this.config.audienceId, {
        url: webhookUrl,
        events: {
          subscribe: true,
          unsubscribe: false,
          profile: false,
          cleaned: false,
          upemail: false,
          campaign: false
        },
        sources: {
          user: true,
          admin: true,
          api: true
        }
      });

      toast.success('Webhook configured successfully');
    } catch (error) {
      console.error('Error setting up webhook:', error);
      toast.error('Failed to configure webhook');
      throw error;
    }
  }

  async verifyCampaign(campaignId: string) {
    try {
      return await this.client.campaigns.get(campaignId);
    } catch (error) {
      throw new Error('Invalid campaign ID');
    }
  }
}
