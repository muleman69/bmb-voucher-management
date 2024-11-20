import mailchimp from '@mailchimp/mailchimp_marketing';

interface MailchimpConfig {
  apiKey: string;
  audienceId: string;
}

export const initializeMailchimp = ({ apiKey, audienceId }: MailchimpConfig) => {
  mailchimp.setConfig({
    apiKey,
    server: apiKey.split('-')[1],
  });

  return {
    async sendVoucherEmail(email: string, voucherCode: string, qrCodeUrl: string) {
      try {
        // First, add or update the subscriber
        await mailchimp.lists.addListMember(audienceId, {
          email_address: email,
          status: 'subscribed',
          merge_fields: {
            VOUCHER: voucherCode,
          },
        });

        // Then send the transactional email with the voucher
        // Note: This is a simplified version. You'll need to set up a template in Mailchimp
        return true;
      } catch (error) {
        console.error('Mailchimp error:', error);
        throw new Error('Failed to send voucher email');
      }
    },
  };
};