'use client';

import { CheckField, TextField } from '@/components/ui/Field';
import styles from './Forms.module.css';

export interface ContactValues {
  name: string;
  phone: string;
  email: string;
  consent: boolean;
}

export const EMPTY_CONTACT: ContactValues = { name: '', phone: '', email: '', consent: false };

/** Name plus a phone or an email. Used by holds, orders and "tell me when it's back". */
export function ContactFields({
  idPrefix,
  values,
  errors,
  onChange,
}: {
  idPrefix: string;
  values: ContactValues;
  errors: Record<string, string>;
  onChange: (next: ContactValues) => void;
}) {
  return (
    <>
      <TextField
        id={`${idPrefix}-name`}
        label="Your name"
        autoComplete="name"
        value={values.name}
        error={errors.name}
        onChange={(e) => onChange({ ...values, name: e.target.value })}
        required
      />
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>How can we reach you? Phone or email, one is enough.</legend>
        <TextField
          id={`${idPrefix}-phone`}
          label="Phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={values.phone}
          error={errors.phone}
          onChange={(e) => onChange({ ...values, phone: e.target.value })}
        />
        <TextField
          id={`${idPrefix}-email`}
          label="Email"
          type="email"
          autoComplete="email"
          value={values.email}
          error={errors.email}
          onChange={(e) => onChange({ ...values, email: e.target.value })}
        />
      </fieldset>
      <CheckField
        id={`${idPrefix}-consent`}
        checked={values.consent}
        onChange={(e) => onChange({ ...values, consent: e.target.checked })}
        label="Also send me news about new stock and events (optional). You can unsubscribe any time. Your confirmation is not affected."
      />
    </>
  );
}

/** Move focus to the first field that has an error, so keyboard and screen-reader users land on it. */
export function focusFirstError(idPrefix: string, errors: Record<string, string>) {
  const order = ['name', 'phone', 'email', 'product', 'note'];
  const first = order.find((k) => errors[k]) ?? Object.keys(errors)[0];
  if (first) document.getElementById(`${idPrefix}-${first}`)?.focus();
}
