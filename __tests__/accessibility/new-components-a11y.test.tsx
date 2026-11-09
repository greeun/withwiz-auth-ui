import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ResetPasswordForm } from '../../src/components/ResetPasswordForm';
import { MfaChallengeForm } from '../../src/components/MfaChallengeForm';
import { MfaSettings } from '../../src/components/MfaSettings';
import { EmailVerificationForm } from '../../src/components/EmailVerificationForm';
import {
  LoginPage,
  SignupPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  EmailVerificationPage,
} from '../../src/pages';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ success: true }),
  }));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ResetPasswordForm accessibility', () => {
  beforeEach(() => {
    render(<ResetPasswordForm token="valid-token" locale="ko" />);
  });

  it('password field has associated label via htmlFor', () => {
    const passwordInput = screen.getByLabelText('새 비밀번호 *');
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute('id', 'wiz-reset-password');
  });

  it('confirm field has associated label via htmlFor', () => {
    const confirmInput = screen.getByLabelText('비밀번호 확인 *');
    expect(confirmInput).toBeInTheDocument();
    expect(confirmInput).toHaveAttribute('id', 'wiz-reset-confirm');
  });

  it('has heading at h1 level', () => {
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('비밀번호 재설정');
  });

  it('submit button has accessible role and name', () => {
    const button = screen.getByRole('button', { name: '비밀번호 변경' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('password input has type="password"', () => {
    const passwordInput = screen.getByLabelText('새 비밀번호 *');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('confirm input has type="password"', () => {
    const confirmInput = screen.getByLabelText('비밀번호 확인 *');
    expect(confirmInput).toHaveAttribute('type', 'password');
  });
});

describe('EmailVerificationForm accessibility', () => {
  it('success state has accessible link for login button', async () => {
    render(<EmailVerificationForm token="valid-token" locale="ko" />);

    await waitFor(() => {
      const loginLink = screen.getByRole('link', { name: '로그인' });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/login');
    });
  });

  it('error state has accessible links for resend and login', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Invalid' }),
    }));

    render(<EmailVerificationForm token="bad-token" locale="ko" />);

    await waitFor(() => {
      const resendLink = screen.getByRole('link', { name: '인증 이메일 재전송' });
      expect(resendLink).toBeInTheDocument();
      expect(resendLink).toHaveAttribute('href', '/resend-verification');

      const loginLink = screen.getByRole('link', { name: '로그인' });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/login');
    });
  });

  it('error state has accessible heading', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Error' }),
    }));

    render(<EmailVerificationForm token="bad" locale="en" />);

    await waitFor(() => {
      const heading = screen.getByRole('heading');
      expect(heading).toHaveTextContent('Verification Failed');
    });
  });
});

describe('Pages accessibility - h1 heading within AuthLayout', () => {
  it('LoginPage has h1 heading', () => {
    render(<LoginPage locale="ko" />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
  });

  it('SignupPage has h1 heading', () => {
    render(<SignupPage locale="ko" />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
  });

  it('ForgotPasswordPage has h1 heading', () => {
    render(<ForgotPasswordPage locale="ko" />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
  });

  it('ResetPasswordPage has h1 heading', () => {
    render(<ResetPasswordPage token="tok" locale="ko" />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
  });

  it('EmailVerificationPage has heading in success state', async () => {
    render(<EmailVerificationPage token="tok" locale="ko" />);

    await waitFor(() => {
      const heading = screen.getByRole('heading');
      expect(heading).toHaveTextContent('인증 완료');
    });
  });
});

describe('MfaChallengeForm accessibility', () => {
  it('code input is labelled, has h1 and a named submit button', () => {
    render(<MfaChallengeForm locale="ko" />);
    expect(screen.getByLabelText('인증 코드')).toHaveAttribute('id', 'wiz-mfa-code');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('2단계 인증');
    expect(screen.getByRole('button', { name: '확인' })).toHaveAttribute('type', 'submit');
  });
});

describe('MfaSettings accessibility', () => {
  it('has h1, labelled code input on setup, and errors use role="alert"', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ success: true, enabled: false, recoveryCodesRemaining: 0 }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ success: true, secret: 'S', otpauthUri: 'otpauth://totp/x?secret=S' }) })
      .mockResolvedValueOnce({ ok: false, status: 409, json: () => Promise.resolve({ error: { key: 'CONFLICT', userMessage: { description: '충돌' } } }) }));
    render(<MfaSettings locale="ko" />);
    fireEvent.click(await screen.findByRole('button', { name: '2단계 인증 켜기' }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('2단계 인증');
    const input = await screen.findByLabelText('인증 코드');
    expect(input).toHaveAttribute('id');
    expect(screen.getByRole('img', { name: '인증 앱으로 스캔할 QR 코드' })).toBeInTheDocument();
    fireEvent.change(input, { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: '켜기' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('충돌');
    expect(screen.getByRole('button', { name: '켜기' })).toHaveAttribute('type', 'submit');
  });
});
