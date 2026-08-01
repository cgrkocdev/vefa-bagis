import type { SmsDeliveryStatus, SmsProvider, SmsSendInput, SmsSendResult } from "@/lib/sms/types";

type TwilioMessageResponse = {
  sid?: string;
  status?: string;
  error_message?: string | null;
  message?: string;
};

export class TwilioSmsProvider implements SmsProvider {
  readonly name = "twilio";

  constructor(
    private readonly accountSid: string,
    private readonly authToken: string,
    private readonly fromNumber: string,
  ) {}

  private get authorization() {
    return `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64")}`;
  }

  async sendSms(input: SmsSendInput): Promise<SmsSendResult> {
    try {
      const body = new URLSearchParams({ To: input.phone, From: this.fromNumber, Body: input.message });
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        { method: "POST", headers: { Authorization: this.authorization, "Content-Type": "application/x-www-form-urlencoded" }, body },
      );
      const data = (await response.json()) as TwilioMessageResponse;
      if (!response.ok || !data.sid) return { success: false, errorMessage: data.error_message ?? data.message ?? `Twilio SMS gönderimini reddetti (${response.status}).` };
      return { success: true, providerId: data.sid };
    } catch {
      return { success: false, errorMessage: "Twilio SMS servisine ulaşılamadı." };
    }
  }

  async getBalance(): Promise<number | null> { return null; }

  async getDeliveryStatus(providerId: string): Promise<SmsDeliveryStatus> {
    try {
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages/${providerId}.json`, { headers: { Authorization: this.authorization } });
      if (!response.ok) return "FAILED";
      const data = (await response.json()) as TwilioMessageResponse;
      if (data.status === "delivered") return "DELIVERED";
      if (data.status === "sent") return "SENT";
      if (data.status === "failed" || data.status === "undelivered") return "FAILED";
      return "QUEUED";
    } catch { return "FAILED"; }
  }
}
