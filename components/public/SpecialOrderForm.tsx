'use client';

import { useId, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { TextAreaField, TextField } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { getRepository } from '@/lib/data';
import { RepositoryError } from '@/lib/data/repository';
import { ContactFields, EMPTY_CONTACT, focusFirstError, type ContactValues } from './ContactFields';
import styles from './Forms.module.css';
import page from './SpecialOrderForm.module.css';

export function SpecialOrderForm() {
  const prefix = useId().replace(/:/g, '');
  const toast = useToast();
  const [product, setProduct] = useState('');
  const [note, setNote] = useState('');
  const [values, setValues] = useState<ContactValues>(EMPTY_CONTACT);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      await getRepository().createSpecialOrder({
        productName: product,
        note,
        name: values.name,
        phone: values.phone,
        email: values.email,
        marketingConsent: values.consent,
      });
      const message = `Special order sent for ${product}. We'll call or email with a price and an arrival date. No payment needed online.`;
      setDone(message);
      toast(message);
    } catch (err) {
      if (err instanceof RepositoryError && err.fields) {
        const fields = { ...err.fields };
        if (fields.productName) fields.product = fields.productName;
        setErrors(fields);
        requestAnimationFrame(() => focusFirstError(prefix, fields));
      } else {
        setErrors({ form: 'Something went wrong. Please call us at 705-719-1291.' });
      }
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className={page.card}>
        <div className={styles.success}>
          <h2>Request sent</h2>
          <p>{done}</p>
          {values.email.trim() !== '' && <p className={styles.demo}>A confirmation email would be sent in the full build. This is a demo.</p>}
          <div className={styles.actions}>
            <Button
              variant="white"
              onClick={() => {
                setDone(null);
                setProduct('');
                setNote('');
                setValues(EMPTY_CONTACT);
              }}
            >
              Order something else
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form className={`${styles.form} ${page.card}`} onSubmit={submit} noValidate>
      <TextField
        id={`${prefix}-product`}
        label="What are you looking for?"
        hint="A game, book, paint, miniature or box, as exactly as you can."
        value={product}
        error={errors.product}
        onChange={(e) => setProduct(e.target.value)}
        required
      />
      <TextAreaField id={`${prefix}-note`} label="Anything else we should know? (optional)" hint="Edition, quantity, a date you need it by." value={note} error={errors.note} onChange={(e) => setNote(e.target.value)} />
      <ContactFields idPrefix={prefix} values={values} errors={errors} onChange={setValues} />
      {errors.form && (
        <p className={styles.error} role="alert">
          {errors.form}
        </p>
      )}
      <div className={styles.actions}>
        <Button type="submit" disabled={busy}>
          {busy ? 'Sending…' : 'Send special order'}
        </Button>
      </div>
      <p className={styles.demo}>Demo: your details stay in this browser only.</p>
    </form>
  );
}
