import { MockSmsProvider } from "@/lib/sms/mock-provider";
import { TwilioSmsProvider } from "@/lib/sms/twilio-provider";
import type { SmsProvider } from "@/lib/sms/types";

export function getSmsProvider(): SmsProvider {
  if (process.env.SMS_PROVIDER === "twilio") {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM_NUMBER;
    if (!accountSid || !authToken || !fromNumber) throw new Error("Twilio SMS bilgileri eksik.");
    return new TwilioSmsProvider(accountSid, authToken, fromNumber);
  }
  return new MockSmsProvider();
}

export function renderDonationSms(input: { donorName: string; amount: string; donationType: string }) {
  return `Sayın ${input.donorName}, ${input.amount} tutarındaki ${input.donationType} bağışınız alınmıştır. Desteğiniz için teşekkür ederiz. Yedirenk Derneği Bağış Yönetimi`;
}
