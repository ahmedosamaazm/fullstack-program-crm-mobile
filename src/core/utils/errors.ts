/**
 * Normalises anything thrown by Supabase, fetch, or our own code into one shape
 * the presentation layer can branch on. Boundaries catch, this maps, screens
 * render — no layer below presentation formats a user-facing string.
 */
export type AppErrorKind = 'network' | 'auth' | 'notFound' | 'validation' | 'server' | 'unknown';

export type AppError = {
  kind: AppErrorKind;
  /** Developer-facing. Never rendered directly. */
  message: string;
  /** HTTP-ish status when the source provided one. */
  status?: number;
  /** i18n key the UI should render for this failure. */
  messageKey: string;
  cause?: unknown;
};

function kindFromStatus(status: number): AppErrorKind {
  if (status === 401 || status === 403) return 'auth';
  if (status === 404) return 'notFound';
  if (status === 422 || status === 400) return 'validation';
  if (status >= 500) return 'server';
  return 'unknown';
}

function messageKeyFor(kind: AppErrorKind): string {
  switch (kind) {
    case 'network':
      return 'states.offline';
    default:
      return 'states.errorBody';
  }
}

function hasStringProp<K extends string>(
  value: unknown,
  key: K,
): value is Record<K, string> {
  return (
    typeof value === 'object' &&
    value !== null &&
    key in value &&
    typeof (value as Record<string, unknown>)[key] === 'string'
  );
}

function readStatus(value: unknown): number | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const record = value as Record<string, unknown>;
  if (typeof record.status === 'number') return record.status;
  // PostgREST reports its own codes as strings, e.g. "PGRST116".
  if (typeof record.code === 'string' && /^\d+$/.test(record.code)) {
    return Number(record.code);
  }
  return undefined;
}

export function toAppError(error: unknown): AppError {
  if (isAppError(error)) return error;

  const status = readStatus(error);
  const message = hasStringProp(error, 'message')
    ? error.message
    : typeof error === 'string'
      ? error
      : 'Unknown error';

  // Fetch failures surface as a TypeError with no status.
  const isNetwork =
    status === undefined && /network|fetch|timeout|connection/i.test(message);

  const kind: AppErrorKind = isNetwork
    ? 'network'
    : status !== undefined
      ? kindFromStatus(status)
      : 'unknown';

  return {
    kind,
    message,
    status,
    messageKey: messageKeyFor(kind),
    cause: error,
  };
}

export function isAppError(value: unknown): value is AppError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'kind' in value &&
    'messageKey' in value &&
    hasStringProp(value, 'message')
  );
}

/** The i18n key a screen should render for a thrown value — generic fallback otherwise. */
export function errorMessageKey(error: unknown): string {
  if (isAppError(error)) return error.messageKey;
  return 'states.errorBody';
}
