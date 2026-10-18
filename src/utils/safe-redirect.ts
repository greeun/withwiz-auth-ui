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

/**
 * hooks.onSuccess 의 반환값을 이동 경로로 쓸지 정한다.
 * '/' 로 시작하는 경로나 http(s) 절대 URL 문자열만 경로로 인정하고, 그 밖의 값
 * (빈 문자열·toast id 같은 우연한 반환값·문자열이 아닌 값)은 fallback 을 쓴다.
 * 반환된 경로도 이후 safeRedirectTarget 의 같은 출처 검사를 거친다.
 */
export function pickRedirectTarget(returned: unknown, fallback: string | undefined): string | undefined {
  if (typeof returned === 'string') {
    const value = returned.trim();
    if (value.startsWith('/') || /^https?:\/\//i.test(value)) return value;
  }
  return fallback;
}

export function safeRedirectTarget(target: string | undefined | null, fallback = '/'): string {
  if (typeof target !== 'string') return fallback;
  const value = target.trim();
  if (value === '') return fallback;

  // The URL parser strips tab/CR/LF anywhere in the input, so `/\t/evil.com`
  // would become the protocol-relative `//evil.com`. Reject control characters
  // outright instead of trying to normalise them.
  if (/[\u0000-\u001F\u007F]/.test(value)) return fallback;

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
