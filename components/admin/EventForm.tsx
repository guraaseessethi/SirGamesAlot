'use client';

import { useId, useState } from 'react';
import { CheckField, SelectField, TextAreaField, TextField } from '@/components/ui/Field';
import { eventFormSchema, fieldErrors, type EventFormInput } from '@/lib/domain/schemas';
import { EVENT_TYPES, EVENT_TYPE_LABELS, type EventType, type RecurrenceRule } from '@/lib/domain/types';
import { WEEKDAY_NAMES } from '@/lib/hours/hours';
import { describeRule } from '@/lib/events/recurrence';
import { ABtn } from './AdminUi';
import styles from './Admin.module.css';

export interface EventFormValues {
  title: string;
  type: EventType;
  mode: 'one-off' | 'recurring';
  date: string;
  ruleKind: RecurrenceRule['kind'];
  weekday: number;
  nth: number;
  startTime: string;
  endTime: string;
  capacity: string;
  fee: string;
  openToAll: boolean;
  note: string;
  description: string;
}

export const NEW_EVENT: EventFormValues = {
  title: '',
  type: 'store',
  mode: 'one-off',
  date: '',
  ruleKind: 'weekly',
  weekday: 5,
  nth: 1,
  startTime: '18:00',
  endTime: '21:00',
  capacity: '12',
  fee: '0',
  openToAll: false,
  note: '',
  description: '',
};

export function toInput(v: EventFormValues): EventFormInput | { error: Record<string, string> } {
  const fee = Number(v.fee || '0');
  const rule: RecurrenceRule =
    v.ruleKind === 'weekly'
      ? { kind: 'weekly', weekday: v.weekday as 0 }
      : v.ruleKind === 'last-weekday'
        ? { kind: 'last-weekday', weekday: v.weekday as 0 }
        : { kind: 'nth-weekday', weekday: v.weekday as 0, nth: v.nth as 1 };
  const candidate = {
    title: v.title,
    type: v.type,
    startTime: v.startTime,
    endTime: v.endTime,
    capacity: v.openToAll ? 0 : Number(v.capacity || '0'),
    feeCents: Number.isFinite(fee) ? Math.round(fee * 100) : -1,
    note: v.note,
    description: v.description,
    schedule: v.mode === 'one-off' ? { mode: 'one-off' as const, date: v.date } : { mode: 'recurring' as const, rule },
  };
  const parsed = eventFormSchema.safeParse(candidate);
  if (!parsed.success) {
    const errs = fieldErrors(parsed.error);
    // The schedule path is nested, so surface it on the date field.
    if (errs.schedule) errs.date = errs.schedule.includes('Invalid') ? 'Pick a date.' : errs.schedule;
    return { error: errs };
  }
  return parsed.data;
}

export function EventForm({
  initial,
  lockedMode,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: EventFormValues;
  /** When editing, a one-off stays one-off and a series stays a series. */
  lockedMode?: boolean;
  submitLabel: string;
  onSubmit: (input: EventFormInput) => Promise<void> | void;
  onCancel: () => void;
}) {
  const id = useId().replace(/:/g, '');
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = <K extends keyof EventFormValues>(k: K, val: EventFormValues[K]) => setV((p) => ({ ...p, [k]: val }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const result = toInput(v);
    if ('error' in result) {
      setErrors(result.error);
      requestAnimationFrame(() => {
        const first = ['title', 'date', 'startTime', 'endTime', 'capacity', 'fee'].find((k) => result.error[k]);
        if (first) document.getElementById(`${id}-${first}`)?.focus();
      });
      return;
    }
    setErrors({});
    await onSubmit(result);
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className={styles.formGrid}>
        <div className={styles.full}>
          <TextField id={`${id}-title`} label="Title" value={v.title} error={errors.title} onChange={(e) => set('title', e.target.value)} required />
        </div>
        <SelectField id={`${id}-type`} label="Type" value={v.type} onChange={(e) => set('type', e.target.value as EventType)}>
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {EVENT_TYPE_LABELS[t]}
            </option>
          ))}
        </SelectField>
        <SelectField id={`${id}-mode`} label="Schedule" value={v.mode} disabled={lockedMode} onChange={(e) => set('mode', e.target.value as 'one-off' | 'recurring')}>
          <option value="one-off">One-off (a single date)</option>
          <option value="recurring">Recurring</option>
        </SelectField>
        {v.mode === 'one-off' ? (
          <TextField id={`${id}-date`} label="Date" type="date" value={v.date} error={errors.date} onChange={(e) => set('date', e.target.value)} required />
        ) : (
          <>
            <SelectField id={`${id}-rule`} label="Repeats" value={v.ruleKind} onChange={(e) => set('ruleKind', e.target.value as RecurrenceRule['kind'])}>
              <option value="weekly">Every week</option>
              <option value="nth-weekday">One week each month (1st to 4th)</option>
              <option value="last-weekday">Last one of each month</option>
            </SelectField>
            {v.ruleKind === 'nth-weekday' && (
              <SelectField id={`${id}-nth`} label="Which one" value={v.nth} onChange={(e) => set('nth', Number(e.target.value))}>
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {['', '1st', '2nd', '3rd', '4th'][n]}
                  </option>
                ))}
              </SelectField>
            )}
            <SelectField id={`${id}-weekday`} label="Day of the week" value={v.weekday} onChange={(e) => set('weekday', Number(e.target.value))}>
              {WEEKDAY_NAMES.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </SelectField>
            <p className={`${styles.note} ${styles.full}`}>
              {describeRule(
                v.ruleKind === 'weekly'
                  ? { kind: 'weekly', weekday: v.weekday as 0 }
                  : v.ruleKind === 'last-weekday'
                    ? { kind: 'last-weekday', weekday: v.weekday as 0 }
                    : { kind: 'nth-weekday', weekday: v.weekday as 0, nth: v.nth as 1 },
              )}
              . The next dates are generated automatically.
            </p>
          </>
        )}
        <TextField id={`${id}-startTime`} label="Starts" type="time" value={v.startTime} error={errors.startTime} onChange={(e) => set('startTime', e.target.value)} required />
        <TextField id={`${id}-endTime`} label="Ends" type="time" value={v.endTime} error={errors.endTime} onChange={(e) => set('endTime', e.target.value)} required />
        <TextField id={`${id}-capacity`} label="Seats (capacity)" type="number" min={0} max={500} value={v.openToAll ? '0' : v.capacity} disabled={v.openToAll} error={errors.capacity} onChange={(e) => set('capacity', e.target.value)} />
        <TextField id={`${id}-fee`} label="Fee in dollars (0 = free)" type="number" min={0} step="0.01" value={v.fee} error={errors.fee ?? errors.feeCents} hint="Paid at the counter." onChange={(e) => set('fee', e.target.value)} />
        <div className={styles.full}>
          <CheckField id={`${id}-open`} checked={v.openToAll} onChange={(e) => set('openToAll', e.target.checked)} label="Open to everyone, no seats to manage (drop-in)" />
        </div>
        <div className={styles.full}>
          <TextField id={`${id}-note`} label="Short note" hint="Shown on the calendar card, like “2,000 points · 3 rounds”." value={v.note} error={errors.note} onChange={(e) => set('note', e.target.value)} />
        </div>
        <div className={styles.full}>
          <TextAreaField id={`${id}-description`} label="Description" value={v.description} error={errors.description} onChange={(e) => set('description', e.target.value)} />
        </div>
      </div>
      {lockedMode && v.mode === 'recurring' && <p className={styles.note} style={{ marginTop: 8 }}>Changes apply to every date in this series.</p>}
      <div className={styles.actions} style={{ marginTop: 14 }}>
        <ABtn type="submit" kind="primary">
          {submitLabel}
        </ABtn>
        <ABtn onClick={onCancel}>Cancel</ABtn>
      </div>
    </form>
  );
}
