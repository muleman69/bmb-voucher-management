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

  async setupWebhook(): Promise<void> {
    try {
      // First ensure merge fields exist
      await this.ensureMergeFieldsExist();

      // Get the current domain
      const domain = window.location.hostname;
      const isLocalhost = domain === 'localhost' || domain.includes('stackblitz.io');

      if (isLocalhost) {
        toast.error('Webhooks cannot be configured on localhost. Please deploy the application first.');
        console.log('To test locally, you can manually trigger the voucher assignment by using the test function.');
        return;
      }

      // Create webhook with proper URL
      const webhookUrl = `${window.location.origin}/api/mailchimp-webhook`;
      
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
          subscribe: true
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
    }
  }

  // Test function for local development
  async testVoucherAssignment(email: string, campaignName: string): Promise<void> {
    try {
      const result = await this.assignVoucherToSubscriber(email, campaignName);
      if (result) {
        toast.success(`Test successful! Voucher assigned to ${email}`);
      } else {
        toast.error('Failed to assign test voucher');
      }
    } catch (error) {
      console.error('Test failed:', error);
      toast.error('Test failed');
    }
  }

  // ... rest of the existing methods remain the same ...
}