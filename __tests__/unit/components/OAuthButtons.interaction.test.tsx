import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OAuthButtons } from '../../../src/components/OAuthButtons';

describe('OAuthButtons interaction', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
  });

  function mockFetch(response: { ok: boolean; json: () => Promise<unknown> }) {
    global.fetch = vi.fn().mockResolvedValue(response);
  }

  it('calls onOAuthStart callback with provider name on click', async () => {
    mockFetch({ ok: true, json: async () => ({ loginUrl: 'https://oauth.example.com' }) });

    const onOAuthStart = vi.fn();
    render(
      <OAuthButtons providers={['google']} mode="login" onOAuthStart={onOAuthStart} />
    );

    const btn = screen.getByTestId('oauth-google-btn');
    fireEvent.click(btn);

    await waitFor(() => {
      expect(onOAuthStart).toHaveBeenCalledWith('google');
    });
  });

  it('calls API with correct provider on click', async () => {
    mockFetch({ ok: true, json: async () => ({ loginUrl: 'https://oauth.example.com' }) });

    render(<OAuthButtons providers={['github']} mode="login" />);

    const btn = screen.getByTestId('oauth-github-btn');
    fireEvent.click(btn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    const [url, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('/api/auth/oauth/login');
    const body = JSON.parse(options.body);
    expect(body.provider).toBe('github');
  });

  it('redirects to loginUrl from API response', async () => {
    mockFetch({ ok: true, json: async () => ({ loginUrl: 'https://accounts.google.com/auth' }) });

    render(<OAuthButtons providers={['google']} mode="login" />);

    const btn = screen.getByTestId('oauth-google-btn');
    fireEvent.click(btn);

    await waitFor(() => {
      expect(window.location.href).toBe('https://accounts.google.com/auth');
    });
  });

  it('shows "..." on the clicked button during loading', async () => {
    let resolvePromise: (value: unknown) => void;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    global.fetch = vi.fn().mockReturnValue(pendingPromise);

    render(<OAuthButtons providers={['google', 'github']} mode="login" />);

    const googleBtn = screen.getByTestId('oauth-google-btn');
    fireEvent.click(googleBtn);

    await waitFor(() => {
      expect(googleBtn).toHaveTextContent('...');
    });

    // Resolve to clean up
    resolvePromise!({ ok: true, json: async () => ({ loginUrl: '' }) });
  });

  it('disables all buttons when one is loading', async () => {
    let resolvePromise: (value: unknown) => void;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    global.fetch = vi.fn().mockReturnValue(pendingPromise);

    render(<OAuthButtons providers={['google', 'github', 'kakao']} mode="login" />);

    const googleBtn = screen.getByTestId('oauth-google-btn');
    const githubBtn = screen.getByTestId('oauth-github-btn');
    const kakaoBtn = screen.getByTestId('oauth-kakao-btn');

    fireEvent.click(googleBtn);

    await waitFor(() => {
      expect(googleBtn).toBeDisabled();
      expect(githubBtn).toBeDisabled();
      expect(kakaoBtn).toBeDisabled();
    });

    // Resolve to clean up
    resolvePromise!({ ok: true, json: async () => ({ loginUrl: '' }) });
  });

  it('disables all buttons when disabled prop is true', () => {
    mockFetch({ ok: true, json: async () => ({}) });

    render(
      <OAuthButtons providers={['google', 'github']} mode="login" disabled={true} />
    );

    const googleBtn = screen.getByTestId('oauth-google-btn');
    const githubBtn = screen.getByTestId('oauth-github-btn');

    expect(googleBtn).toBeDisabled();
    expect(githubBtn).toBeDisabled();
  });

  it('custom apiBasePath is used in API call', async () => {
    mockFetch({ ok: true, json: async () => ({ loginUrl: 'https://example.com' }) });

    render(
      <OAuthButtons providers={['google']} mode="login" apiBasePath="/custom/auth" />
    );

    const btn = screen.getByTestId('oauth-google-btn');
    fireEvent.click(btn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('/custom/auth/oauth/login');
  });
});
