/**
 * Guards the `window.location.href` assignments the forms make after a
 * successful login / signup / OAuth handshake.
 *
 * Only same-origin targets are allowed: a path starting with a single `/`
 * (`//host` is protocol-relative and would leave the site), or an absolute
 * URL whose origin matches the current page. Anything else — `javascript:`,
 * `data:`, a foreign host, a malformed string — falls back to `fallback`.
 *
 * The redirect props are meant to be developer-set, but apps commonly feed
 * them from a `?next=` query. This keeps that pattern from turning into an
 * open redirect.
 */
/** True for an absolute `http:`/`https:` URL. Used for provider authorize URLs. */
export function isHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

export function safeRedirectTarget(target: string | undefined | null, fallback = '/'): string {
  if (typeof target !== 'string') return fallback;
  const value = target.trim();
  if (value === '') return fallback;

  // Relative path: must start with exactly one slash. Backslashes are
  // normalised to slashes by browsers, so `/\evil.com` is treated as `//`.
  if (value.startsWith('/')) {
    return /^\/[^/\\]/.test(value) || value === '/' ? value : fallback;
  }

  if (typeof window === 'undefined') return fallback;
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return fallback;
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return fallback;
    return url.href;
  } catch {
    return fallback;
  }
}
