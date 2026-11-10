/**
 * Email carried by an authentication link (`?email=…&token=…`).
 *
 * The token endpoints identify the account by email **and** token, and the mails these
 * forms land from put both in the query string. Reading it here means an app that only
 * forwards the token — the shape every caller had before `email` became a prop — keeps
 * working after upgrading.
 *
 * An explicit `email` prop always wins; this is the fallback. Returns `undefined` off the
 * browser (no location to read) and for a blank value, so callers can omit the field
 * rather than send an empty string.
 */
export function emailFromLink(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return new URLSearchParams(window.location.search).get('email') || undefined;
}

/** `url` with `?email=` added (since 0.11). Keeps an existing query and hash; returns `url` unchanged without an email. */
export function withEmailQuery(url: string, email: string | undefined): string {
  if (!email) return url;
  const hashAt = url.indexOf('#');
  const base = hashAt >= 0 ? url.slice(0, hashAt) : url;
  const hash = hashAt >= 0 ? url.slice(hashAt) : '';
  return `${base}${base.includes('?') ? '&' : '?'}email=${encodeURIComponent(email)}${hash}`;
}
