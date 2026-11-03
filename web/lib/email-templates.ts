import { CODE_LIFETIME_SECONDS } from '@/lib/one-time-codes';
import { site } from '@/lib/site';

type Message = { subject: string; html: string; text: string };

const BRAND = '#0e4bb4';
const INK = '#0b1b33';
const MUTED = '#55607a';
const SURFACE = '#f6f9fe';

const escape = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const greeting = (name?: string) => (name ? `Hi ${name.split(' ')[0]},` : 'Hi,');
const minutes = CODE_LIFETIME_SECONDS / 60;

// A plain, single-column layout with inline styles, which most mail apps render.
function layout({ preheader, body, footerNote }: { preheader: string; body: string; footerNote: string }) {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HauteCorner</title></head>
<body style="margin:0;padding:0;background:${SURFACE};">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escape(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SURFACE};padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;font-family:Nunito,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${INK};">
<tr><td style="background:${BRAND};padding:20px 28px;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:0.2px;">HauteCorner</td></tr>
<tr><td style="padding:28px;font-size:16px;line-height:24px;">${body}</td></tr>
<tr><td style="padding:0 28px 28px;font-size:13px;line-height:20px;color:${MUTED};">${footerNote}<br><br>
<a href="${site.url}" style="color:${BRAND};text-decoration:none;">${site.url.replace(/^https?:\/\//, '')}</a> · <a href="mailto:${site.email}" style="color:${BRAND};text-decoration:none;">${site.email}</a></td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function codeBlock(code: string) {
  return `<p style="margin:24px 0;text-align:center;"><span style="display:inline-block;padding:14px 24px;border-radius:12px;background:${SURFACE};font-size:32px;font-weight:800;letter-spacing:8px;color:${INK};">${code}</span></p>`;
}

const notYou = 'If you did not ask for this, you can ignore this email. Nobody can use your account without this code.';

export function signUpCodeEmail(code: string, name?: string): Message {
  return {
    subject: `${code} is your HauteCorner code`,
    text: `${greeting(name)}\n\nEnter this code in the HauteCorner app to finish creating your account:\n\n${code}\n\nIt works for ${minutes} minutes.\n\n${notYou}\n\n${site.url}`,
    html: layout({
      preheader: `Your code is ${code}. It works for ${minutes} minutes.`,
      body: `<p style="margin:0 0 12px;">${escape(greeting(name))}</p><p style="margin:0;">Enter this code in the HauteCorner app to finish creating your account.</p>${codeBlock(code)}<p style="margin:0;color:${MUTED};">It works for ${minutes} minutes.</p>`,
      footerNote: notYou,
    }),
  };
}

export function resetCodeEmail(code: string, name?: string): Message {
  return {
    subject: `${code} is your HauteCorner password reset code`,
    text: `${greeting(name)}\n\nEnter this code in the HauteCorner app to choose a new password:\n\n${code}\n\nIt works for ${minutes} minutes. Your current password keeps working until you change it.\n\n${notYou}\n\n${site.url}`,
    html: layout({
      preheader: `Your password reset code is ${code}.`,
      body: `<p style="margin:0 0 12px;">${escape(greeting(name))}</p><p style="margin:0;">Enter this code in the HauteCorner app to choose a new password.</p>${codeBlock(code)}<p style="margin:0;color:${MUTED};">It works for ${minutes} minutes. Your current password keeps working until you change it.</p>`,
      footerNote: notYou,
    }),
  };
}

export function welcomeEmail(name?: string): Message {
  const intro = 'Your HauteCorner account is ready.';
  const points = [
    'Find shoes and clothing from sellers across Kenya.',
    'Save what you like to your wish list, on any device.',
    'Pay with M-Pesa or card, and track your orders in the app.',
  ];
  return {
    subject: 'Welcome to HauteCorner',
    text: `${greeting(name)}\n\n${intro}\n\n${points.map((point) => `- ${point}`).join('\n')}\n\nQuestions? Reply to this email or write to ${site.email}.\n\n${site.url}`,
    html: layout({
      preheader: intro,
      body: `<p style="margin:0 0 12px;">${escape(greeting(name))}</p><p style="margin:0 0 16px;font-size:20px;font-weight:800;">${intro}</p><ul style="margin:0 0 16px;padding-left:20px;">${points.map((point) => `<li style="margin:0 0 8px;">${point}</li>`).join('')}</ul><p style="margin:0;">Questions? Reply to this email or write to <a href="mailto:${site.email}" style="color:${BRAND};">${site.email}</a>.</p>`,
      footerNote: 'You are receiving this because you created a HauteCorner account.',
    }),
  };
}

export function passwordChangedEmail(name?: string): Message {
  const message = 'Your HauteCorner password was just changed, and you were signed out on your other devices.';
  return {
    subject: 'Your HauteCorner password was changed',
    text: `${greeting(name)}\n\n${message}\n\nIf this was not you, reset your password in the app straight away and write to ${site.email}.\n\n${site.url}`,
    html: layout({
      preheader: message,
      body: `<p style="margin:0 0 12px;">${escape(greeting(name))}</p><p style="margin:0 0 12px;">${message}</p><p style="margin:0;">If this was not you, reset your password in the app straight away and write to <a href="mailto:${site.email}" style="color:${BRAND};">${site.email}</a>.</p>`,
      footerNote: 'We send this whenever a password changes, to keep your account safe.',
    }),
  };
}
