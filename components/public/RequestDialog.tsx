'use client';

import { useId, useState } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { TextAreaField } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { getRepository } from '@/lib/data';
import { RepositoryError } from '@/lib/data/repository';
import { interestForCategory } from '@/lib/domain/interests';
import type { Product } from '@/lib/domain/types';
import { STORE_TZ } from '@/lib/hours/hours';
import { ContactFields, EMPTY_CONTACT, focusFirstError, type ContactValues } from './ContactFields';
import styles from './Forms.module.css';

export type RequestMode = 'hold' | 'order' | 'notify';

const TITLES: Record<RequestMode, string> = {
  hold: 'Hold it for me',
  order: 'Order it in',
  notify: "Tell me when it's back",
};

const SUBMIT: Record<RequestMode, string> = {
  hold: 'Hold it',
  order: 'Send order request',
  notify: 'Tell me',
};

export function requestDoneLabel(mode: RequestMode, holdHours: number): string {
  if (mode === 'hold') return `Held ${holdHours} h ✓`;
  if (mode === 'order') return 'Requested ✓';
  return "We'll tell you ✓";
}

export function requestIdleLabel(mode: RequestMode): string {
  return mode === 'hold' ? 'Hold it' : mode === 'order' ? 'Order it in' : "Tell me when it's back";
}

export function RequestDialog({
  mode,
  product,
  onClose,
  onDone,
}: {
  mode: RequestMode | null;
  product: Product | null;
  onClose: () => void;
  onDone: (mode: RequestMode, product: Product) => void;
}) {
  return (
    <Dialog open={mode !== null && product !== null} onClose={onClose} title={mode ? TITLES[mode] : ''}>
      {mode && product && <RequestForm mode={mode} product={product} onClose={onClose} onDone={onDone} />}
    </Dialog>
  );
}

function RequestForm({
  mode,
  product,
  onClose,
  onDone,
}: {
  mode: RequestMode;
  product: Product;
  onClose: () => void;
  onDone: (mode: RequestMode, product: Product) => void;
}) {
  const prefix = useId().replace(/:/g, '');
  const toast = useToast();
  const [values, setValues] = useState<ContactValues>(EMPTY_CONTACT);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ message: string; hasEmail: boolean } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    const repo = getRepository();
    const base = {
      name: values.name,
      phone: values.phone,
      email: values.email,
      marketingConsent: values.consent,
      interest: interestForCategory(product.category),
    };
    try {
      let message: string;
      if (mode === 'hold') {
        const hold = await repo.createHold({ ...base, sku: product.sku, productName: product.name });
        const until = formatInTimeZone(new Date(hold.expiresAt), STORE_TZ, "EEEE 'at' h:mm a");
        message = `Done. We'll set ${product.name} aside at the counter until ${until}. Give your name when you pick it up. No payment needed online.`;
      } else if (mode === 'order') {
        await repo.createSpecialOrder({ ...base, sku: product.sku, productName: product.name, note });
        message = `Order request sent for ${product.name}. We'll call or email with the arrival date, usually about a week. No payment needed online.`;
      } else {
        await repo.createBackInStock({ ...base, sku: product.sku, productName: product.name });
        message = `Got it. We'll let you know when ${product.name} is back on the shelf.`;
      }
      setDone({ message, hasEmail: values.email.trim() !== '' });
      toast(message);
      onDone(mode, product);
    } catch (err) {
      if (err instanceof RepositoryError && err.fields) {
        setErrors(err.fields);
        requestAnimationFrame(() => focusFirstError(prefix, err.fields ?? {}));
      } else {
        setErrors({ form: 'Something went wrong. Please call us at 705-719-1291.' });
      }
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className={styles.success}>
        <h3>You&apos;re all set</h3>
        <p>{done.message}</p>
        {done.hasEmail && <p className={styles.demo}>A confirmation email would be sent in the full build. This is a demo.</p>}
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
      <p className={styles.summary}>{product.name}</p>
      <ContactFields idPrefix={prefix} values={values} errors={errors} onChange={setValues} />
      {mode === 'order' && (
        <TextAreaField id={`${prefix}-note`} label="Anything we should know? (optional)" value={note} error={errors.note} onChange={(e) => setNote(e.target.value)} />
      )}
      {errors.form && (
        <p className={styles.error} role="alert">
          {errors.form}
        </p>
      )}
      <div className={styles.actions}>
        <Button type="submit" disabled={busy}>
          {busy ? 'Sending…' : SUBMIT[mode]}
        </Button>
        <Button variant="white" onClick={onClose}>
          Cancel
        </Button>
      </div>
      <p className={styles.demo}>Demo: your details stay in this browser only.</p>
    </form>
  );
}
