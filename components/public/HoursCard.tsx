'use client';

import { formatInTimeZone } from 'date-fns-tz';
import { Verify } from '@/components/ui/Verify';
import type { Settings, WeeklyHours } from '@/lib/domain/types';
import {
  STORE_TZ,
  WEEKDAY_NAMES,
  WEEK_ORDER,
  formatRange,
  upcomingHolidays,
} from '@/lib/hours/hours';
import { useStoreHours } from './useOpenStatus';
import styles from './Visit.module.css';

export function HoursCard({
  initialSettings,
  initialNowIso,
}: {
  initialSettings: Settings;
  initialNowIso: string;
}) {
  const { settings, now, status } = useStoreHours(initialSettings, initialNowIso);
  const today = Number(formatInTimeZone(now, STORE_TZ, 'i')) % 7; // ISO 1..7 (Mon..Sun) → JS 0..6
  const holidays = upcomingHolidays(settings, now, 60);

  return (
    <div className={styles.vcard}>
      <h3>
        Hours <Verify note="hours" />
      </h3>
      <div className={styles.openLine} data-testid="hours-open">
        <i className={status.open ? styles.on : ''} aria-hidden="true" />
        <span>{status.text}</span>
      </div>
      <table className={styles.hrs}>
        <caption className="sr-only">Weekly opening hours</caption>
        <tbody>
          {WEEK_ORDER.map((d) => (
            <tr
              key={d}
              className={d === today ? styles.today : ''}
              aria-current={d === today ? 'date' : undefined}
            >
              <th scope="row">{WEEKDAY_NAMES[d]}</th>
              <td>{formatRange(settings.weeklyHours[String(d) as keyof WeeklyHours])}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {holidays.length > 0 && (
        <>
          <h4 className={styles.subhead}>Coming up</h4>
          <ul className={styles.holidays}>
            {holidays.map((h) => (
              <li key={h.id}>
                <span>
                  {formatInTimeZone(new Date(`${h.date}T12:00:00Z`), 'UTC', 'EEE, MMM d')} ·{' '}
                  {h.label}
                </span>
                <b>{formatRange(h.hours)}</b>
              </li>
            ))}
          </ul>
        </>
      )}
      <p className={styles.fine}>
        Holiday hours change. Call to confirm. <Verify note="holiday hours" />
      </p>
    </div>
  );
}
