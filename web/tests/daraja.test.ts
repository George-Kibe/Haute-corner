import { describe, expect, it } from 'vitest';
import { darajaTimestamp, parseStkCallback } from '@/lib/daraja';
import { isRef, newRef } from '@/lib/refs';

describe('darajaTimestamp', () => {
  it('uses Nairobi time as yyyyMMddHHmmss', () => {
    expect(darajaTimestamp(new Date('2026-11-13T21:05:09Z'))).toBe('20261114000509');
  });
});

describe('parseStkCallback', () => {
  it('reads the result and receipt', () => {
    const parsed = parseStkCallback({
      Body: {
        stkCallback: {
          CheckoutRequestID: 'ws_CO_1',
          ResultCode: 0,
          CallbackMetadata: { Item: [{ Name: 'Amount', Value: 10 }, { Name: 'MpesaReceiptNumber', Value: 'QK1' }, { Name: 'Balance' }] },
        },
      },
    });
    expect(parsed).toEqual({ checkoutRequestId: 'ws_CO_1', resultCode: '0', receipt: 'QK1', amount: 10 });
  });

  it('reads a cancelled payment, which has no metadata', () => {
    expect(parseStkCallback({ Body: { stkCallback: { CheckoutRequestID: 'ws_CO_2', ResultCode: 1032 } } })).toMatchObject({
      resultCode: '1032',
      receipt: undefined,
    });
  });

  it('returns null for anything else', () => {
    expect(parseStkCallback({ hello: 'world' })).toBeNull();
    expect(parseStkCallback(null)).toBeNull();
  });
});

describe('newRef', () => {
  it('makes 8 unambiguous characters', () => {
    const refs = Array.from({ length: 200 }, newRef);
    expect(refs.every(isRef)).toBe(true);
    expect(refs.join('')).not.toMatch(/[01IOL]/);
    expect(new Set(refs).size).toBe(200);
  });
});
