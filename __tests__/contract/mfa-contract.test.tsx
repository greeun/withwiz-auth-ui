/**
 * MFA 계약 형태 테스트 — toolkit 0.30 서버 응답 본문 ↔ auth-ui MFA 화면
 *
 * jsdom 에서는 toolkit 의 JWT 서명(대기 토큰)이 실패해 화면과 실제 처리기를 함께 돌릴 수 없다.
 * 그래서 화면 동작은 toolkit 0.30.0 응답 본문을 옮긴 고정 데이터로 두 오류 형식(legacy·standard)에서 확인하고,
 * 고정 데이터가 실제 응답과 같은 모양인지는 mfa-handlers-contract.test.ts(node 환경, 실제 처리기)가 확인한다.
 *   - respond.ts errorBody: legacy `{ success:false, error: message, code }`, standard `buildErrorBody` 봉투
 *   - mfa-pending.ts mfaRequiredResponse: header·hybrid 는 본문 최상위 `mfaToken`, cookie 는 없음
 *   - mfa.handlers.ts mfaErrorResponse: 잠금은 429 + 본문 최상위 `retryAfter`(초)
 *   - session.ts: 성공 `{ success:true, user, ...extra }`(extra 에 OAuth 출신 `redirectTo`)
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from '../../src/components/LoginForm';
import { MfaChallengeForm } from '../../src/components/MfaChallengeForm';
import { MfaSettings } from '../../src/components/MfaSettings';

type Format = 'legacy' | 'standard';

// AUTH_ERROR_CODE_MAP 의 숫자 코드
const CODES: Record<string, number> = {
  MFA_REQUIRED: 40120,
  MFA_INVALID_CODE: 40121,
  MFA_PENDING_EXPIRED: 40122,
  MFA_LOCKED: 42920,
};

/** respond.ts errorBody 와 같은 모양의 오류 본문 */
function errorBody(format: Format, key: string, message: string, description: string, extra: Record<string, unknown> = {}) {
  if (format === 'legacy') return { success: false, error: message, code: key, ...extra };
  return {
    success: false,
    error: { code: CODES[key], key, message, userMessage: { title: '오류', description }, requestId: 'req_1' },
    ...extra,
  };
}

const mfaRequired = (format: Format, extra: Record<string, unknown> = {}) =>
  errorBody(format, 'MFA_REQUIRED', 'Two-factor authentication required', '2단계 인증이 필요합니다', extra);

const response = (status: number, body: unknown) => ({ ok: status < 400, status, json: async () => body });
const mockFetch = vi.fn();
const secondBody = () => JSON.parse(mockFetch.mock.calls[1][1].body);

async function loginToSecondStep(loginBody: unknown) {
  mockFetch.mockResolvedValueOnce(response(401, loginBody));
  render(<LoginForm />);
  fireEvent.change(screen.getByLabelText(/이메일/), { target: { value: 'a@b.com' } });
  fireEvent.change(screen.getByLabelText(/비밀번호/), { target: { value: 'secret12' } });
  fireEvent.click(screen.getByRole('button', { name: '로그인' }));
  await screen.findByLabelText('인증 코드');
}

function submitCode(value = '123456') {
  fireEvent.change(screen.getByLabelText('인증 코드'), { target: { value } });
  fireEvent.click(screen.getByRole('button', { name: '확인' }));
}

beforeEach(() => {
  global.fetch = mockFetch;
  mockFetch.mockReset();
  Object.defineProperty(window, 'location', { writable: true, value: { href: '', origin: 'http://localhost' } });
});

describe.each(['legacy', 'standard'] as const)('MFA 계약 형태 (%s)', (format) => {
  it('MFA_REQUIRED(401) 이면 LoginForm 이 오류 없이 2단계로 바뀐다', async () => {
    await loginToSecondStep(mfaRequired(format));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByLabelText('인증 코드')).toBeInTheDocument();
  });

  it('header·hybrid(본문 mfaToken): 검증 요청이 POST /mfa/verify 에 { code, mfaToken } 을 보낸다', async () => {
    await loginToSecondStep(mfaRequired(format, { mfaToken: 'pending.jwt.token' }));
    mockFetch.mockResolvedValueOnce(response(200, { success: true, user: { id: 'u1', email: 'a@b.com' } }));
    submitCode();
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
    expect(mockFetch.mock.calls[1][0]).toBe('/api/auth/mfa/verify');
    expect(secondBody()).toEqual({ code: '123456', mfaToken: 'pending.jwt.token' });
  });

  it('cookie(본문에 mfaToken 없음): 검증 요청 본문에 mfaToken 키가 없다', async () => {
    await loginToSecondStep(mfaRequired(format));
    mockFetch.mockResolvedValueOnce(response(200, { success: true, user: { id: 'u1' } }));
    submitCode();
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
    expect(secondBody()).toEqual({ code: '123456' });
    expect('mfaToken' in secondBody()).toBe(false);
  });

  it('MFA_LOCKED(429) 의 retryAfter(초)가 올림한 분 문구가 되고 제출이 막힌다', async () => {
    const locked = errorBody(format, 'MFA_LOCKED', 'Too many two-factor authentication attempts', '서버 잠금 문구', { retryAfter: 601 });
    render(<MfaChallengeForm />);
    mockFetch.mockResolvedValueOnce(response(429, locked));
    submitCode();
    expect(await screen.findByRole('alert')).toHaveTextContent('11분');
    expect(screen.getByRole('button', { name: '확인' })).toBeDisabled();
  });

  it('MFA_INVALID_CODE(401) 는 입력란 오류로 보이고 입력값이 비워진다', async () => {
    render(<MfaChallengeForm />);
    mockFetch.mockResolvedValueOnce(
      response(401, errorBody(format, 'MFA_INVALID_CODE', 'Invalid MFA code', '코드가 올바르지 않습니다')),
    );
    submitCode();
    expect(await screen.findByText('코드가 올바르지 않습니다')).toBeInTheDocument();
    expect(screen.getByLabelText('인증 코드')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('인증 코드')).toHaveValue('');
  });

  it('OAuth 출신: 성공 본문 redirectTo 로 이동한다(mfa_pending 쿠키만, 본문 토큰 없음)', async () => {
    render(<MfaChallengeForm />);
    mockFetch.mockResolvedValueOnce(response(200, { success: true, user: { id: 'u1' }, redirectTo: '/apps' }));
    submitCode();
    await waitFor(() => expect(window.location.href).toBe('/apps'));
    expect('mfaToken' in secondBody0()).toBe(false);
  });

  it('MfaSettings: 상태·setup·enable 본문을 읽는다', async () => {
    const CODES10 = Array.from({ length: 10 }, (_, i) => `abcd-${String(i).padStart(4, '0')}`);
    mockFetch
      .mockResolvedValueOnce(response(200, { success: true, enabled: false, recoveryCodesRemaining: 0 }))
      .mockResolvedValueOnce(
        response(200, { success: true, secret: 'JBSWY3DPEHPK3PXP', otpauthUri: 'otpauth://totp/binder:a%40b.c?secret=JBSWY3DPEHPK3PXP&issuer=binder' }),
      )
      .mockResolvedValueOnce(response(200, { success: true, recoveryCodes: CODES10 }));
    render(<MfaSettings />);
    fireEvent.click(await screen.findByRole('button', { name: '2단계 인증 켜기' }));
    expect(await screen.findByText('JBSWY3DPEHPK3PXP')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '인증 앱으로 스캔할 QR 코드' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('인증 코드'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: '켜기' }));
    expect(await screen.findByText(CODES10[0])).toBeInTheDocument();
    expect(mockFetch.mock.calls.map((c) => c[0])).toEqual(['/api/auth/mfa', '/api/auth/mfa/setup', '/api/auth/mfa/enable']);
  });

  it('MfaSettings: 켜짐 상태 본문(남은 복구 코드)을 읽는다', async () => {
    mockFetch.mockResolvedValueOnce(response(200, { success: true, enabled: true, recoveryCodesRemaining: 7 }));
    render(<MfaSettings />);
    expect(await screen.findByText('2단계 인증이 켜져 있습니다')).toBeInTheDocument();
  });
});

/** OAuth 출신 테스트의 첫 번째(유일한) 요청 본문 */
function secondBody0() {
  return JSON.parse(mockFetch.mock.calls[0][1].body);
}
