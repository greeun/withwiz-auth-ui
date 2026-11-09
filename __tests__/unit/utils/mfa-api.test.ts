import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  verifyMfa, getMfaStatus, setupMfa, enableMfa, disableMfa, regenerateRecoveryCodes,
} from '../../../src/utils/mfa-api';

const texts = { fallback: '실패', network: '네트워크' };
const mockFetch = vi.fn();
const json = (status: number, body: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});
const sentBody = () => JSON.parse(mockFetch.mock.calls[0][1].body);

describe('mfa-api', () => {
  beforeEach(() => {
    global.fetch = mockFetch as unknown as typeof fetch;
    mockFetch.mockReset();
  });

  it('verifyMfa: mfaToken 이 없으면 본문에 mfaToken 키를 넣지 않는다', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { success: true, user: { id: 'u1' } }));
    await verifyMfa('/api/auth', { code: '123456' }, texts);
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/mfa/verify', expect.objectContaining({ method: 'POST', credentials: 'include' }));
    expect(sentBody()).toEqual({ code: '123456' });
    expect('mfaToken' in sentBody()).toBe(false);
  });

  it('verifyMfa: mfaToken 을 주면 본문에 싣는다', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { success: true, user: { id: 'u1' } }));
    await verifyMfa('/api/auth', { recoveryCode: 'abcd-1234' }, texts, { mfaToken: 'tok' });
    expect(sentBody()).toEqual({ recoveryCode: 'abcd-1234', mfaToken: 'tok' });
  });

  it('verifyMfa: 성공 본문의 redirectTo 를 읽는다(평면형·봉투형)', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { success: true, user: { id: 'u1' }, redirectTo: '/apps' }));
    const a = await verifyMfa('/api/auth', { code: '123456' }, texts);
    expect(a.ok && a.data.redirectTo).toBe('/apps');
    mockFetch.mockResolvedValueOnce(json(200, { success: true, data: { user: { id: 'u1' }, redirectTo: '/apps' } }));
    const b = await verifyMfa('/api/auth', { code: '123456' }, texts);
    expect(b.ok && b.data.redirectTo).toBe('/apps');
  });

  it('verifyMfa: 429 MFA_LOCKED 의 retryAfter 를 error 에 담는다', async () => {
    mockFetch.mockResolvedValueOnce(json(429, {
      success: false,
      error: { code: 40199, key: 'MFA_LOCKED', message: 'x', userMessage: { description: '잠김' } },
      retryAfter: 600,
    }));
    const r = await verifyMfa('/api/auth', { code: '123456' }, texts);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatchObject({ key: 'MFA_LOCKED', retryAfter: 600, status: 429, text: '잠김' });
  });

  it('네트워크 실패는 network:true, text 는 texts.network', async () => {
    mockFetch.mockRejectedValueOnce(new Error('down'));
    const r = await getMfaStatus('/api/auth', texts);
    expect(r).toEqual({ ok: false, error: expect.objectContaining({ network: true, text: '네트워크', status: 0 }) });
  });

  it('2xx 인데 본문이 JSON 이 아니면 실패로 본다', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => { throw new Error('html'); } });
    const r = await verifyMfa('/api/auth', { code: '123456' }, texts);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.status).toBe(200);
  });

  it('getMfaStatus: { success, enabled, recoveryCodesRemaining } 을 MfaStatus 로', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { success: true, enabled: true, recoveryCodesRemaining: 7 }));
    const r = await getMfaStatus('/api/auth', texts);
    expect(r.ok && r.data).toEqual({ enabled: true, recoveryCodesRemaining: 7 });
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/mfa', expect.objectContaining({ method: 'GET' }));
  });

  it('getMfaStatus: 404 MFA_NOT_CONFIGURED 는 error.key 로 구분된다', async () => {
    mockFetch.mockResolvedValueOnce(json(404, { success: false, error: { code: 40499, key: 'MFA_NOT_CONFIGURED', message: 'x' } }));
    const r = await getMfaStatus('/api/auth', texts);
    expect(!r.ok && r.error.key).toBe('MFA_NOT_CONFIGURED');
  });

  it('getMfaStatus: 형태가 어긋나면 실패', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { success: true, enabled: 'yes' }));
    const r = await getMfaStatus('/api/auth', texts);
    expect(!r.ok && r.error.text).toBe('실패');
  });

  it('setupMfa: secret·otpauthUri 를 읽는다', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { success: true, secret: 'S', otpauthUri: 'otpauth://x' }));
    const r = await setupMfa('/api/auth', texts);
    expect(r.ok && r.data).toEqual({ secret: 'S', otpauthUri: 'otpauth://x' });
    expect(mockFetch.mock.calls[0][0]).toBe('/api/auth/mfa/setup');
  });

  it('setupMfa: secret·otpauthUri 가 문자열이 아니면 실패(text=fallback)', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { success: true, secret: 1, otpauthUri: 'x' }));
    const r = await setupMfa('/api/auth', texts);
    expect(!r.ok && r.error.text).toBe('실패');
  });

  it('enableMfa·regenerateRecoveryCodes: 코드를 보내고 recoveryCodes 를 읽는다', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { success: true, recoveryCodes: ['a', 'b'] }));
    const a = await enableMfa('/api/auth', '123456', texts);
    expect(a.ok && a.data.recoveryCodes).toEqual(['a', 'b']);
    expect(mockFetch.mock.calls[0][0]).toBe('/api/auth/mfa/enable');
    expect(sentBody()).toEqual({ code: '123456' });
    mockFetch.mockResolvedValueOnce(json(200, { success: true, recoveryCodes: ['c'] }));
    const b = await regenerateRecoveryCodes('/api/auth', '654321', texts);
    expect(b.ok && b.data.recoveryCodes).toEqual(['c']);
    expect(mockFetch.mock.calls[1][0]).toBe('/api/auth/mfa/recovery-codes');
  });

  it('enableMfa·regenerateRecoveryCodes: recoveryCodes 가 문자열 배열이 아니면 실패', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { success: true, recoveryCodes: ['a', 1] }));
    expect((await enableMfa('/api/auth', '123456', texts)).ok).toBe(false);
    mockFetch.mockResolvedValueOnce(json(200, { success: true }));
    expect((await regenerateRecoveryCodes('/api/auth', '123456', texts)).ok).toBe(false);
  });

  it('disableMfa: { recoveryCode } 를 그대로 보낸다', async () => {
    mockFetch.mockResolvedValueOnce(json(200, { success: true }));
    const r = await disableMfa('/api/auth', { recoveryCode: 'abcd-1234' }, texts);
    expect(r).toMatchObject({ ok: true, data: null });
    expect(mockFetch.mock.calls[0][0]).toBe('/api/auth/mfa/disable');
    expect(sentBody()).toEqual({ recoveryCode: 'abcd-1234' });
  });
});
