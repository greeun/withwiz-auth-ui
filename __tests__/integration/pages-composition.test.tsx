import { render, screen, waitFor } from '@testing-library/react';
import {
  LoginPage,
  SignupPage,
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

describe('LoginPage composition', () => {
  it('passes providers through to LoginForm which renders OAuthButtons', () => {
    render(<LoginPage providers={['google', 'github']} />);
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    expect(screen.getByText('Continue with GitHub')).toBeInTheDocument();
  });

  it('passes locale through to LoginForm', () => {
    render(<LoginPage locale="en" providers={['kakao']} />);
    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByText('Continue with Kakao')).toBeInTheDocument();
  });

  it('accepts and forwards layout props (pattern, backgroundColor)', () => {
    const { container } = render(<LoginPage pattern="hexagon" backgroundColor="#123456" />);
    const sidePanel = container.querySelector('.wiz-auth-side-panel') as HTMLElement;
    expect(sidePanel.style.getPropertyValue('--wiz-auth-side-panel-background')).toBe('#123456');
  });
});

describe('SignupPage composition', () => {
  it('passes extraFields through to SignupForm', () => {
    render(
      <SignupPage
        extraFields={[
          { name: 'phone', label: '전화번호', type: 'tel', placeholder: '010-0000-0000' },
        ]}
      />
    );
    expect(screen.getByLabelText('전화번호')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('010-0000-0000')).toBeInTheDocument();
  });

  it('passes providers through to SignupForm which renders OAuthButtons', () => {
    render(<SignupPage providers={['google']} />);
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
  });

  it('accepts and forwards layout props (pattern, backgroundColor)', () => {
    const { container } = render(<SignupPage pattern="dots" backgroundColor="#abcdef" />);
    const sidePanel = container.querySelector('.wiz-auth-side-panel') as HTMLElement;
    expect(sidePanel.style.getPropertyValue('--wiz-auth-side-panel-background')).toBe('#abcdef');
  });
});

describe('ResetPasswordPage composition', () => {
  it('passes token through to ResetPasswordForm', () => {
    render(<ResetPasswordPage token="reset-token-123" />);
    expect(screen.getByRole('heading', { name: '비밀번호 재설정' })).toBeInTheDocument();
    expect(screen.getByLabelText('새 비밀번호')).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호 확인')).toBeInTheDocument();
  });

  it('passes locale through to ResetPasswordForm', () => {
    render(<ResetPasswordPage token="tok" locale="en" />);
    expect(screen.getByRole('heading', { name: 'Reset Password' })).toBeInTheDocument();
  });

  it('accepts and forwards layout props (pattern, backgroundColor)', () => {
    const { container } = render(<ResetPasswordPage token="tok" pattern="none" backgroundColor="#ff0000" />);
    const sidePanel = container.querySelector('.wiz-auth-side-panel') as HTMLElement;
    expect(sidePanel.style.getPropertyValue('--wiz-auth-side-panel-background')).toBe('#ff0000');
  });
});

describe('EmailVerificationPage composition', () => {
  it('passes token through and triggers API call on mount', async () => {
    render(<EmailVerificationPage token="verify-token-abc" />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/verify-email',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ token: 'verify-token-abc' }),
        })
      );
    });
  });

  it('shows success state after verification', async () => {
    render(<EmailVerificationPage token="valid-token" />);

    await waitFor(() => {
      expect(screen.getByText('인증 완료')).toBeInTheDocument();
      expect(screen.getByText('이메일이 성공적으로 인증되었습니다')).toBeInTheDocument();
    });
  });

  it('passes custom apiBasePath through to EmailVerificationForm', async () => {
    render(<EmailVerificationPage token="tok" apiBasePath="/v2/auth" />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/v2/auth/verify-email',
        expect.anything()
      );
    });
  });

  it('accepts and forwards layout props (pattern, backgroundColor)', () => {
    const { container } = render(<EmailVerificationPage token="tok" pattern="triangle" backgroundColor="#00ff00" />);
    const sidePanel = container.querySelector('.wiz-auth-side-panel') as HTMLElement;
    expect(sidePanel.style.getPropertyValue('--wiz-auth-side-panel-background')).toBe('#00ff00');
  });
});
