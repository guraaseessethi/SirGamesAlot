'use client';

import { useMemo, useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { getRepository } from '@/lib/data';
import { RepositoryError } from '@/lib/data/repository';
import { useNow, useRepoData } from '@/lib/data/hooks';
import type { EventFormInput } from '@/lib/domain/schemas';
import { EVENT_TYPE_LABELS, type EventSeries, type EventSignup, type SignupStatus, type StoreEvent } from '@/lib/domain/types';
import { toCsv, downloadCsv } from '@/lib/csv';
import { formatEventDate, isUpcoming } from '@/lib/events/events';
import { describeRule } from '@/lib/events/recurrence';
import { canPromote, seatSummary } from '@/lib/events/seats';
import { formatTime } from '@/lib/hours/hours';
import { formatFee } from '@/lib/money';
import { ABtn, Badge, Empty, PageTitle, Panel, when } from './AdminUi';
import { EventForm, NEW_EVENT, type EventFormValues } from './EventForm';
import { useRole } from './role';
import styles from './Admin.module.css';

const STATUS_TONE: Record<SignupStatus, 'ok' | 'warn' | 'bad' | 'info' | 'muted'> = {
  seated: 'info',
  waitlist: 'warn',
  'checked-in': 'ok',
  'no-show': 'bad',
  cancelled: 'muted',
};
const STATUS_LABEL: Record<SignupStatus, string> = {
  seated: 'Seat saved',
  waitlist: 'Waitlist',
  'checked-in': 'Checked in',
  'no-show': 'No-show',
  cancelled: 'Cancelled',
};

function valuesFor(event: StoreEvent, series: EventSeries | undefined): EventFormValues {
  return {
    ...NEW_EVENT,
    title: event.title,
    type: event.type,
    mode: series ? 'recurring' : 'one-off',
    date: series ? '' : event.date,
    ruleKind: series?.rule.kind ?? 'weekly',
    weekday: series?.rule.weekday ?? 5,
    nth: series?.rule.kind === 'nth-weekday' ? series.rule.nth : 1,
    startTime: event.startTime,
    endTime: event.endTime,
    capacity: String(event.capacity || 12),
    openToAll: event.capacity === 0,
    fee: String(event.feeCents / 100),
    note: event.note,
    description: event.description,
  };
}

export function EventsPage() {
  const toast = useToast();
  const { isOwner } = useRole();
  const now = useNow(new Date().toISOString(), 30_000);
  const events = useRepoData<StoreEvent[] | null>((r) => r.listEvents(), null);
  const signups = useRepoData<EventSignup[] | null>((r) => r.listSignups(), null);
  const series = useRepoData<EventSeries[] | null>((r) => r.listSeries(), null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<{ mode: 'new' } | { mode: 'edit'; event: StoreEvent } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  const upcoming = useMemo(() => (events ?? []).filter((e) => isUpcoming(e, now)), [events, now]);
  const selected = upcoming.find((e) => e.id === selectedId) ?? null;
  const attendees = useMemo(() => {
    if (!selected || !signups) return [];
    const order: Record<SignupStatus, number> = { 'checked-in': 0, seated: 1, waitlist: 2, 'no-show': 3, cancelled: 4 };
    return signups
      .filter((s) => s.eventId === selected.id && s.name.toLowerCase().includes(filter.toLowerCase()))
      .sort((a, b) => order[a.status] - order[b.status] || a.createdAt.localeCompare(b.createdAt));
  }, [signups, selected, filter]);

  if (!events || !signups || !series) return <p>Loading…</p>;

  async function run(action: () => Promise<unknown>, okMessage?: string) {
    try {
      await action();
      if (okMessage) toast(okMessage);
    } catch (err) {
      toast(err instanceof RepositoryError ? err.message : 'Something went wrong.');
    }
  }

  async function save(input: EventFormInput) {
    if (form?.mode === 'edit') {
      await run(() => getRepository().updateEvent(form.event.id, input), `Saved ${input.title}.`);
    } else {
      await run(() => getRepository().createEvent(input), `Created ${input.title}.`);
    }
    setForm(null);
  }

  function exportAttendees() {
    if (!selected) return;
    const rows = signups!
      .filter((s) => s.eventId === selected.id)
      .map((s) => [s.name, s.email, STATUS_LABEL[s.status], s.marketingConsent ? 'yes' : 'no', s.createdAt]);
    downloadCsv(`${selected.slug}-attendees.csv`, toCsv(['Name', 'Email', 'Status', 'Marketing consent', 'Signed up (UTC)'], rows));
    toast('Attendee list downloaded.');
  }

  const summary = selected ? seatSummary(selected.capacity, signups.filter((s) => s.eventId === selected.id)) : null;
  const canPromoteNow = selected && canPromote(selected.capacity, signups.filter((s) => s.eventId === selected.id));

  return (
    <>
      <PageTitle title="Events">Create one-off or recurring events, watch the seats fill, check people in at the door and promote from the waitlist.</PageTitle>

      {form ? (
        <Panel id="event-form" title={form.mode === 'new' ? 'New event' : `Edit ${form.event.title}`}>
          <EventForm
            initial={form.mode === 'new' ? NEW_EVENT : valuesFor(form.event, series.find((s) => s.id === form.event.seriesId))}
            lockedMode={form.mode === 'edit'}
            submitLabel={form.mode === 'new' ? 'Create event' : 'Save changes'}
            onSubmit={save}
            onCancel={() => setForm(null)}
          />
        </Panel>
      ) : (
        <div style={{ marginBottom: 18 }}>
          <ABtn kind="primary" onClick={() => setForm({ mode: 'new' })}>
            + New event
          </ABtn>
        </div>
      )}

      <div className={styles.grid2}>
        <Panel id="upcoming" title={`Upcoming (${upcoming.length})`}>
          {upcoming.length === 0 ? (
            <Empty>No upcoming events.</Empty>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Event</th>
                    <th>Seats</th>
                    <th>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {upcoming.slice(0, 40).map((e) => {
                    const s = seatSummary(e.capacity, signups.filter((x) => x.eventId === e.id));
                    return (
                      <tr key={e.id} data-testid="admin-event-row" aria-selected={selectedId === e.id}>
                        <td>
                          {formatEventDate(e, 'EEE MMM d')}
                          <small>
                            {formatTime(e.startTime)} – {formatTime(e.endTime)}
                          </small>
                        </td>
                        <td>
                          {e.title}
                          <small>
                            {EVENT_TYPE_LABELS[e.type]} · {formatFee(e.feeCents)}
                            {e.seriesId ? ' · recurring' : ''}
                          </small>
                        </td>
                        <td>
                          {s.hasSeats ? (
                            <>
                              {s.taken}/{s.capacity}
                              {s.waitlist > 0 && <small>{s.waitlist} waitlist</small>}
                            </>
                          ) : (
                            <small>Open</small>
                          )}
                        </td>
                        <td>
                          <div className={styles.actions}>
                            <ABtn onClick={() => setSelectedId(e.id)} aria-label={`Manage sign-ups for ${e.title}, ${formatEventDate(e, 'MMM d')}`}>
                              Sign-ups
                            </ABtn>
                            <ABtn onClick={() => setForm({ mode: 'edit', event: e })} aria-label={`Edit ${e.title}`}>
                              Edit
                            </ABtn>
                            {confirmDelete === e.id ? (
                              <>
                                <ABtn kind="danger" onClick={() => run(() => getRepository().deleteEvent(e.id), `Deleted ${e.title}.`).then(() => setConfirmDelete(null))}>
                                  {e.seriesId ? 'Delete whole series' : 'Yes, delete'}
                                </ABtn>
                                <ABtn onClick={() => setConfirmDelete(null)}>Keep</ABtn>
                              </>
                            ) : (
                              <ABtn kind="danger" onClick={() => setConfirmDelete(e.id)} aria-label={`Delete ${e.title}`}>
                                Delete
                              </ABtn>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <div>
          <Panel
            id="attendees"
            title={selected ? `Sign-ups: ${selected.title}, ${formatEventDate(selected, 'MMM d')}` : 'Sign-ups'}
            action={
              selected && (
                <ABtn onClick={exportAttendees} disabled={!isOwner} title={isOwner ? undefined : 'Owner only in the full build'}>
                  Export attendee list{isOwner ? '' : ' (owner only)'}
                </ABtn>
              )
            }
          >
            {!selected || !summary ? (
              <Empty>Pick an event to see who is coming, check people in and manage the waitlist.</Empty>
            ) : (
              <>
                <p style={{ marginBottom: 10 }} data-testid="admin-seat-summary">
                  {summary.hasSeats ? `${summary.taken} of ${summary.capacity} seats taken · ${summary.waitlist} on the waitlist` : 'Open to everyone. Nobody needs to sign up.'}
                </p>
                <label htmlFor="attendee-filter" className="sr-only">
                  Find a name
                </label>
                <input id="attendee-filter" className={styles.inline} style={{ maxWidth: 260, marginBottom: 10 }} type="search" placeholder="Find a name at the door" value={filter} onChange={(e) => setFilter(e.target.value)} />
                {attendees.length === 0 ? (
                  <Empty>No sign-ups match.</Empty>
                ) : (
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Status</th>
                          <th>
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendees.map((s) => (
                          <tr key={s.id} data-testid="attendee-row">
                            <td>
                              {s.name}
                              <small>
                                {s.email} · {when(s.createdAt)}
                                {s.marketingConsent ? ' · news OK' : ''}
                              </small>
                            </td>
                            <td>
                              <Badge tone={STATUS_TONE[s.status]}>{STATUS_LABEL[s.status]}</Badge>
                            </td>
                            <td>
                              <div className={styles.actions}>
                                {s.status === 'seated' && (
                                  <ABtn kind="primary" onClick={() => run(() => getRepository().setSignupStatus(s.id, 'checked-in'))} aria-label={`Check in ${s.name}`}>
                                    Check in
                                  </ABtn>
                                )}
                                {s.status === 'waitlist' && (
                                  <ABtn onClick={() => run(() => getRepository().promoteSignup(s.id), `${s.name} moved off the waitlist. Would email them in the full build.`)} disabled={!canPromoteNow} title={canPromoteNow ? undefined : 'No open seat yet'} aria-label={`Promote ${s.name} from the waitlist`}>
                                    Promote
                                  </ABtn>
                                )}
                                {(s.status === 'seated' || s.status === 'checked-in') && (
                                  <ABtn onClick={() => run(() => getRepository().setSignupStatus(s.id, 'no-show'))} aria-label={`Mark ${s.name} no-show`}>
                                    No-show
                                  </ABtn>
                                )}
                                {s.status !== 'cancelled' && (
                                  <ABtn kind="danger" onClick={() => run(() => getRepository().setSignupStatus(s.id, 'cancelled'))} aria-label={`Cancel ${s.name}'s seat`}>
                                    Cancel
                                  </ABtn>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </Panel>

          <Panel id="series" title="Recurring series">
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
              {series.map((s) => (
                <li key={s.id}>
                  <b>{s.title}</b>
                  <br />
                  <span className={styles.note}>
                    {describeRule(s.rule)} · {formatTime(s.startTime)} – {formatTime(s.endTime)} · {s.capacity ? `${s.capacity} seats` : 'open'} · {formatFee(s.feeCents)}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
