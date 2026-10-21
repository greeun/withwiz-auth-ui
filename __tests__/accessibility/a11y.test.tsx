import { render, screen, fireEvent } from '@testing-library/react';
import { LoginForm } from '../../src/components/LoginForm';
import { SignupForm } from '../../src/components/SignupForm';
import { ForgotPasswordForm } from '../../src/components/ForgotPasswordForm';
import { ResetPasswordForm } from '../../src/components/ResetPasswordForm';
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
    const emailInput = screen.getByLabelText('이메일 *');
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('id', 'wiz-login-email');
  });

  it('password input is associated with its label via htmlFor', () => {
    const passwordInput = screen.getByLabelText('비밀번호 *');
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
    const emailInput = screen.getByLabelText('이메일 *');
    expect(emailInput).toHaveAttribute('type', 'email');
  });

  it('password input has type="password"', () => {
    const passwordInput = screen.getByLabelText('비밀번호 *');
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
    const nameInput = screen.getByLabelText('이름 *');
    const emailInput = screen.getByLabelText('이메일 *');
    const passwordInput = screen.getByLabelText('비밀번호 *');

    expect(nameInput).toHaveAttribute('id', 'wiz-signup-name');
    expect(emailInput).toHaveAttribute('id', 'wiz-signup-email');
    expect(passwordInput).toHaveAttribute('id', 'wiz-signup-password');
  });

  it('extra fields have proper labels', () => {
    const companyInput = screen.getByLabelText('회사명');
    expect(companyInput).toBeInTheDocument();
    expect(companyInput).toHaveAttribute('id', 'wiz-signup-company');
  });

  it('name input has type="text"', () => {
    const nameInput = screen.getByLabelText('이름 *');
    expect(nameInput).toHaveAttribute('type', 'text');
  });

  it('email input has type="email"', () => {
    const emailInput = screen.getByLabelText('이메일 *');
    expect(emailInput).toHaveAttribute('type', 'email');
  });

  it('password input has type="password"', () => {
    const passwordInput = screen.getByLabelText('비밀번호 *');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});

describe('ForgotPasswordForm accessibility', () => {
  beforeEach(() => {
    render(<ForgotPasswordForm locale="ko" />);
  });

  it('email input is associated with label', () => {
    const emailInput = screen.getByLabelText('이메일 *');
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('id', 'wiz-forgot-email');
  });

  it('submit button has accessible name', () => {
    const submitButton = screen.getByRole('button', { name: '재설정 링크 보내기' });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveAttribute('type', 'submit');
  });

  it('email input has type="email"', () => {
    const emailInput = screen.getByLabelText('이메일 *');
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

describe('field error wiring (0.7)', () => {
  it('a client-side validation error marks the input invalid and points at the message', async () => {
    render(<LoginForm locale="ko" />);
    fireEvent.change(screen.getByLabelText('이메일 *'), { target: { value: 'not-an-email' } });
    fireEvent.change(screen.getByLabelText('비밀번호 *'), { target: { value: 'password123' } });
    // submit directly: a button click lets jsdom's native type=email validation block the submission
    fireEvent.submit(screen.getByRole('button', { name: '로그인' }).closest('form')!);

    const message = await screen.findByText('유효한 이메일을 입력하세요');
    const input = screen.getByLabelText('이메일 *');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', message.id);
    expect(screen.getByLabelText('비밀번호 *')).not.toHaveAttribute('aria-invalid');
  });
});

describe('form-level errors are announced', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ success: false, error: { code: 40101, key: 'UNAUTHORIZED', message: 'x', userMessage: { description: '로그인 정보가 올바르지 않습니다' } } }),
    }) as never;
  });

  it('LoginForm renders the server error with role="alert"', async () => {
    render(<LoginForm locale="ko" />);
    fireEvent.change(screen.getByLabelText('이메일 *'), { target: { value: 'a@example.com' } });
    fireEvent.change(screen.getByLabelText('비밀번호 *'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: '로그인' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('로그인 정보가 올바르지 않습니다');
  });

  it('ForgotPasswordForm renders the server error with role="alert"', async () => {
    render(<ForgotPasswordForm locale="ko" />);
    fireEvent.change(screen.getByLabelText('이메일 *'), { target: { value: 'a@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: '재설정 링크 보내기' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('로그인 정보가 올바르지 않습니다');
  });
});

describe('required inputs expose aria-required', () => {
  it('LoginForm marks email and password as required', () => {
    render(<LoginForm locale="ko" />);
    expect(screen.getByLabelText('이메일 *')).toHaveAttribute('aria-required', 'true');
    expect(screen.getByLabelText('비밀번호 *')).toHaveAttribute('aria-required', 'true');
  });

  it('SignupForm marks name, email and password as required, extra fields only when declared', () => {
    render(
      <SignupForm
        locale="ko"
        extraFields={[
          { name: 'company', label: '회사', required: true },
          { name: 'nickname', label: '별명' },
        ]}
      />,
    );
    expect(screen.getByLabelText('이름 *')).toHaveAttribute('aria-required', 'true');
    expect(screen.getByLabelText('이메일 *')).toHaveAttribute('aria-required', 'true');
    expect(screen.getByLabelText('비밀번호 *')).toHaveAttribute('aria-required', 'true');
    expect(screen.getByLabelText('회사 *')).toBeRequired();
    expect(screen.getByLabelText('별명')).not.toBeRequired();
  });

  it('ResetPasswordForm marks both password inputs as required', () => {
    render(<ResetPasswordForm token="t" locale="ko" />);
    expect(screen.getByLabelText('새 비밀번호 *')).toHaveAttribute('aria-required', 'true');
    expect(screen.getByLabelText('비밀번호 확인 *')).toHaveAttribute('aria-required', 'true');
  });

  it('ForgotPasswordForm marks email as required', () => {
    render(<ForgotPasswordForm locale="ko" />);
    expect(screen.getByLabelText('이메일 *')).toBeRequired();
  });
});

describe('required fields show a visible mark (0.8.4)', () => {
  it('every required input label carries a hidden-from-AT `*`, optional ones do not', () => {
    const { container } = render(
      <SignupForm
        locale="ko"
        extraFields={[
          { name: 'company', label: '회사', required: true },
          { name: 'nickname', label: '별명' },
        ]}
      />,
    );
    for (const input of container.querySelectorAll('input')) {
      const label = container.querySelector(`label[for="${input.id}"]`)!;
      const mark = label.querySelector('.wiz-auth-required');
      const required = input.required || input.getAttribute('aria-required') === 'true';
      expect(Boolean(mark), input.id).toBe(required);
      if (mark) expect(mark).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it('the mark stays out of the accessible name', () => {
    render(<LoginForm locale="ko" />);
    expect(screen.getByRole('textbox', { name: '이메일' })).toHaveAttribute('aria-required', 'true');
  });

  it('requiredMark={false} hides the mark on every form', () => {
    const { container } = render(
      <>
        <LoginForm locale="ko" requiredMark={false} />
        <SignupForm locale="ko" requiredMark={false} extraFields={[{ name: 'company', label: '회사', required: true }]} />
        <ForgotPasswordForm locale="ko" requiredMark={false} />
        <ResetPasswordForm token="t" locale="ko" requiredMark={false} />
      </>,
    );
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
    expect(screen.getByLabelText('회사')).toBeRequired();
  });

  it('classNames.requiredMark is applied, and unstyled drops the built-in class', () => {
    const { container } = render(<ForgotPasswordForm locale="ko" unstyled classNames={{ requiredMark: 'text-red-600' }} />);
    const mark = container.querySelector('label span')!;
    expect(mark).toHaveClass('text-red-600');
    expect(mark).not.toHaveClass('wiz-auth-required');
  });
});
