import { afterEach, describe, expect, it } from 'vitest';
import { envValue, sender, transportName } from '@/lib/mail';

const saved = { EMAIL_TRANSPORT: process.env.EMAIL_TRANSPORT, EMAIL_FROM: process.env.EMAIL_FROM };

afterEach(() => {
  process.env.EMAIL_TRANSPORT = saved.EMAIL_TRANSPORT;
  if (saved.EMAIL_FROM === undefined) delete process.env.EMAIL_FROM;
  else process.env.EMAIL_FROM = saved.EMAIL_FROM;
});

describe('email settings', () => {
  // Values as they arrive when pasted into Vercel or piped into its CLI.
  it.each(['ses', '"ses"', "'ses'", 'ses\n', ' ses ', '"ses"\n', 'SES'])('reads EMAIL_TRANSPORT=%j as ses', (value) => {
    process.env.EMAIL_TRANSPORT = value;
    expect(transportName()).toBe('ses');
  });

  it('defaults to SES when EMAIL_TRANSPORT is missing or empty', () => {
    delete process.env.EMAIL_TRANSPORT;
    expect(transportName()).toBe('ses');
    process.env.EMAIL_TRANSPORT = '""';
    expect(transportName()).toBe('ses');
  });

  it('names the value it was given when EMAIL_TRANSPORT is wrong', () => {
    process.env.EMAIL_TRANSPORT = 'smtp';
    expect(() => transportName()).toThrow('EMAIL_TRANSPORT must be one of ses, log, memory, but is "smtp"');
  });

  it('strips quotes from the sender name', () => {
    process.env.EMAIL_FROM = '"HauteCorner Lifestyle"\n';
    expect(sender()).toBe('"HauteCorner Lifestyle" <no-reply@realhiveconsultants.com>');
  });

  it('keeps quotes that are part of a value', () => {
    process.env.EMAIL_FROM = 'The "Corner"';
    expect(envValue('EMAIL_FROM')).toBe('The "Corner"');
  });
});
