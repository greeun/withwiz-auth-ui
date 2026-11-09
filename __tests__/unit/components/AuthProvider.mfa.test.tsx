import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from '../../../src/components/AuthProvider';
import { AuthError } from '../../../src/utils/auth-error';

const user = { id: 'u1', email: 'a@example.com', role: 'user' };
const json = (status: number, body: unknown) => ({ ok: status < 400, status, json: async () => body });
const meGuest = () => json(401, {});

function setup(onAuthChange?: (v: boolean) => void) {
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(AuthProvider, { apiBasePath: '/api/auth', onAuthChange }, children);
  return renderHook(() => useAuth(), { wrapper });
}

async function ready(fetchMock: ReturnType<typeof vi.fn>, onAuthChange?: (v: boolean) => void) {
  global.fetch = fetchMock as unknown as typeof fetch;
  const hook = setup(onAuthChange);
  await waitFor(() => expect(hook.result.current.isLoading).toBe(false));
  return hook;
}

async function catchError(p: Promise<unknown>) {
  try { await p; } catch (e) { return e; }
  return undefined;
}

describe('AuthProvider MFA', () => {
  it('login(): 401 MFA_REQUIRED 면 key MFA_REQUIRED 인 AuthError, 본문 mfaToken 을 err.mfaToken 에 담는다', async () => {
    const f = vi.fn().mockResolvedValueOnce(meGuest())
      .mockResolvedValueOnce(json(401, { error: { key: 'MFA_REQUIRED', message: 'MFA required' }, mfaToken: 'tok-1' }));
    const { result } = await ready(f);
    let err: unknown;
    await act(async () => { err = await catchError(result.current.login('a@example.com', 'pw')); });
    expect(err).toBeInstanceOf(AuthError);
    expect((err as AuthError).info.key).toBe('MFA_REQUIRED');
    expect((err as AuthError).mfaToken).toBe('tok-1');
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('login(): mfaToken 이 없으면 err.mfaToken 은 undefined', async () => {
    const f = vi.fn().mockResolvedValueOnce(meGuest())
      .mockResolvedValueOnce(json(401, { error: { key: 'MFA_REQUIRED', message: 'MFA required' } }));
    const { result } = await ready(f);
    let err: unknown;
    await act(async () => { err = await catchError(result.current.login('a@example.com', 'pw')); });
    expect((err as AuthError).info.key).toBe('MFA_REQUIRED');
    expect((err as AuthError).mfaToken).toBeUndefined();
  });

  it('login(): 그 밖의 실패는 0.9 와 같은 AuthError, mfaToken 없음', async () => {
    const f = vi.fn().mockResolvedValueOnce(meGuest())
      .mockResolvedValueOnce(json(401, { error: { key: 'INVALID_CREDENTIALS', message: 'bad' }, mfaToken: 'x' }));
    const { result } = await ready(f);
    let err: unknown;
    await act(async () => { err = await catchError(result.current.login('a@example.com', 'pw')); });
    expect(err).toBeInstanceOf(AuthError);
    expect((err as AuthError).info.key).not.toBe('MFA_REQUIRED');
    expect((err as AuthError).mfaToken).toBeUndefined();
  });

  it('verifyMfa(): 성공하면 user 갱신·isAuthenticated true·onAuthChange(true), { redirectTo } 반환', async () => {
    const onAuthChange = vi.fn();
    const f = vi.fn().mockResolvedValueOnce(meGuest())
      .mockResolvedValueOnce(json(200, { user, redirectTo: '/home' }));
    const { result } = await ready(f, onAuthChange);
    onAuthChange.mockClear();
    let out: { redirectTo?: string } | undefined;
    await act(async () => { out = await result.current.verifyMfa({ code: '123456' }); });
    expect(out).toEqual({ redirectTo: '/home' });
    expect(result.current.user).toEqual(user);
    expect(result.current.isAuthenticated).toBe(true);
    expect(onAuthChange).toHaveBeenCalledWith(true);
  });

  it('verifyMfa(): opts.mfaToken 을 본문에 싣는다', async () => {
    const f = vi.fn().mockResolvedValueOnce(meGuest()).mockResolvedValueOnce(json(200, { user }));
    const { result } = await ready(f);
    await act(async () => { await result.current.verifyMfa({ code: '123456' }, { mfaToken: 'tok-2' }); });
    const [url, init] = f.mock.calls[1];
    expect(url).toBe('/api/auth/mfa/verify');
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({ code: '123456', mfaToken: 'tok-2' });
  });

  it('verifyMfa(): user 가 본문에 없으면 /me 로 불러온다', async () => {
    const f = vi.fn().mockResolvedValueOnce(meGuest())
      .mockResolvedValueOnce(json(200, { success: true }))
      .mockResolvedValueOnce(json(200, { user }));
    const { result } = await ready(f);
    await act(async () => { await result.current.verifyMfa({ code: '123456' }); });
    expect(f.mock.calls[2][0]).toBe('/api/auth/me');
    expect(result.current.user).toEqual(user);
  });

  it('verifyMfa(): 실패하면 AuthError(info.key 유지), user 는 그대로', async () => {
    const f = vi.fn().mockResolvedValueOnce(json(200, { user }))
      .mockResolvedValueOnce(json(401, { error: { key: 'INVALID_MFA_CODE', message: 'wrong' } }));
    const { result } = await ready(f);
    expect(result.current.user).toEqual(user);
    let err: unknown;
    await act(async () => { err = await catchError(result.current.verifyMfa({ code: '000000' })); });
    expect(err).toBeInstanceOf(AuthError);
    expect((err as AuthError).info.key).toBe('INVALID_MFA_CODE');
    expect(result.current.user).toEqual(user);
  });

  it('/me 가 mfaEnabled 를 주면 user.mfaEnabled 로 보인다', async () => {
    const f = vi.fn().mockResolvedValueOnce(json(200, { user: { ...user, mfaEnabled: true } }));
    const { result } = await ready(f);
    expect(result.current.user?.mfaEnabled).toBe(true);
  });
});
