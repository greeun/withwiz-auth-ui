import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../src/components/AuthProvider';
import type { AuthContextValue } from '../../src/types';

// Helper component that exposes useAuth values for testing
function AuthConsumer({ onRender }: { onRender: (ctx: AuthContextValue) => void }) {
  const ctx = useAuth();
  onRender(ctx);
  return (
    <div>
      <span data-testid="is-authenticated">{String(ctx.isAuthenticated)}</span>
      <span data-testid="is-loading">{String(ctx.isLoading)}</span>
      <span data-testid="user">{ctx.user ? JSON.stringify(ctx.user) : 'null'}</span>
      <button data-testid="login-btn" onClick={() => ctx.login('test@test.com', 'password123')}>Login</button>
      <button data-testid="logout-btn" onClick={() => ctx.logout()}>Logout</button>
      <button data-testid="refresh-btn" onClick={() => ctx.refresh()}>Refresh</button>
    </div>
  );
}

function mockFetch(responses: Record<string, { ok: boolean; status: number; body: unknown }>) {
  return vi.fn(async (url: string) => {
    const key = Object.keys(responses).find((k) => url.includes(k));
    const resp = key ? responses[key] : { ok: false, status: 404, body: { error: 'Not Found' } };
    return {
      ok: resp.ok,
      status: resp.status,
      json: async () => resp.body,
    } as Response;
  });
}

describe('AuthProvider integration', () => {
  const mockUser = { id: '1', email: 'test@test.com', name: 'Test User', role: 'user' };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads user on mount when /me returns ok with user data, onAuthChange called with true', async () => {
    const onAuthChange = vi.fn();
    global.fetch = mockFetch({
      '/me': { ok: true, status: 200, body: { user: mockUser } },
    });

    const renderCallback = vi.fn();

    await act(async () => {
      render(
        <AuthProvider onAuthChange={onAuthChange}>
          <AuthConsumer onRender={renderCallback} />
        </AuthProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    });

    expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
    expect(onAuthChange).toHaveBeenCalledWith(true);
  });

  it('sets unauthenticated when /me returns 401, onAuthChange called with false', async () => {
    const onAuthChange = vi.fn();
    global.fetch = mockFetch({
      '/me': { ok: false, status: 401, body: { error: 'Unauthorized' } },
    });

    const renderCallback = vi.fn();

    await act(async () => {
      render(
        <AuthProvider onAuthChange={onAuthChange}>
          <AuthConsumer onRender={renderCallback} />
        </AuthProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('user')).toHaveTextContent('null');
    expect(onAuthChange).toHaveBeenCalledWith(false);
  });

  it('login() updates context: user becomes available, isAuthenticated becomes true', async () => {
    global.fetch = vi.fn(async (url: string) => {
      if (url.includes('/me')) {
        return { ok: false, status: 401, json: async () => ({ error: 'Unauthorized' }) } as Response;
      }
      if (url.includes('/login')) {
        return { ok: true, status: 200, json: async () => ({ user: mockUser }) } as Response;
      }
      return { ok: false, status: 404, json: async () => ({}) } as Response;
    });

    const renderCallback = vi.fn();

    await act(async () => {
      render(
        <AuthProvider>
          <AuthConsumer onRender={renderCallback} />
        </AuthProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');

    await act(async () => {
      screen.getByTestId('login-btn').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    });

    expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
  });

  it('login() throws error on failed API response', async () => {
    global.fetch = vi.fn(async (url: string) => {
      if (url.includes('/me')) {
        return { ok: false, status: 401, json: async () => ({ error: 'Unauthorized' }) } as Response;
      }
      if (url.includes('/login')) {
        return { ok: false, status: 401, json: async () => ({ error: 'Invalid credentials' }) } as Response;
      }
      return { ok: false, status: 404, json: async () => ({}) } as Response;
    });

    let capturedCtx: AuthContextValue | null = null;
    const renderCallback = vi.fn((ctx: AuthContextValue) => { capturedCtx = ctx; });

    await act(async () => {
      render(
        <AuthProvider>
          <AuthConsumer onRender={renderCallback} />
        </AuthProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    });

    await expect(
      act(async () => {
        await capturedCtx!.login('test@test.com', 'wrongpass');
      })
    ).rejects.toThrow('Invalid credentials');

    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
  });

  it('logout() clears user and sets isAuthenticated to false', async () => {
    global.fetch = vi.fn(async (url: string) => {
      if (url.includes('/me')) {
        return { ok: true, status: 200, json: async () => ({ user: mockUser }) } as Response;
      }
      if (url.includes('/logout')) {
        return { ok: true, status: 200, json: async () => ({}) } as Response;
      }
      return { ok: false, status: 404, json: async () => ({}) } as Response;
    });

    const onAuthChange = vi.fn();
    const renderCallback = vi.fn();

    await act(async () => {
      render(
        <AuthProvider onAuthChange={onAuthChange}>
          <AuthConsumer onRender={renderCallback} />
        </AuthProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    });

    await act(async () => {
      screen.getByTestId('logout-btn').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('user')).toHaveTextContent('null');
    expect(onAuthChange).toHaveBeenCalledWith(false);
  });

  it('refresh() returns true on success, false on failure', async () => {
    let refreshShouldSucceed = true;

    global.fetch = vi.fn(async (url: string) => {
      if (url.includes('/me')) {
        return { ok: true, status: 200, json: async () => ({ user: mockUser }) } as Response;
      }
      if (url.includes('/refresh')) {
        return {
          ok: refreshShouldSucceed,
          status: refreshShouldSucceed ? 200 : 401,
          json: async () => ({}),
        } as Response;
      }
      return { ok: false, status: 404, json: async () => ({}) } as Response;
    });

    let capturedCtx: AuthContextValue | null = null;
    const renderCallback = vi.fn((ctx: AuthContextValue) => { capturedCtx = ctx; });

    await act(async () => {
      render(
        <AuthProvider>
          <AuthConsumer onRender={renderCallback} />
        </AuthProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    });

    // Test successful refresh
    let result: boolean = false;
    await act(async () => {
      result = await capturedCtx!.refresh();
    });
    expect(result).toBe(true);

    // Test failed refresh
    refreshShouldSucceed = false;
    await act(async () => {
      result = await capturedCtx!.refresh();
    });
    expect(result).toBe(false);
  });

  it('useAuth() throws if used outside AuthProvider', () => {
    function Orphan() {
      useAuth();
      return null;
    }

    // Suppress React error boundary console output
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<Orphan />);
    }).toThrow('useAuth must be used within AuthProvider');

    spy.mockRestore();
  });
});
