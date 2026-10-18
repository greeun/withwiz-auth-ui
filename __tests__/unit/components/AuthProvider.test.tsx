import { renderHook, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../../src/components/AuthProvider';
import React from 'react';

describe('useAuth', () => {
  it('should throw when used outside AuthProvider', () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within AuthProvider');
  });

  it('should start with unauthenticated state', () => {
    // Mock fetch to return 401
    global.fetch = vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) });

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(AuthProvider, { apiBasePath: '/api/auth' }, children);

    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('reads the user from a { success, data } envelope on login and /me', async () => {
    const user = { id: 'u1', email: 'a@example.com', role: 'user' };
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: { user } }) }) // /me
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: { user } }) }); // /login
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(AuthProvider, { apiBasePath: '/api/auth' }, children);
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toEqual(user);
    await act(async () => { await result.current.login('a@example.com', 'password123'); });
    expect(result.current.user).toEqual(user);
  });
});
