import { render, screen } from '@testing-library/react';
import { LoginForm } from '../../src/components/LoginForm';
import { SignupForm } from '../../src/components/SignupForm';
import { ForgotPasswordForm } from '../../src/components/ForgotPasswordForm';
import { OAuthButtons } from '../../src/components/OAuthButtons';

// Mock fetch to prevent network errors in components that call API on submit
beforeEach(() => {
  global.fetch = vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({}),
  })) as unknown as typeof fetch;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('LoginForm accessibility', () => {
  beforeEach(() => {
    render(<LoginForm locale="ko" />);
  });

  it('email input is associated with its label via htmlFor', () => {
    const emailInput = screen.getByLabelText('이메일');
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('id', 'wiz-login-email');
  });

  it('password input is associated with its label via htmlFor', () => {
    const passwordInput = screen.getByLabelText('비밀번호');
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute('id', 'wiz-login-password');
  });

  it('submit button has accessible name (text content = "로그인")', () => {
    const submitButton = screen.getByRole('button', { name: '로그인' });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveAttribute('type', 'submit');
  });

  it('heading level is h1', () => {
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
  });

  it('email input has type="email"', () => {
    const emailInput = screen.getByLabelText('이메일');
    expect(emailInput).toHaveAttribute('type', 'email');
  });

  it('password input has type="password"', () => {
    const passwordInput = screen.getByLabelText('비밀번호');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});

describe('SignupForm accessibility', () => {
  beforeEach(() => {
    render(
      <SignupForm
        locale="ko"
        extraFields={[
          { name: 'company', label: '회사명', type: 'text', placeholder: '회사명 입력' },
        ]}
      />
    );
  });

  it('all 3 inputs (name, email, password) are labeled correctly', () => {
    const nameInput = screen.getByLabelText('이름');
    const emailInput = screen.getByLabelText('이메일');
    const passwordInput = screen.getByLabelText('비밀번호');

    expect(nameInput).toHaveAttribute('id', 'wiz-register-name');
    expect(emailInput).toHaveAttribute('id', 'wiz-register-email');
    expect(passwordInput).toHaveAttribute('id', 'wiz-register-password');
  });

  it('extra fields have proper labels', () => {
    const companyInput = screen.getByLabelText('회사명');
    expect(companyInput).toBeInTheDocument();
    expect(companyInput).toHaveAttribute('id', 'wiz-register-company');
  });

  it('name input has type="text"', () => {
    const nameInput = screen.getByLabelText('이름');
    expect(nameInput).toHaveAttribute('type', 'text');
  });

  it('email input has type="email"', () => {
    const emailInput = screen.getByLabelText('이메일');
    expect(emailInput).toHaveAttribute('type', 'email');
  });

  it('password input has type="password"', () => {
    const passwordInput = screen.getByLabelText('비밀번호');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});

describe('ForgotPasswordForm accessibility', () => {
  beforeEach(() => {
    render(<ForgotPasswordForm locale="ko" />);
  });

  it('email input is associated with label', () => {
    const emailInput = screen.getByLabelText('이메일');
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('id', 'wiz-forgot-email');
  });

  it('submit button has accessible name', () => {
    const submitButton = screen.getByRole('button', { name: '재설정 링크 보내기' });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveAttribute('type', 'submit');
  });

  it('email input has type="email"', () => {
    const emailInput = screen.getByLabelText('이메일');
    expect(emailInput).toHaveAttribute('type', 'email');
  });

  it('heading level is h1', () => {
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
  });
});

describe('OAuthButtons accessibility', () => {
  beforeEach(() => {
    render(<OAuthButtons providers={['google', 'github', 'kakao']} />);
  });

  it('each button has descriptive text content (not just icon)', () => {
    const googleBtn = screen.getByTestId('oauth-google-btn');
    const githubBtn = screen.getByTestId('oauth-github-btn');
    const kakaoBtn = screen.getByTestId('oauth-kakao-btn');

    expect(googleBtn).toHaveTextContent('Continue with Google');
    expect(githubBtn).toHaveTextContent('Continue with GitHub');
    expect(kakaoBtn).toHaveTextContent('Continue with Kakao');
  });

  it('buttons are accessible via role', () => {
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);

    expect(buttons[0]).toHaveTextContent('Google');
    expect(buttons[1]).toHaveTextContent('GitHub');
    expect(buttons[2]).toHaveTextContent('Kakao');
  });

  it('buttons have type="button" to prevent accidental form submission', () => {
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      expect(btn).toHaveAttribute('type', 'button');
    });
  });
});
