'use client';

import { useActionState } from 'react';
import type { ActionState } from './actions';

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

type ActionFormProps = {
  action: Action;
  id: string;
  intent: string;
  label: string;
  tone?: 'primary' | 'danger' | 'plain';
  // Asks for a reason, which the seller sees.
  reason?: 'required' | 'optional';
  reasonLabel?: string;
};

const tones = {
  primary: 'bg-brand text-white hover:bg-brand-dark',
  danger: 'bg-red-700 text-white hover:bg-red-800',
  plain: 'border border-line bg-white text-ink hover:bg-surface',
};

// One admin action as a small form, showing the outcome underneath.
export function ActionForm({ action, id, intent, label, tone = 'plain', reason, reasonLabel }: ActionFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="grid gap-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="intent" value={intent} />
      {reason ? (
        <label className="grid gap-1 text-sm font-bold text-ink">
          {reasonLabel ?? 'Reason (sent to the seller)'}
          <textarea
            name="reason"
            required={reason === 'required'}
            maxLength={500}
            rows={2}
            className="rounded-lg border border-line px-3 py-2 font-normal"
          />
        </label>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className={`rounded-full px-4 py-2 text-sm font-extrabold transition-colors disabled:opacity-50 ${tones[tone]}`}
      >
        {pending ? 'Working…' : label}
      </button>
      {state?.error ? <p className="text-sm font-bold text-red-700" role="alert">{state.error}</p> : null}
      {state?.done ? <p className="text-sm font-bold text-green-800" role="status">{state.done}</p> : null}
    </form>
  );
}
