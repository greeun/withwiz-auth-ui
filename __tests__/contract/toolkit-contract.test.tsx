/**
 * 계약 테스트 — 실제 @withwiz/toolkit 인증 핸들러 ↔ auth-ui 폼
 *
 * 양쪽 단위 테스트가 각자 통과해도 둘 사이의 계약(경로·요청 본문·오류 응답 형태)이 어긋나면
 * 사용자는 가입·재설정을 끝내지 못한다. 여기서는 폼의 fetch 를 실제 toolkit 핸들러로 보내고,
 * 저장소만 메모리 구현으로 바꿔 두 오류 형식(legacy·standard) 모두에서 화면 결과를 확인한다.
 *
 * toolkit 은 테스트 전용 devDependency 다 — 패키지 런타임 의존성은 늘지 않는다.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { createAuthHandlers } from '@withwiz/toolkit/next/auth-handlers';
import { TokenGenerator } from '@withwiz/toolkit/core/auth/email/token-generator';
import type { AuthHandlerOptions } from '@withwiz/toolkit/next/auth-types/handler-types';
import { LoginForm } from '../../src/components/LoginForm';
import { SignupForm } from '../../src/components/SignupForm';
import { ResetPasswordForm } from '../../src/components/ResetPasswordForm';
import { EmailVerificationForm } from '../../src/components/EmailVerificationForm';

type Row = { id: string; email: string; token: string; type: string; expires: Date; used: boolean; createdAt: Date };

function createBackend(overrides: Partial<AuthHandlerOptions> = {}) {
  const users = new Map<string, any>();
  const tokens: Row[] = [];
  const sent = { verification: new Map<string, string>(), reset: new Map<string, string>() };
  let seq = 0;

  const options: AuthHandlerOptions = {
    dependencies: {
      userRepository: {
        findById: async (id) => [...users.values()].find((u) => u.id === id) ?? null,
        findByEmail: async (email) => users.get(email) ?? null,
        create: async (data: any) => {
          const user = { id: `u${++seq}`, role: 'user', isActive: true, ...data };
          users.set(data.email, user);
          return user;
        },
        update: async (id, data: any) => {
          const user = [...users.values()].find((u) => u.id === id);
          Object.assign(user, data);
          return user;
        },
        delete: async () => {},
        updateLastLoginAt: async () => {},
        verifyEmail: async (email) => { users.get(email).emailVerified = new Date(); },
      },
      oauthAccountRepository: {
        findByProvider: async () => null, findByUserId: async () => [], create: async (d: any) => d,
        update: async (_id: string, d: any) => d, delete: async () => {},
      } as any,
      emailTokenRepository: {
        create: async (email, token, type, expires) => {
          const row = { id: `t${++seq}`, email, token, type, expires, used: false, createdAt: new Date() };
          tokens.push(row);
          return row as any;
        },
        findByEmailAndToken: async (email, token, type) =>
          (tokens.find((t) => t.email === email && t.token === token && t.type === type) as any) ?? null,
        delete: async (email, token, type) => {
          const i = tokens.findIndex((t) => t.email === email && t.token === token && t.type === type);
          if (i >= 0) tokens.splice(i, 1);
        },
        deleteExpired: async () => {},
        markAsUsed: async () => {},
        findEmailByToken: async (hashed, type) => tokens.find((t) => t.token === hashed && t.type === type)?.email ?? null,
      },
      emailSender: {
        sendVerificationEmail: async (email, token) => { sent.verification.set(email, token); },
        sendPasswordResetEmail: async (email, token) => { sent.reset.set(email, token); },
        sendMagicLinkEmail: async () => {},
        sendWelcomeEmail: async () => {},
      },
    },
    jwt: { secret: 'x'.repeat(40) },
    urls: { baseUrl: 'http://localhost' },
    features: { emailVerificationRequired: false },
    ...overrides,
  };
  const handlers = createAuthHandlers(options);
  const routes: Record<string, (req: any) => Promise<Response>> = {
    login: handlers.login,
    signup: handlers.signup,
    'forgot-password': handlers.forgotPassword,
    'reset-password': handlers.resetPassword,
    'verify-email': handlers.verifyEmail,
    'oauth/login': handlers.oauthAuthorize,
  };

  const fetchImpl = vi.fn(async (input: string, init?: RequestInit) => {
    const url = new URL(input, 'http://localhost');
    const route = routes[url.pathname.replace(/^\/api\/auth\//, '')];
    if (!route) return new Response('{"success":false,"error":"Not found"}', { status: 404 });
    return route(new Request(url, init));
  });
  vi.stubGlobal('fetch', fetchImpl);

  return { options, users, tokens, sent, handlers, fetchImpl };
}

const originalLocation = window.location;
beforeEach(() => {
  Object.defineProperty(window, 'location', {
    writable: true,
    value: { href: 'http://localhost/login', origin: 'http://localhost', search: '' },
  });
});
afterEach(() => {
  Object.defineProperty(window, 'location', { writable: true, value: originalLocation });
  vi.unstubAllGlobals();
});

function fillSignup(email: string, password: string) {
  fireEvent.change(screen.getByLabelText('이름'), { target: { value: '홍길동' } });
  fireEvent.change(screen.getByLabelText('이메일'), { target: { value: email } });
  fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: '회원가입' }));
}

function fillLogin(email: string, password: string) {
  fireEvent.change(screen.getByLabelText('이메일'), { target: { value: email } });
  fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: '로그인' }));
}

describe.each(['legacy', 'standard'] as const)('toolkit 계약 — errorFormat %s', (errorFormat) => {
  // 세션 쿠키 발급은 toolkit 의 책임이고 toolkit 테스트가 검증한다. jsdom 에서는 JWT 서명이 실패해
  // signup 이 설계대로 "세션 없는 가입 성공(201)"으로 폴백한다 — 폼이 받는 응답은 같으므로 여기서는
  // 폼이 201 을 성공으로 처리하는지만 본다.
  it('가입 응답(201)을 성공으로 처리해 성공 화면을 보여 준다', async () => {
    const backend = createBackend({ errorFormat });
    const onSuccess = vi.fn();
    render(<SignupForm hooks={{ onSuccess }} />);
    fillSignup('new@example.com', 'password123');
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ email: 'new@example.com' })), { timeout: 10000 });
    expect(backend.users.get('new@example.com')).toBeDefined();
    const response: Response = await backend.fetchImpl.mock.results[0].value;
    expect(response.status).toBe(201);
    expect(await screen.findByText('가입 완료!')).toBeInTheDocument();
  });

  it('비밀번호 정책 위반 사유가 비밀번호 입력 아래에 표시된다', async () => {
    createBackend({
      errorFormat,
      passwordPolicy: (password) => (/[A-Z]/.test(password) ? { ok: true } : { ok: false, message: '대문자를 포함해야 합니다' }),
    });
    const onError = vi.fn();
    render(<SignupForm hooks={{ onError }} />);
    fillSignup('weak@example.com', 'password123');
    const reason = await screen.findByText('대문자를 포함해야 합니다', {}, { timeout: 10000 });
    expect(reason).toHaveAttribute('id', 'wiz-signup-password-error');
    expect(onError).toHaveBeenCalledWith('대문자를 포함해야 합니다', expect.objectContaining({ key: 'PASSWORD_TOO_WEAK', status: 400 }));
  });

  it('미인증 계정 로그인은 미인증 문구와 key EMAIL_NOT_VERIFIED 로 거부된다', async () => {
    const backend = createBackend({ errorFormat, features: { emailVerificationRequired: true } });
    await backend.handlers.register(new Request('http://localhost/api/auth/register', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'pending@example.com', password: 'password123' }),
    }) as any);
    const onError = vi.fn();
    render(<LoginForm hooks={{ onError }} />);
    fillLogin('pending@example.com', 'password123');
    expect(await screen.findByText('이메일 인증이 필요합니다', {}, { timeout: 10000 })).toBeInTheDocument();
    expect(onError).toHaveBeenCalledWith('이메일 인증이 필요합니다', expect.objectContaining({ key: 'EMAIL_NOT_VERIFIED', status: 403 }));
  });

  it('잘못된 비밀번호는 실패 문구를 표시하고 이동하지 않는다', async () => {
    const backend = createBackend({ errorFormat });
    await backend.handlers.register(new Request('http://localhost/api/auth/register', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com', password: 'password123' }),
    }) as any);
    const onError = vi.fn();
    render(<LoginForm redirectAfterLogin="/dashboard" hooks={{ onError }} />);
    fillLogin('user@example.com', 'wrong-password');
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1), { timeout: 10000 });
    const [message, info] = onError.mock.calls[0];
    expect(info.status).toBe(401);
    expect(message.length).toBeGreaterThan(0);
    expect(message).not.toBe('[object Object]');
    if (errorFormat === 'standard') expect(info.key).toBe('INVALID_CREDENTIALS');
    expect(window.location.href).toBe('http://localhost/login');
  });

  it('메일 링크의 토큰만으로 비밀번호를 재설정한다(email 없이)', async () => {
    const backend = createBackend({ errorFormat });
    await backend.handlers.register(new Request('http://localhost/api/auth/register', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'reset@example.com', password: 'password123' }),
    }) as any);
    await backend.handlers.forgotPassword(new Request('http://localhost/api/auth/forgot-password', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'reset@example.com' }),
    }) as any);
    const token = backend.sent.reset.get('reset@example.com')!;
    expect(token).toBeTruthy();

    const onSuccess = vi.fn();
    render(<ResetPasswordForm token={token} hooks={{ onSuccess }} />);
    fireEvent.change(screen.getByLabelText('새 비밀번호'), { target: { value: 'newpassword1' } });
    fireEvent.change(screen.getByLabelText('비밀번호 확인'), { target: { value: 'newpassword1' } });
    fireEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1), { timeout: 10000 });
  });

  it('만료·위조된 재설정 링크는 링크 오류(key TOKEN_INVALID)로 표시된다', async () => {
    createBackend({ errorFormat });
    const onError = vi.fn();
    render(<ResetPasswordForm token={'f'.repeat(64)} hooks={{ onError }} />);
    fireEvent.change(screen.getByLabelText('새 비밀번호'), { target: { value: 'newpassword1' } });
    fireEvent.change(screen.getByLabelText('비밀번호 확인'), { target: { value: 'newpassword1' } });
    fireEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }));
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1), { timeout: 10000 });
    const [message, info] = onError.mock.calls[0];
    expect(info.status).toBe(400);
    if (errorFormat === 'standard') {
      expect(info.key).toBe('TOKEN_INVALID');
      expect(message).toBe('링크가 유효하지 않거나 만료되었습니다.');
    } else {
      expect(message).toBe('Invalid or expired token');
    }
  });

  it('메일 링크의 토큰만으로 이메일을 인증한다(email 없이)', async () => {
    const backend = createBackend({ errorFormat, features: { emailVerificationRequired: true } });
    await backend.handlers.register(new Request('http://localhost/api/auth/register', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'verify@example.com', password: 'password123' }),
    }) as any);
    const token = backend.sent.verification.get('verify@example.com')!;
    const onSuccess = vi.fn();
    render(<EmailVerificationForm token={token} hooks={{ onSuccess }} />);
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1), { timeout: 10000 });
    expect(backend.users.get('verify@example.com').emailVerified).toBeInstanceOf(Date);
    expect(backend.tokens.some((t) => t.token === TokenGenerator.hash(token))).toBe(false);
  });
});
