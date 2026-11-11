import { z } from 'zod';
import { CATEGORIES, EVENT_TYPES, INTERESTS } from './types';

// Our CSP forbids eval. zod's just-in-time mode probes for it, which would log a CSP issue in the
// browser. Turning it off costs nothing for forms this small.
z.config({ jitless: true });

const name = z.string().trim().min(2, 'Please enter your name.').max(80, 'That name is too long.');

const phone = z
  .string()
  .trim()
  .max(30)
  .refine((v) => v === '' || v.replace(/\D/g, '').length >= 10, 'Enter a 10-digit phone number.');

const email = z
  .string()
  .trim()
  .max(120)
  .refine((v) => v === '' || z.email().safeParse(v).success, 'Enter a valid email address.');

/** Name plus at least one way to reach the customer. Blank strings are treated as missing. */
const contact = z.object({
  name,
  phone: phone.default(''),
  email: email.default(''),
  /** CASL opt-in for news. Confirmations are transactional and never need this. */
  marketingConsent: z.boolean().default(false),
});
const needsContact = (v: { phone: string; email: string }) => v.phone !== '' || v.email !== '';
const contactMessage = {
  message: 'Add a phone number or an email so we can reach you.',
  path: ['phone'],
};

export const holdRequestSchema = contact
  .extend({ sku: z.string().min(1) })
  .refine(needsContact, contactMessage);
export type HoldRequest = z.infer<typeof holdRequestSchema>;

export const orderRequestSchema = contact
  .extend({
    sku: z.string().min(1).optional(),
    productName: z.string().trim().min(2).max(120),
    note: z.string().trim().max(400).default(''),
  })
  .refine(needsContact, contactMessage);
export type OrderRequest = z.infer<typeof orderRequestSchema>;

export const backInStockSchema = contact
  .extend({ sku: z.string().min(1) })
  .refine(needsContact, contactMessage);
export type BackInStockInput = z.infer<typeof backInStockSchema>;

export const signupSchema = z.object({
  eventId: z.string().min(1),
  name,
  email: email.refine((v) => v !== '', 'Enter your email so we can confirm your seat.'),
  marketingConsent: z.boolean().default(false),
});
export type SignupInput = z.infer<typeof signupSchema>;

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use 24-hour time like 18:30.');
const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a date like 2026-11-21.');

export const recurrenceSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('weekly'), weekday: z.number().int().min(0).max(6) }),
  z.object({
    kind: z.literal('nth-weekday'),
    weekday: z.number().int().min(0).max(6),
    nth: z.number().int().min(1).max(4),
  }),
  z.object({ kind: z.literal('last-weekday'), weekday: z.number().int().min(0).max(6) }),
]);

export const eventFormSchema = z
  .object({
    title: z.string().trim().min(3, 'Give the event a title.').max(100),
    type: z.enum(EVENT_TYPES),
    startTime: hhmm,
    endTime: hhmm,
    capacity: z.number().int().min(0).max(500),
    feeCents: z.number().int().min(0).max(100_000),
    note: z.string().trim().max(160).default(''),
    description: z.string().trim().max(800).default(''),
    schedule: z.discriminatedUnion('mode', [
      z.object({ mode: z.literal('one-off'), date: ymd }),
      z.object({ mode: z.literal('recurring'), rule: recurrenceSchema }),
    ]),
  })
  .refine((v) => v.endTime > v.startTime, {
    message: 'End time must be after the start time.',
    path: ['endTime'],
  });
export type EventFormInput = z.infer<typeof eventFormSchema>;

export const productOverrideSchema = z.object({
  sku: z.string().min(1),
  status: z.enum(['in', 'low', 'order', 'out']).optional(),
  shelf: z.string().trim().max(80).optional(),
  lowThreshold: z.number().int().min(0).max(999).optional(),
});

export const categorySchema = z.enum(CATEGORIES);
export const interestSchema = z.enum(INTERESTS);

/** Flatten zod issues into { fieldName: message } for inline form errors. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
