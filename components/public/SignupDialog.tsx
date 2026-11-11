'use client';

import { useId, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { CheckField, TextField } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { getRepository } from '@/lib/data';
import { RepositoryError } from '@/lib/data/repository';
import type { StoreEvent } from '@/lib/domain/types';
import { formatEventDate } from '@/lib/events/events';
import { formatFee } from '@/lib/money';
import { focusFirstError } from './ContactFields';
import styles from './Forms.module.css';

export function SignupDialog({
  event,
  onClose,
  onDone,
}: {
  event: StoreEvent | null;
  onClose: () => void;
  onDone?: (event: StoreEvent, outcome: 'seated' | 'waitlist') => void;
}) {
  return (
    <Dialog open={event !== null} onClose={onClose} title={event ? `Save a seat` : ''}>
      {event && <SignupForm event={event} onClose={onClose} onDone={onDone} />}
    </Dialog>
  );
}

function SignupForm({
  event,
  onClose,
  onDone,
}: {
  event: StoreEvent;
  onClose: () => void;
  onDone?: (event: StoreEvent, outcome: 'seated' | 'waitlist') => void;
}) {
  const prefix = useId().replace(/:/g, '');
  const toast = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ outcome: 'seated' | 'waitlist'; message: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const { outcome } = await getRepository().createSignup({ eventId: event.id, name, email, marketingConsent: consent });
      const fee = event.feeCents > 0 ? ` Fee ${formatFee(event.feeCents)}, paid at the counter.` : '';
      const message =
        outcome === 'seated'
          ? `You're in! Your seat for ${event.title} is saved.${fee}`
          : `${event.title} is full, so you're on the waitlist. We'll email if a seat opens.`;
      setResult({ outcome, message });
      toast(message);
      onDone?.(event, outcome);
    } catch (err) {
      if (err instanceof RepositoryError) {
        const fields = err.fields ?? { form: err.message };
        setErrors(fields);
        requestAnimationFrame(() => focusFirstError(prefix, fields));
      } else {
        setErrors({ form: 'Something went wrong. Please call us at 705-719-1291.' });
      }
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div className={styles.success}>
        <h3>{result.outcome === 'seated' ? "You're in" : 'On the waitlist'}</h3>
        <p>{result.message}</p>
        <p className={styles.demo}>A confirmation email would be sent in the full build. This is a demo.</p>
        <div className={styles.actions}>
          <Button variant="blue" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <p className={styles.summary}>
        {event.title}
        <br />
        {formatEventDate(event, 'EEE, MMM d')} · {event.feeCents > 0 ? `${formatFee(event.feeCents)}, pay at the counter` : 'Free'}
      </p>
      <TextField id={`${prefix}-name`} label="Your name" autoComplete="name" value={name} error={errors.name} onChange={(e) => setName(e.target.value)} required />
      <TextField
        id={`${prefix}-email`}
        label="Email"
        type="email"
        autoComplete="email"
        hint="We send your confirmation here."
        value={email}
        error={errors.email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <CheckField
        id={`${prefix}-consent`}
        checked={consent}
        onChange={(e) => setConsent(e.target.checked)}
        label="Also send me news about events and new stock (optional). You can unsubscribe any time. Your confirmation is not affected."
      />
      {errors.form && (
        <p className={styles.error} role="alert">
          {errors.form}
        </p>
      )}
      <div className={styles.actions}>
        <Button type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save my seat'}
        </Button>
        <Button variant="white" onClick={onClose}>
          Cancel
        </Button>
      </div>
      <p className={styles.demo}>Demo: your details stay in this browser only.</p>
    </form>
  );
}
