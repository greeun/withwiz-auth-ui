import { renderHook } from '@testing-library/react';
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
});
