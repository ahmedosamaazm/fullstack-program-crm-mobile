import type { TicketStatus } from './types';

/**
 * BRD §6 (`docs/phase1_brd_1.md:216-247`), transcribed once.
 *
 * This map is NOT the guarantee — the database trigger is, and API §4.9's
 * negative tests are what prove it. This exists so the picker never offers an
 * illegal option in the first place. If the two ever disagree, the database is
 * right and this file is wrong.
 */
const TRANSITIONS: Record<TicketStatus, readonly TicketStatus[]> = {
  new: ['open'],
  open: ['pending', 'resolved'],
  pending: ['open', 'resolved'],
  resolved: ['closed', 'open'],
  closed: [], // terminal
};

export function allowedTransitions(from: TicketStatus): readonly TicketStatus[] {
  return TRANSITIONS[from];
}

export function canTransition(from: TicketStatus, to: TicketStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

/** `resolved` requires a resolution note (BRD §6, API §4.9). */
export function requiresResolutionNote(to: TicketStatus): boolean {
  return to === 'resolved';
}
