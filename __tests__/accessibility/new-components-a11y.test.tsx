import { render, screen, waitFor } from '@testing-library/react';
import { ResetPasswordForm } from '../../src/components/ResetPasswordForm';
import { EmailVerificationForm } from '../../src/components/EmailVerificationForm';
import {
  LoginPage,
  RegisterPage,
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
    const passwordInput = screen.getByLabelText('새 비밀번호');
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute('id', 'wiz-reset-password');
  });

  it('confirm field has associated label via htmlFor', () => {
    const confirmInput = screen.getByLabelText('비밀번호 확인');
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
    const passwordInput = screen.getByLabelText('새 비밀번호');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('confirm input has type="password"', () => {
    const confirmInput = screen.getByLabelText('비밀번호 확인');
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

  it('RegisterPage has h1 heading', () => {
    render(<RegisterPage locale="ko" />);
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
