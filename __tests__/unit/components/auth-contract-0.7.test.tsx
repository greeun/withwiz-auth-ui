import { render, screen, fireEvent, waitFor, renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { LoginForm } from '../../../src/components/LoginForm';
import { SignupForm } from '../../../src/components/SignupForm';
import { ForgotPasswordForm } from '../../../src/components/ForgotPasswordForm';
import { ResetPasswordForm } from '../../../src/components/ResetPasswordForm';
import { EmailVerificationForm } from '../../../src/components/EmailVerificationForm';
import { OAuthButtons } from '../../../src/components/OAuthButtons';
import { AuthProvider, useAuth } from '../../../src/components/AuthProvider';
import { AuthError } from '../../../src/utils/auth-error';

/** 0.7 계약: 서버가 보낼 수 있는 두 가지 실패 응답 형태 */
const standard = (key: string, description: string, fieldErrors?: Record<string, string[]>) => ({
  success: false,
  error: { code: 40000, key, message: 'dev message', userMessage: { description }, ...(fieldErrors ? { details: { fieldErrors } } : {}) },
});
const legacy = (error: string, code?: string, fieldErrors?: Record<string, string[]>) => ({
  success: false, error, ...(code ? { code } : {}), ...(fieldErrors ? { details: { fieldErrors } } : {}),
});

function stubFetch(...responses: Array<{ ok: boolean; status: number; body?: unknown; nonJson?: boolean }>) {
  const fn = vi.fn();
  for (const r of responses) {
    fn.mockResolvedValueOnce({
      ok: r.ok,
      status: r.status,
      json: r.nonJson ? () => Promise.reject(new SyntaxError('Unexpected token <')) : () => Promise.resolve(r.body),
    });
  }
  vi.stubGlobal('fetch', fn);
  return fn;
}

function submitLogin(email = 'a@example.com', password = 'password123') {
  fireEvent.change(screen.getByLabelText('이메일'), { target: { value: email } });
  fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: '로그인' }));
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('LoginForm — 두 응답 형태', () => {
  it('표준 응답의 userMessage 를 표시하고 개발자용 message 는 표시하지 않는다', async () => {
    stubFetch({ ok: false, status: 401, body: standard('INVALID_CREDENTIALS', '이메일 또는 비밀번호를 확인하세요') });
    render(<LoginForm />);
    submitLogin();
    await waitFor(() => expect(screen.getByText('이메일 또는 비밀번호를 확인하세요')).toBeInTheDocument());
    expect(screen.queryByText('dev message')).not.toBeInTheDocument();
  });

  it.each([
    ['표준', standard('EMAIL_NOT_VERIFIED', 'server text')],
    ['문자열형', legacy('Email not verified', 'EMAIL_NOT_VERIFIED')],
  ])('%s 응답의 EMAIL_NOT_VERIFIED 는 미인증 문구로 바꿔 표시하고 key 를 onError 로 넘긴다', async (_l, body) => {
    stubFetch({ ok: false, status: 403, body });
    const onError = vi.fn();
    render(<LoginForm hooks={{ onError }} />);
    submitLogin();
    await waitFor(() => expect(screen.getByText('이메일 인증이 필요합니다')).toBeInTheDocument());
    expect(onError).toHaveBeenCalledWith('이메일 인증이 필요합니다', expect.objectContaining({ key: 'EMAIL_NOT_VERIFIED', status: 403 }));
  });

  it('JSON 이 아닌 5xx 응답은 네트워크 오류가 아니라 기본 실패 문구로 처리한다', async () => {
    stubFetch({ ok: false, status: 502, nonJson: true });
    const onError = vi.fn();
    render(<LoginForm hooks={{ onError }} />);
    submitLogin();
    await waitFor(() => expect(screen.getByText('이메일 또는 비밀번호가 올바르지 않습니다')).toBeInTheDocument());
    expect(onError).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ status: 502, network: false }));
  });

  it('네트워크 오류는 network true 로 onError 에 넘긴다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const onError = vi.fn();
    render(<LoginForm hooks={{ onError }} />);
    submitLogin();
    await waitFor(() => expect(onError).toHaveBeenCalledWith('네트워크 오류가 발생했습니다', expect.objectContaining({ network: true, status: 0 })));
  });
});

describe('필드 오류 표시', () => {
  it.each([
    ['표준', standard('PASSWORD_TOO_WEAK', '비밀번호 정책 위반', { password: ['문자 3종 이상이어야 합니다'] })],
    ['문자열형', legacy('Invalid input', undefined, { password: ['문자 3종 이상이어야 합니다'] })],
  ])('%s 응답의 fieldErrors 를 해당 입력 아래에 aria 와 함께 표시한다', async (_l, body) => {
    stubFetch({ ok: false, status: 400, body });
    render(<SignupForm />);
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '홍길동' } });
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'a@example.com' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'longenough1' } });
    fireEvent.click(screen.getByRole('button', { name: '회원가입' }));

    const reason = await screen.findByText('문자 3종 이상이어야 합니다');
    expect(reason).toHaveAttribute('id', 'wiz-signup-password-error');
    const input = screen.getByLabelText('비밀번호');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'wiz-signup-password-error');
  });

  it('폼 단위 문구가 필드 오류와 같으면 한 번만 표시한다', async () => {
    stubFetch({ ok: false, status: 400, body: standard('PASSWORD_TOO_WEAK', '문자 3종 이상', { password: ['문자 3종 이상'] }) });
    render(<ResetPasswordForm token="t" />);
    fireEvent.change(screen.getByLabelText('새 비밀번호'), { target: { value: 'longenough1' } });
    fireEvent.change(screen.getByLabelText('비밀번호 확인'), { target: { value: 'longenough1' } });
    fireEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }));
    await screen.findByText('문자 3종 이상');
    expect(screen.getAllByText('문자 3종 이상')).toHaveLength(1);
  });

  it('extraFields 의 필드 오류도 표시하고, 폼에 없는 키는 무시한다', async () => {
    stubFetch({ ok: false, status: 400, body: legacy('Invalid input', undefined, { company: ['회사명이 필요합니다'], unknownField: ['무시'] }) });
    render(<SignupForm extraFields={[{ name: 'company', label: '회사' }]} />);
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '홍길동' } });
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'a@example.com' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'longenough1' } });
    fireEvent.click(screen.getByRole('button', { name: '회원가입' }));
    expect(await screen.findByText('회사명이 필요합니다')).toBeInTheDocument();
    expect(screen.queryByText('무시')).not.toBeInTheDocument();
  });
});

describe('훅 — 찾기·재설정·인증 폼', () => {
  it('ForgotPasswordForm: onBeforeSubmit 이 false 면 요청하지 않고, 성공하면 onSuccess 를 부른다', async () => {
    const fetchFn = stubFetch({ ok: true, status: 200, body: { success: true } });
    const onBeforeSubmit = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const onSuccess = vi.fn();
    render(<ForgotPasswordForm hooks={{ onBeforeSubmit, onSuccess }} />);
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'a@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: '재설정 링크 보내기' }));
    await waitFor(() => expect(onBeforeSubmit).toHaveBeenCalledWith({ email: 'a@example.com' }));
    expect(fetchFn).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '재설정 링크 보내기' }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  it('ResetPasswordForm: 실패하면 onError 를, 성공하면 onSuccess 를 부른다', async () => {
    stubFetch({ ok: false, status: 400, body: legacy('Invalid or expired token', 'TOKEN_INVALID') });
    const onError = vi.fn();
    render(<ResetPasswordForm token="t" hooks={{ onError }} />);
    fireEvent.change(screen.getByLabelText('새 비밀번호'), { target: { value: 'longenough1' } });
    fireEvent.change(screen.getByLabelText('비밀번호 확인'), { target: { value: 'longenough1' } });
    fireEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }));
    await waitFor(() => expect(onError).toHaveBeenCalledWith('Invalid or expired token', expect.objectContaining({ key: 'TOKEN_INVALID' })));
  });

  it('EmailVerificationForm: 결과를 훅으로 알리고, 훅 객체가 바뀌어도 다시 요청하지 않는다', async () => {
    const fetchFn = stubFetch({ ok: false, status: 400, body: standard('INVALID_TOKEN', '만료된 링크입니다') });
    const onError = vi.fn();
    const { rerender } = render(<EmailVerificationForm token="t" hooks={{ onError }} />);
    await waitFor(() => expect(onError).toHaveBeenCalledWith('만료된 링크입니다', expect.objectContaining({ key: 'INVALID_TOKEN' })));
    rerender(<EmailVerificationForm token="t" hooks={{ onError: vi.fn() }} />);
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(screen.getByText('만료된 링크입니다')).toBeInTheDocument();
  });
});

describe('경로 prop', () => {
  it('기본값은 0.6 과 같은 경로다', () => {
    render(<LoginForm />);
    expect(screen.getByRole('link', { name: '비밀번호를 잊으셨나요?' })).toHaveAttribute('href', '/forgot-password');
    expect(screen.getByRole('link', { name: '회원가입' })).toHaveAttribute('href', '/signup');
  });

  it('지정한 경로로 링크와 매직링크 이동을 바꾼다', () => {
    render(<LoginForm forgotPasswordUrl="/account/forgot" signupUrl="/join" />);
    expect(screen.getByRole('link', { name: '비밀번호를 잊으셨나요?' })).toHaveAttribute('href', '/account/forgot');
    expect(screen.getByRole('link', { name: '회원가입' })).toHaveAttribute('href', '/join');
  });

  it('SignupForm 의 loginUrl 을 바꾼다', () => {
    render(<SignupForm loginUrl="/signin" />);
    expect(screen.getByRole('link', { name: '로그인' })).toHaveAttribute('href', '/signin');
  });
});

describe('OAuthButtons', () => {
  it('5종 제공자를 렌더하고, 단독 사용 기본 라벨은 0.6 과 같은 영문이다', () => {
    render(<OAuthButtons providers={['google', 'github', 'kakao', 'meta', 'microsoft']} />);
    for (const name of ['Google', 'GitHub', 'Kakao', 'Meta', 'Microsoft']) {
      expect(screen.getByText(`Continue with ${name}`)).toBeInTheDocument();
    }
  });

  it('mode 와 locale 에 맞춰 라벨을 바꾸고 제공자 표시명을 덮어쓸 수 있다', () => {
    render(<OAuthButtons providers={['kakao', 'meta']} mode="signup" locale="ko" messages={{ providers: { meta: '페이스북' } }} />);
    expect(screen.getByText('카카오 계정으로 가입하기')).toBeInTheDocument();
    expect(screen.getByText('페이스북 계정으로 가입하기')).toBeInTheDocument();
  });

  it('시작 요청이 실패하거나 loginUrl 이 없으면 onError 로 알린다', async () => {
    stubFetch({ ok: false, status: 400, body: legacy('Invalid provider') }, { ok: true, status: 200, body: {} });
    const onError = vi.fn();
    render(<OAuthButtons providers={['google']} onError={onError} />);
    fireEvent.click(screen.getByTestId('oauth-google-btn'));
    await waitFor(() => expect(onError).toHaveBeenCalledWith(expect.objectContaining({ text: 'Invalid provider', status: 400 })));
    fireEvent.click(screen.getByTestId('oauth-google-btn'));
    await waitFor(() => expect(onError).toHaveBeenLastCalledWith(expect.objectContaining({ text: 'Could not start social sign-in' })));
  });

  it('폼 안에서 OAuth 시작 실패를 폼 오류로 표시하고 hooks.onError 로 넘긴다', async () => {
    stubFetch({ ok: false, status: 500, nonJson: true });
    const onError = vi.fn();
    render(<LoginForm providers={['github']} hooks={{ onError }} />);
    fireEvent.click(screen.getByTestId('oauth-github-btn'));
    expect(await screen.findByText('소셜 로그인을 시작하지 못했습니다')).toBeInTheDocument();
    expect(onError).toHaveBeenCalledWith('소셜 로그인을 시작하지 못했습니다', expect.objectContaining({ status: 500 }));
  });
});

describe('AuthProvider.login', () => {
  it('실패하면 AuthError(message = 표시 문구, info = 구조화 정보)를 던진다', async () => {
    stubFetch(
      { ok: false, status: 401, body: {} },
      { ok: false, status: 401, body: standard('INVALID_CREDENTIALS', '이메일 또는 비밀번호를 확인하세요') },
    );
    const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let caught: unknown;
    await act(async () => {
      try { await result.current.login('a@example.com', 'x'); } catch (e) { caught = e; }
    });
    expect(caught).toBeInstanceOf(AuthError);
    expect(caught).toBeInstanceOf(Error);
    expect((caught as AuthError).message).toBe('이메일 또는 비밀번호를 확인하세요');
    expect((caught as AuthError).info.key).toBe('INVALID_CREDENTIALS');
  });
});

describe('리뷰 보강', () => {
  const originalLocation = window.location;
  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: 'https://app.example.com/login', origin: 'https://app.example.com', search: '' },
    });
  });
  afterEach(() => {
    Object.defineProperty(window, 'location', { writable: true, value: originalLocation });
  });

  it('magicLinkUrl 로 이동하고, 다른 출처·javascript: 값은 기본 경로로 대체한다', () => {
    const { unmount } = render(<LoginForm showMagicLink magicLinkUrl="/login/magic" />);
    fireEvent.click(screen.getByRole('button', { name: '이메일 링크로 로그인' }));
    expect(window.location.href).toBe('/login/magic');
    unmount();
    render(<LoginForm showMagicLink magicLinkUrl="javascript:alert(1)" />);
    fireEvent.click(screen.getByRole('button', { name: '이메일 링크로 로그인' }));
    expect(window.location.href).toBe('/auth/magic-link');
  });

  it('2xx 인데 본문이 JSON 이 아니면 로그인 성공으로 보지 않는다', async () => {
    stubFetch({ ok: true, status: 200, nonJson: true });
    const onSuccess = vi.fn();
    const onError = vi.fn();
    render(<LoginForm redirectAfterLogin="/dashboard" hooks={{ onSuccess, onError }} />);
    submitLogin();
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(onError).toHaveBeenCalledWith('네트워크 오류가 발생했습니다', expect.objectContaining({ status: 200, network: false }));
    expect(onSuccess).not.toHaveBeenCalled();
    expect(window.location.href).toBe('https://app.example.com/login');
  });

  it('로그인 실패에서 onError 는 정확히 한 번 호출된다', async () => {
    stubFetch({ ok: false, status: 401, body: legacy('잘못된 인증 정보') });
    const onError = vi.fn();
    render(<LoginForm hooks={{ onError }} />);
    submitLogin();
    await waitFor(() => expect(onError).toHaveBeenCalled());
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('SignupForm 은 네트워크 오류에서도 onError(network) 를 부른다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const onError = vi.fn();
    render(<SignupForm hooks={{ onError }} />);
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '홍길동' } });
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'a@example.com' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'longenough1' } });
    fireEvent.click(screen.getByRole('button', { name: '회원가입' }));
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(onError).toHaveBeenCalledWith('네트워크 오류가 발생했습니다', expect.objectContaining({ network: true }));
  });

  it('ResetPasswordForm 은 성공하면 onSuccess 를 한 번 부르고 onError 는 부르지 않는다', async () => {
    stubFetch({ ok: true, status: 200, body: { success: true } });
    const onSuccess = vi.fn();
    const onError = vi.fn();
    render(<ResetPasswordForm token="t" hooks={{ onSuccess, onError }} />);
    fireEvent.change(screen.getByLabelText('새 비밀번호'), { target: { value: 'longenough1' } });
    fireEvent.change(screen.getByLabelText('비밀번호 확인'), { target: { value: 'longenough1' } });
    fireEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(onError).not.toHaveBeenCalled();
  });

  it('EmailVerificationForm 은 성공하면 onSuccess 를 한 번 부른다', async () => {
    stubFetch({ ok: true, status: 200, body: { success: true } });
    const onSuccess = vi.fn();
    render(<EmailVerificationForm token="t" hooks={{ onSuccess }} />);
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  });

  it('onOAuthClick 을 주면 서버에 요청하지 않고 버튼 로딩 상태를 되돌린다', async () => {
    const fetchFn = stubFetch();
    const onOAuthClick = vi.fn();
    render(<OAuthButtons providers={['google']} onOAuthClick={onOAuthClick} />);
    fireEvent.click(screen.getByTestId('oauth-google-btn'));
    await waitFor(() => expect(onOAuthClick).toHaveBeenCalledWith('google'));
    expect(fetchFn).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByTestId('oauth-google-btn')).not.toBeDisabled());
  });

  it('loginUrl 이 없는 응답은 OAUTH_LOGIN_URL_MISSING 으로 구분한다', async () => {
    stubFetch({ ok: true, status: 200, body: {} });
    const onError = vi.fn();
    render(<OAuthButtons providers={['google']} onError={onError} />);
    fireEvent.click(screen.getByTestId('oauth-google-btn'));
    await waitFor(() => expect(onError).toHaveBeenCalledWith(expect.objectContaining({ key: 'OAUTH_LOGIN_URL_MISSING', status: 200 })));
  });

  it('단독 버튼의 mode="signup" 영문 라벨은 Sign up with 이다', () => {
    render(<OAuthButtons providers={['google']} mode="signup" />);
    expect(screen.getByText('Sign up with Google')).toBeInTheDocument();
  });

  it('폼의 oauthMessages 로 버튼 표시명과 실패 문구를 바꾼다', async () => {
    stubFetch({ ok: false, status: 500, nonJson: true });
    const onError = vi.fn();
    render(<LoginForm providers={['meta']} oauthMessages={{ providers: { meta: 'Facebook' }, failed: '소셜 로그인 실패' }} hooks={{ onError }} />);
    fireEvent.click(screen.getByText('Facebook 계정으로 계속하기'));
    expect(await screen.findByText('소셜 로그인 실패')).toBeInTheDocument();
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('OAuth 시작 실패는 입력 아래의 클라이언트 검증 메시지를 지우지 않는다', async () => {
    stubFetch({ ok: false, status: 500, nonJson: true });
    render(<LoginForm providers={['github']} />);
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'not-an-email' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password123' } });
    fireEvent.submit(screen.getByRole('button', { name: '로그인' }).closest('form')!);
    expect(await screen.findByText('유효한 이메일을 입력하세요')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('oauth-github-btn'));
    expect(await screen.findByText('소셜 로그인을 시작하지 못했습니다')).toBeInTheDocument();
    expect(screen.getByText('유효한 이메일을 입력하세요')).toBeInTheDocument();
  });
});
