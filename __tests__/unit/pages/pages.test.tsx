import { render, screen } from '@testing-library/react';
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  EmailVerificationPage,
} from '../../../src/pages';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ success: true }),
  }));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('LoginPage', () => {
  it('renders AuthLayout with LoginForm', () => {
    const { container } = render(<LoginPage />);
    expect(container.querySelector('.wiz-auth-page')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '로그인' })).toBeInTheDocument();
    expect(screen.getByLabelText('이메일')).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument();
  });

  it('passes layout props to AuthLayout', () => {
    const { container } = render(<LoginPage pattern="dots" backgroundColor="#ff0000" />);
    const sidePanel = container.querySelector('.wiz-auth-side-panel');
    expect(sidePanel).toHaveStyle({ backgroundColor: '#ff0000' });
  });

  it('passes form props through', () => {
    render(<LoginPage locale="en" />);
    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
  });
});

describe('RegisterPage', () => {
  it('renders AuthLayout with RegisterForm', () => {
    const { container } = render(<RegisterPage />);
    expect(container.querySelector('.wiz-auth-page')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '회원가입' })).toBeInTheDocument();
    expect(screen.getByLabelText('이름')).toBeInTheDocument();
  });
});

describe('ForgotPasswordPage', () => {
  it('renders AuthLayout with ForgotPasswordForm', () => {
    const { container } = render(<ForgotPasswordPage />);
    expect(container.querySelector('.wiz-auth-page')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '비밀번호 찾기' })).toBeInTheDocument();
  });
});

describe('ResetPasswordPage', () => {
  it('renders AuthLayout with ResetPasswordForm', () => {
    const { container } = render(<ResetPasswordPage token="abc" />);
    expect(container.querySelector('.wiz-auth-page')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '비밀번호 재설정' })).toBeInTheDocument();
  });
});

describe('EmailVerificationPage', () => {
  it('renders AuthLayout with EmailVerificationForm', async () => {
    const { container } = render(<EmailVerificationPage token="abc" />);
    expect(container.querySelector('.wiz-auth-page')).toBeInTheDocument();
  });
});
