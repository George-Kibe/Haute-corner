import { SendEmailCommand, SESv2Client } from '@aws-sdk/client-sesv2';
import { after } from 'next/server';
import { site } from '@/lib/site';

export type Email = { to: string; subject: string; html: string; text: string };

// EMAIL_TRANSPORT chooses how mail leaves:
// - ses: Amazon SES, in every deployed environment
// - log: printed to the server log, for local testing without sending
// - memory: kept in sentEmails, for automated tests
type TransportName = 'ses' | 'log' | 'memory';
const TRANSPORTS: TransportName[] = ['ses', 'log', 'memory'];

export const sentEmails: Email[] = [];

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

function transportName(): TransportName {
  const configured = (process.env.EMAIL_TRANSPORT ?? 'ses') as TransportName;
  if (!TRANSPORTS.includes(configured)) throw new Error(`EMAIL_TRANSPORT must be one of ${TRANSPORTS.join(', ')}`);
  return configured;
}

// Automated mail comes from the no-reply address, and replies go to the
// public contact. Both are on the domain verified in SES, which signs with DKIM.
export function sender() {
  const name = (process.env.EMAIL_FROM ?? site.name).replace(/"/g, '');
  return `"${name}" <${site.noReplyEmail}>`;
}

let ses: SESv2Client | undefined;

function sesClient() {
  ses ??= new SESv2Client({
    region: requiredEnv('SES_REGION'),
    credentials: {
      accessKeyId: requiredEnv('AWS_SES_ACCESS_KEY_ID'),
      secretAccessKey: requiredEnv('AWS_SES_SECRET_ACCESS_KEY'),
    },
  });
  return ses;
}

export async function sendEmail(email: Email) {
  const name = transportName();
  if (name === 'memory') {
    sentEmails.push(email);
    return;
  }
  if (name === 'log') {
    console.log(`[email] to ${email.to}: ${email.subject}\n${email.text}`);
    return;
  }
  await sesClient().send(
    new SendEmailCommand({
      FromEmailAddress: sender(),
      ReplyToAddresses: [site.email],
      Destination: { ToAddresses: [email.to] },
      Content: {
        Simple: {
          Subject: { Data: email.subject, Charset: 'UTF-8' },
          Body: {
            Html: { Data: email.html, Charset: 'UTF-8' },
            Text: { Data: email.text, Charset: 'UTF-8' },
          },
        },
      },
    }),
  );
}

// Sends after the response has gone, for mail the person is not waiting for.
// Outside a request, as in tests, it sends straight away.
export function sendAfterResponse(email: Email) {
  const task = () => sendEmail(email).catch((error) => console.error('Email failed', error));
  try {
    after(task);
  } catch {
    void task();
  }
}
