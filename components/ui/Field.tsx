import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import styles from './Field.module.css';

interface FieldShellProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

function FieldShell({ id, label, hint, error, children }: FieldShellProps) {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {hint && (
        <span id={`${id}-hint`} className={styles.hint}>
          {hint}
        </span>
      )}
      {children}
      {error && (
        <span id={`${id}-err`} className={styles.error} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

function describedBy(id: string, hint?: string, error?: string) {
  return (
    [hint ? `${id}-hint` : '', error ? `${id}-err` : ''].filter(Boolean).join(' ') || undefined
  );
}

type InputProps = { id: string; label: string; hint?: string; error?: string } & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'id'
>;
export function TextField({ id, label, hint, error, ...rest }: InputProps) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <input
        id={id}
        className={styles.input}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        {...rest}
      />
    </FieldShell>
  );
}

type TextAreaProps = { id: string; label: string; hint?: string; error?: string } & Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'id'
>;
export function TextAreaField({ id, label, hint, error, ...rest }: TextAreaProps) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <textarea
        id={id}
        className={styles.input}
        rows={3}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        {...rest}
      />
    </FieldShell>
  );
}

type SelectProps = { id: string; label: string; hint?: string; error?: string } & Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'id'
>;
export function SelectField({ id, label, hint, error, children, ...rest }: SelectProps) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <select
        id={id}
        className={styles.input}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        {...rest}
      >
        {children}
      </select>
    </FieldShell>
  );
}

export function CheckField({
  id,
  label,
  ...rest
}: { id: string; label: ReactNode } & Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'>) {
  return (
    <div className={styles.check}>
      <input id={id} type="checkbox" className={styles.box} {...rest} />
      <label htmlFor={id}>{label}</label>
    </div>
  );
}
