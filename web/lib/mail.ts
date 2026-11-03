import { SendEmailCommand, SESv2Client } from '@aws-sdk/client-sesv2';
import { after } from 'next/server';
import nodemailer, { type Transporter } from 'nodemailer';

export type Email = { to: string; subject: string; html: string; text: string };

// EMAIL_TRANSPORT chooses how mail leaves:
// - gmail: Gmail SMTP, for development, and production until SES is ready
// - ses: Amazon SES, for production once its domain is verified
// - log: printed to the server log, for local testing without sending
// - memory: kept in sentEmails, for automated tests
type TransportName = 'gmail' | 'ses' | 'log' | 'memory';
const TRANSPORTS: TransportName[] = ['gmail', 'ses', 'log', 'memory'];

export const sentEmails: Email[] = [];

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

function transportName(): TransportName {
  const configured = process.env.EMAIL_TRANSPORT as TransportName | undefined;
  if (configured) {
    if (!TRANSPORTS.includes(configured)) throw new Error(`EMAIL_TRANSPORT must be one of ${TRANSPORTS.join(', ')}`);
    return configured;
  }
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) return 'gmail';
  throw new Error('EMAIL_TRANSPORT is not set');
}

// EMAIL_FROM is the sender's display name, such as "HauteCorner Lifestyle".
// Gmail always sends from the signed-in account, and SES from a verified address.
function sender(address: string) {
  const name = (process.env.EMAIL_FROM ?? 'HauteCorner').replace(/"/g, '');
  return `"${name}" <${address}>`;
}

let cached: { name: TransportName; transporter: Transporter; from: string } | undefined;

function transport() {
  const name = transportName();
  if (cached?.name === name) return cached;

  if (name === 'gmail') {
    const user = requiredEnv('GMAIL_USER');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      // App passwords are shown with spaces, which Gmail does not need.
      auth: { user, pass: requiredEnv('GMAIL_APP_PASSWORD').replace(/\s+/g, '') },
    });
    cached = { name, transporter, from: sender(user) };
  } else if (name === 'ses') {
    const sesClient = new SESv2Client({
      region: requiredEnv('SES_REGION'),
      credentials: {
        accessKeyId: requiredEnv('SES_ACCESS_KEY_ID'),
        secretAccessKey: requiredEnv('SES_SECRET_ACCESS_KEY'),
      },
    });
    const transporter = nodemailer.createTransport({ SES: { sesClient, SendEmailCommand } });
    cached = { name, transporter, from: sender(requiredEnv('SES_FROM_ADDRESS')) };
  } else {
    cached = { name, transporter: nodemailer.createTransport({ jsonTransport: true }), from: sender('noreply@example.com') };
  }
  return cached;
}

export async function sendEmail(email: Email) {
  const { name, transporter, from } = transport();
  if (name === 'memory') {
    sentEmails.push(email);
    return;
  }
  if (name === 'log') {
    console.log(`[email] to ${email.to}: ${email.subject}\n${email.text}`);
    return;
  }
  await transporter.sendMail({ from, ...email });
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
