import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MfaChallengeForm } from '../../../src/components/MfaChallengeForm';

const mockFetch = vi.fn();

const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body });
const fail = (status: number, body: unknown) => ({ ok: false, status, json: async () => body });

function typeCode(value: string, label = '인증 코드') {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}
const submitBtn = () => screen.getByRole('button', { name: '확인' });
function submit() {
  fireEvent.click(submitBtn());
}
function lastBody() {
  return JSON.parse(mockFetch.mock.calls.at(-1)![1].body);
}

beforeEach(() => {
  global.fetch = mockFetch;
  mockFetch.mockReset();
  Object.defineProperty(window, 'location', { writable: true, value: { href: '', origin: 'http://localhost' } });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('MfaChallengeForm', () => {
  it('제목·코드 입력란을 그리고 마운트 시 입력란에 포커스한다', () => {
    render(<MfaChallengeForm />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('2단계 인증');
    expect(document.activeElement).toBe(screen.getByLabelText('인증 코드'));
  });

  it('6자리를 입력해도 자동 제출하지 않는다', () => {
    render(<MfaChallengeForm />);
    typeCode('123456');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('형식이 틀리면 요청하지 않고 codeFormat 을 보인다', () => {
    render(<MfaChallengeForm />);
    typeCode('12ab');
    submit();
    expect(screen.getByText('6자리 숫자를 입력하세요')).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('성공 시 redirectAfterLogin 으로 이동한다', async () => {
    mockFetch.mockResolvedValueOnce(ok({ success: true, user: {} }));
    render(<MfaChallengeForm redirectAfterLogin="/home" />);
    typeCode('123 456');
    submit();
    await waitFor(() => expect(window.location.href).toBe('/home'));
    expect(mockFetch.mock.calls[0][0]).toBe('/api/auth/mfa/verify');
    expect(lastBody()).toEqual({ code: '123456' });
  });

  it('성공 본문의 redirectTo 로 이동한다', async () => {
    mockFetch.mockResolvedValueOnce(ok({ success: true, user: {}, redirectTo: '/apps' }));
    render(<MfaChallengeForm redirectAfterLogin="/home" />);
    typeCode('123456');
    submit();
    await waitFor(() => expect(window.location.href).toBe('/apps'));
  });

  it('다른 출처 redirectTo 는 막고 redirectAfterLogin 으로 간다', async () => {
    mockFetch.mockResolvedValueOnce(ok({ success: true, user: {}, redirectTo: 'https://evil.example/x' }));
    render(<MfaChallengeForm redirectAfterLogin="/home" />);
    typeCode('123456');
    submit();
    await waitFor(() => expect(window.location.href).toBe('/home'));
  });

  it.each([
    ['https://evil.com/phish'],
    ['javascript:alert(1)'],
    ['//evil.com'],
  ])('redirectAfterLogin 이 안전하지 않으면(%s) 서버 redirectTo 없이 / 로 간다', async (unsafe) => {
    mockFetch.mockResolvedValueOnce(ok({ success: true, user: {} }));
    render(<MfaChallengeForm redirectAfterLogin={unsafe} />);
    typeCode('123456');
    submit();
    await waitFor(() => expect(window.location.href).toBe('/'));
  });

  it('redirectAfterLogin 이 안전하지 않고 서버 redirectTo 도 다른 출처면 / 로 간다', async () => {
    mockFetch.mockResolvedValueOnce(ok({ success: true, user: {}, redirectTo: 'https://evil.example/x' }));
    render(<MfaChallengeForm redirectAfterLogin="https://evil.com" />);
    typeCode('123456');
    submit();
    await waitFor(() => expect(window.location.href).toBe('/'));
  });

  it('onSuccess 가 경로를 돌려주면 그 경로가 우선한다', async () => {
    mockFetch.mockResolvedValueOnce(ok({ success: true, user: {}, redirectTo: '/apps' }));
    render(<MfaChallengeForm redirectAfterLogin="/home" hooks={{ onSuccess: async () => '/custom' }} />);
    typeCode('123456');
    submit();
    await waitFor(() => expect(window.location.href).toBe('/custom'));
  });

  it('onSuccess 가 던지면 이동하지 않고 메시지를 보인다', async () => {
    mockFetch.mockResolvedValueOnce(ok({ success: true, user: {} }));
    render(<MfaChallengeForm hooks={{ onSuccess: async () => { throw new Error('막힘'); } }} />);
    typeCode('123456');
    submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('막힘');
    expect(window.location.href).toBe('');
  });

  it('onBeforeSubmit 이 false 면 요청하지 않는다, 인자는 { method }', async () => {
    const onBeforeSubmit = vi.fn().mockResolvedValue(false);
    render(<MfaChallengeForm hooks={{ onBeforeSubmit }} />);
    typeCode('123456');
    submit();
    await waitFor(() => expect(onBeforeSubmit).toHaveBeenCalledWith({ method: 'code' }));
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('mfaToken prop 을 요청 본문에 싣는다', async () => {
    mockFetch.mockResolvedValueOnce(ok({ success: true, user: {} }));
    render(<MfaChallengeForm mfaToken="tok-1" />);
    typeCode('123456');
    submit();
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    expect(lastBody()).toEqual({ code: '123456', mfaToken: 'tok-1' });
  });

  it('mfaToken 이 없으면 본문에 mfaToken 키가 없다', async () => {
    mockFetch.mockResolvedValueOnce(ok({ success: true, user: {} }));
    render(<MfaChallengeForm />);
    typeCode('123456');
    submit();
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    expect('mfaToken' in lastBody()).toBe(false);
  });

  it('MFA_INVALID_CODE: invalidCode 를 보이고 입력을 비우며 다시 제출할 수 있다', async () => {
    mockFetch.mockResolvedValueOnce(fail(401, { error: { key: 'MFA_INVALID_CODE', message: 'x' } }));
    render(<MfaChallengeForm />);
    typeCode('123456');
    submit();
    expect(await screen.findByText('코드가 올바르지 않습니다')).toBeInTheDocument();
    expect(screen.getByLabelText('인증 코드')).toHaveValue('');
    expect(document.activeElement).toBe(screen.getByLabelText('인증 코드'));
    expect(screen.getByLabelText('인증 코드')).toHaveAttribute('aria-invalid', 'true');
    expect(submitBtn()).not.toBeDisabled();
  });

  it('MFA_PENDING_EXPIRED: expired 를 보이고 제출 비활성, 처음부터 다시가 버튼 모양(wiz-auth-submit)', async () => {
    mockFetch.mockResolvedValueOnce(fail(401, { error: { key: 'MFA_PENDING_EXPIRED', message: 'x' } }));
    render(<MfaChallengeForm />);
    typeCode('123456');
    submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('인증 시간이 지났습니다. 다시 로그인하세요');
    expect(submitBtn()).toBeDisabled();
    expect(screen.getByRole('link', { name: '처음부터 다시' })).toHaveClass('wiz-auth-submit');
  });

  it('MFA_LOCKED + retryAfter 600: "10분" 문구, 제출 비활성', async () => {
    mockFetch.mockResolvedValueOnce(fail(429, { error: { key: 'MFA_LOCKED', message: 'x' }, retryAfter: 600 }));
    render(<MfaChallengeForm />);
    typeCode('123456');
    submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('10분');
    expect(submitBtn()).toBeDisabled();
  });

  it('MFA_LOCKED, retryAfter 없음: 서버 문구, 제출 비활성', async () => {
    mockFetch.mockResolvedValueOnce(fail(429, { error: { key: 'MFA_LOCKED', userMessage: { description: '서버 잠금 문구' } } }));
    render(<MfaChallengeForm />);
    typeCode('123456');
    submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('서버 잠금 문구');
    expect(screen.getByRole('alert')).not.toHaveTextContent('분');
    expect(submitBtn()).toBeDisabled();
  });

  it('복구 코드로 전환하면 라벨이 바뀌고 { recoveryCode } 로 보낸다, method 는 recoveryCode', async () => {
    mockFetch.mockResolvedValueOnce(ok({ success: true, user: {} }));
    const onBeforeSubmit = vi.fn().mockResolvedValue(true);
    render(<MfaChallengeForm hooks={{ onBeforeSubmit }} />);
    fireEvent.click(screen.getByRole('button', { name: '복구 코드로 로그인' }));
    expect(document.activeElement).toBe(screen.getByLabelText('복구 코드'));
    typeCode(' ABCD-1234 ', '복구 코드');
    submit();
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    expect(lastBody()).toEqual({ recoveryCode: 'ABCD-1234' });
    expect(onBeforeSubmit).toHaveBeenCalledWith({ method: 'recoveryCode' });
  });

  it('onRestart 가 있으면 처음부터 다시가 콜백을 부르고, 없으면 loginUrl 링크', () => {
    const onRestart = vi.fn();
    const { unmount } = render(<MfaChallengeForm onRestart={onRestart} />);
    fireEvent.click(screen.getByRole('button', { name: '처음부터 다시' }));
    expect(onRestart).toHaveBeenCalledTimes(1);
    unmount();
    render(<MfaChallengeForm />);
    expect(screen.getByRole('link', { name: '처음부터 다시' })).toHaveAttribute('href', '/login');
  });

  it('hooks.onError 는 (text, info) 로 불린다', async () => {
    mockFetch.mockResolvedValueOnce(fail(401, { error: { key: 'MFA_INVALID_CODE', message: 'x' } }));
    const onError = vi.fn();
    render(<MfaChallengeForm hooks={{ onError }} />);
    typeCode('123456');
    submit();
    await waitFor(() => expect(onError).toHaveBeenCalled());
    expect(onError).toHaveBeenCalledWith('코드가 올바르지 않습니다', expect.objectContaining({ key: 'MFA_INVALID_CODE' }));
  });

  it('JSON 이 아닌 2xx 응답은 폼 오류로 보인다', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => { throw new Error('html'); } });
    render(<MfaChallengeForm />);
    typeCode('123456');
    submit();
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(window.location.href).toBe('');
  });

  it('unstyled 이면 wiz-auth-* 클래스가 없다', () => {
    const { container } = render(<MfaChallengeForm unstyled />);
    expect(container.innerHTML).not.toContain('wiz-auth-');
  });
});
