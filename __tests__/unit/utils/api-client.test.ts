import { authFetch, authPost, authGet } from '../../../src/utils/api-client';

describe('api-client', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('authFetch', () => {
    it('includes credentials: include', async () => {
      await authFetch('/api/test');

      expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
        credentials: 'include',
      }));
    });

    it('sets Content-Type to application/json', async () => {
      await authFetch('/api/test');

      expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }));
    });

    it('merges custom headers with defaults', async () => {
      await authFetch('/api/test', {
        headers: { Authorization: 'Bearer token123' },
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token123',
        },
      }));
    });

    it('passes through other options (method, body)', async () => {
      const body = JSON.stringify({ key: 'value' });
      await authFetch('/api/test', { method: 'PUT', body });

      expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
        method: 'PUT',
        body,
        credentials: 'include',
      }));
    });
  });

  describe('authPost', () => {
    it('sends POST method with JSON-stringified body', async () => {
      const data = { email: 'test@example.com', password: 'secret' };
      await authPost('/api/login', data);

      expect(mockFetch).toHaveBeenCalledWith('/api/login', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(data),
        credentials: 'include',
      }));
    });

    it('sends no body when data is undefined', async () => {
      await authPost('/api/logout');

      expect(mockFetch).toHaveBeenCalledWith('/api/logout', expect.objectContaining({
        method: 'POST',
        body: undefined,
      }));
    });
  });

  describe('authGet', () => {
    it('sends GET method', async () => {
      await authGet('/api/me');

      expect(mockFetch).toHaveBeenCalledWith('/api/me', expect.objectContaining({
        method: 'GET',
        credentials: 'include',
      }));
    });
  });
});
