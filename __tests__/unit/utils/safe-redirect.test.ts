import { safeRedirectTarget, isHttpUrl } from '../../../src/utils/safe-redirect';

describe('safeRedirectTarget', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: 'https://app.example.com/login', origin: 'https://app.example.com' },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', { writable: true, value: originalLocation });
  });

  it('keeps same-origin relative paths', () => {
    expect(safeRedirectTarget('/')).toBe('/');
    expect(safeRedirectTarget('/dashboard')).toBe('/dashboard');
    expect(safeRedirectTarget('/dashboard?tab=1#top')).toBe('/dashboard?tab=1#top');
  });

  it('keeps absolute URLs on the current origin', () => {
    expect(safeRedirectTarget('https://app.example.com/home')).toBe('https://app.example.com/home');
  });

  it('rejects protocol-relative and backslash-escaped hosts', () => {
    expect(safeRedirectTarget('//evil.com')).toBe('/');
    expect(safeRedirectTarget('/\\evil.com')).toBe('/');
    expect(safeRedirectTarget('///evil.com')).toBe('/');
  });

  it('rejects foreign origins and dangerous schemes', () => {
    expect(safeRedirectTarget('https://evil.com/phish')).toBe('/');
    expect(safeRedirectTarget('http://app.example.com/home')).toBe('/');
    expect(safeRedirectTarget('javascript:alert(1)')).toBe('/');
    expect(safeRedirectTarget('data:text/html,hi')).toBe('/');
  });

  it('falls back for empty or non-string input, honouring a custom fallback', () => {
    expect(safeRedirectTarget('')).toBe('/');
    expect(safeRedirectTarget('   ')).toBe('/');
    expect(safeRedirectTarget(undefined)).toBe('/');
    expect(safeRedirectTarget(null, '/home')).toBe('/home');
    expect(safeRedirectTarget('//evil.com', '/home')).toBe('/home');
  });

  it('accepts only relative paths when there is no window', () => {
    const win = globalThis.window;
    // @ts-expect-error simulating a server render
    delete globalThis.window;
    try {
      expect(safeRedirectTarget('/next')).toBe('/next');
      expect(safeRedirectTarget('https://app.example.com/home')).toBe('/');
    } finally {
      globalThis.window = win;
    }
  });
});

describe('isHttpUrl', () => {
  it('accepts absolute http(s) URLs only', () => {
    expect(isHttpUrl('https://accounts.google.com/o/oauth2/auth')).toBe(true);
    expect(isHttpUrl('http://localhost:3000/callback')).toBe(true);
    expect(isHttpUrl('javascript:alert(1)')).toBe(false);
    expect(isHttpUrl('data:text/html,hi')).toBe(false);
    expect(isHttpUrl('/relative')).toBe(false);
    expect(isHttpUrl('')).toBe(false);
    expect(isHttpUrl(undefined)).toBe(false);
    expect(isHttpUrl(42)).toBe(false);
  });
});
