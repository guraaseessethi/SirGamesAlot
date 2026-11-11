'use client';

import { useId, useState } from 'react';
import { CheckField, TextAreaField, TextField } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { getRepository } from '@/lib/data';
import { useRepoData } from '@/lib/data/hooks';
import type { BannerSettings, DayHours, HolidayOverride, Settings, WeeklyHours } from '@/lib/domain/types';
import { WEEKDAY_NAMES, WEEK_ORDER, formatRange, toMinutes } from '@/lib/hours/hours';
import { ABtn, Empty, PageTitle, Panel } from './AdminUi';
import { useRole } from './role';
import styles from './Admin.module.css';

export function SettingsPage() {
  const { isOwner, ready } = useRole();
  const settings = useRepoData<Settings | null>((r) => r.getSettings(), null);
  if (!ready || !settings) return <p>Loading…</p>;
  if (!isOwner) {
    return (
      <>
        <PageTitle title="Settings" />
        <p className={styles.ownerOnly}>Settings are owner-only. Switch role to Owner to change hours, the banner, hold length or the d20 promo.</p>
      </>
    );
  }
  return (
    <>
      <PageTitle title="Settings">Changes show on the public site straight away.</PageTitle>
      <BannerForm key={JSON.stringify(settings.banner)} banner={settings.banner} />
      <HoursForm key={JSON.stringify(settings.weeklyHours)} hours={settings.weeklyHours} />
      <HolidayForm holidays={settings.holidayOverrides} />
      <MiscForm key={`${settings.holdHours}|${settings.nextAnniversaryLabel}`} settings={settings} />
    </>
  );
}

function BannerForm({ banner }: { banner: BannerSettings }) {
  const id = useId().replace(/:/g, '');
  const toast = useToast();
  const [v, setV] = useState(banner);

  async function save(next: BannerSettings, message: string) {
    await getRepository().updateSettings({ banner: next });
    toast(message);
  }

  return (
    <Panel id="banner" title="Construction / entrance banner">
      <p className={styles.note} style={{ marginBottom: 12 }}>
        This is temporary. Turn it off when the main doors reopen and it disappears from every page.
      </p>
      <div className={styles.toggle} style={{ marginBottom: 14 }}>
        <input
          id={`${id}-on`}
          type="checkbox"
          checked={v.enabled}
          onChange={(e) => {
            const next = { ...v, enabled: e.target.checked };
            setV(next);
            void save(next, next.enabled ? 'Banner is on.' : 'Banner is off. It is hidden on the public site.');
          }}
        />
        <label htmlFor={`${id}-on`}>Show the banner on the public site</label>
      </div>
      <div className={styles.formGrid}>
        <TextField id={`${id}-h`} label="Headline" value={v.headline} onChange={(e) => setV({ ...v, headline: e.target.value })} />
        <TextField id={`${id}-l`} label="Link text" value={v.linkLabel} onChange={(e) => setV({ ...v, linkLabel: e.target.value })} />
        <div className={styles.full}>
          <TextAreaField id={`${id}-b`} label="Message" value={v.body} onChange={(e) => setV({ ...v, body: e.target.value })} />
        </div>
        <div className={styles.full}>
          <TextField id={`${id}-href`} label="Link goes to" hint="A page on this site, like /visit#entrance" value={v.linkHref} onChange={(e) => setV({ ...v, linkHref: e.target.value })} />
        </div>
      </div>
      <div className={styles.actions} style={{ marginTop: 12 }}>
        <ABtn kind="primary" onClick={() => save(v, 'Banner text saved.')}>
          Save banner text
        </ABtn>
      </div>
    </Panel>
  );
}

function HoursForm({ hours }: { hours: WeeklyHours }) {
  const toast = useToast();
  const [v, setV] = useState(hours);
  const [error, setError] = useState('');

  const keyOf = (d: number) => String(d) as keyof WeeklyHours;
  const update = (d: number, h: DayHours | null) => setV({ ...v, [keyOf(d)]: h });

  async function save() {
    for (const d of WEEK_ORDER) {
      const h = v[keyOf(d)];
      if (h && toMinutes(h.close) <= toMinutes(h.open)) {
        setError(`${WEEKDAY_NAMES[d]}: closing time must be after opening time.`);
        return;
      }
    }
    setError('');
    await getRepository().updateSettings({ weeklyHours: v });
    toast('Weekly hours saved.');
  }

  return (
    <Panel id="hours" title="Weekly hours">
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Day</th>
              <th>Closed</th>
              <th>Opens</th>
              <th>Closes</th>
            </tr>
          </thead>
          <tbody>
            {WEEK_ORDER.map((d) => {
              const h = v[keyOf(d)];
              return (
                <tr key={d}>
                  <th scope="row" style={{ textAlign: 'left', fontSize: 14, textTransform: 'none' }}>
                    {WEEKDAY_NAMES[d]}
                  </th>
                  <td>
                    <input type="checkbox" style={{ width: 24, height: 24 }} aria-label={`${WEEKDAY_NAMES[d]} closed`} checked={h === null} onChange={(e) => update(d, e.target.checked ? null : { open: '09:30', close: '17:00' })} />
                  </td>
                  <td>
                    <input className={styles.inline} style={{ maxWidth: 130 }} type="time" aria-label={`${WEEKDAY_NAMES[d]} opens`} disabled={!h} value={h?.open ?? ''} onChange={(e) => h && update(d, { ...h, open: e.target.value })} />
                  </td>
                  <td>
                    <input className={styles.inline} style={{ maxWidth: 130 }} type="time" aria-label={`${WEEKDAY_NAMES[d]} closes`} disabled={!h} value={h?.close ?? ''} onChange={(e) => h && update(d, { ...h, close: e.target.value })} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {error && (
        <p role="alert" style={{ color: 'var(--red)', fontWeight: 700, marginTop: 8 }}>
          {error}
        </p>
      )}
      <div className={styles.actions} style={{ marginTop: 12 }}>
        <ABtn kind="primary" onClick={save}>
          Save hours
        </ABtn>
      </div>
    </Panel>
  );
}

function HolidayForm({ holidays }: { holidays: HolidayOverride[] }) {
  const id = useId().replace(/:/g, '');
  const toast = useToast();
  const [date, setDate] = useState('');
  const [label, setLabel] = useState('');
  const [closed, setClosed] = useState(true);
  const [open, setOpen] = useState('10:00');
  const [close, setClose] = useState('17:00');
  const [error, setError] = useState('');
  const sorted = [...holidays].sort((a, b) => a.date.localeCompare(b.date));

  async function add() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return setError('Pick a date.');
    if (label.trim().length < 2) return setError('Give it a name, like “Family Day”.');
    if (!closed && toMinutes(close) <= toMinutes(open)) return setError('Closing time must be after opening time.');
    setError('');
    const next: HolidayOverride = { id: `hol-${Date.now().toString(36)}`, date, label: label.trim(), hours: closed ? null : { open, close } };
    await getRepository().updateSettings({ holidayOverrides: [...holidays.filter((h) => h.date !== date), next] });
    setDate('');
    setLabel('');
    toast('Holiday hours saved.');
  }

  return (
    <Panel id="holidays" title="Holiday overrides">
      {sorted.length === 0 ? (
        <Empty>No holiday overrides yet.</Empty>
      ) : (
        <ul style={{ listStyle: 'none', margin: '0 0 14px', padding: 0, display: 'grid', gap: 6 }}>
          {sorted.map((h) => (
            <li key={h.id} className={styles.row} style={{ justifyContent: 'space-between', borderBottom: '1px solid var(--soft)', paddingBottom: 6 }}>
              <span>
                <b>{h.date}</b> · {h.label} · {formatRange(h.hours)}
              </span>
              <ABtn kind="danger" onClick={async () => { await getRepository().updateSettings({ holidayOverrides: holidays.filter((x) => x.id !== h.id) }); toast('Removed.'); }} aria-label={`Remove ${h.label}`}>
                Remove
              </ABtn>
            </li>
          ))}
        </ul>
      )}
      <div className={styles.formGrid}>
        <TextField id={`${id}-d`} label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <TextField id={`${id}-n`} label="Name" value={label} onChange={(e) => setLabel(e.target.value)} />
        <div className={styles.full}>
          <CheckField id={`${id}-c`} checked={closed} onChange={(e) => setClosed(e.target.checked)} label="Closed all day" />
        </div>
        {!closed && (
          <>
            <TextField id={`${id}-o`} label="Opens" type="time" value={open} onChange={(e) => setOpen(e.target.value)} />
            <TextField id={`${id}-cl`} label="Closes" type="time" value={close} onChange={(e) => setClose(e.target.value)} />
          </>
        )}
      </div>
      {error && (
        <p role="alert" style={{ color: 'var(--red)', fontWeight: 700, marginTop: 8 }}>
          {error}
        </p>
      )}
      <div className={styles.actions} style={{ marginTop: 12 }}>
        <ABtn kind="primary" onClick={add}>
          Add or replace holiday
        </ABtn>
      </div>
    </Panel>
  );
}

function MiscForm({ settings }: { settings: Settings }) {
  const id = useId().replace(/:/g, '');
  const toast = useToast();
  const [hold, setHold] = useState(String(settings.holdHours));
  const [label, setLabel] = useState(settings.nextAnniversaryLabel);
  const [error, setError] = useState('');

  async function save() {
    const h = Number(hold);
    if (!Number.isInteger(h) || h < 1 || h > 168) return setError('Hold length must be a whole number of hours, from 1 to 168.');
    setError('');
    await getRepository().updateSettings({ holdHours: h, nextAnniversaryLabel: label.trim() || 'Date TBA' });
    toast('Saved.');
  }

  return (
    <Panel id="misc" title="Holds, d20 promo and anniversary">
      <div className={styles.formGrid}>
        <TextField id={`${id}-hold`} label="Hold length (hours)" type="number" min={1} max={168} value={hold} error={error} onChange={(e) => setHold(e.target.value)} />
        <TextField id={`${id}-ann`} label="Next anniversary event" hint="Shown on the events flyer, like “May 2027 · date TBA”." value={label} onChange={(e) => setLabel(e.target.value)} />
      </div>
      <div className={styles.toggle} style={{ margin: '14px 0' }}>
        <input
          id={`${id}-d20`}
          type="checkbox"
          checked={settings.d20PromoEnabled}
          onChange={async (e) => {
            await getRepository().updateSettings({ d20PromoEnabled: e.target.checked });
            toast(e.target.checked ? 'd20 promo is on.' : 'd20 promo is off. The die still rolls, but the discount copy is paused.');
          }}
        />
        <label htmlFor={`${id}-d20`}>“Take 10% off, or roll for it” is running</label>
      </div>
      <div className={styles.actions}>
        <ABtn kind="primary" onClick={save}>
          Save
        </ABtn>
      </div>
    </Panel>
  );
}
