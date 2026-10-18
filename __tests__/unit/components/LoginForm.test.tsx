import { render, screen } from '@testing-library/react';
import { LoginForm } from '../../../src/components/LoginForm';

describe('LoginForm', () => {
  it('should render email and password inputs', () => {
    render(<LoginForm />);
    expect(screen.getByPlaceholderText('name@example.com')).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument();
  });

  it('should render OAuth buttons when providers specified', () => {
    render(<LoginForm providers={['google', 'github']} />);
    expect(screen.getByTestId('oauth-google-btn')).toBeInTheDocument();
    expect(screen.getByTestId('oauth-github-btn')).toBeInTheDocument();
  });

  it('should not render OAuth section when no providers', () => {
    render(<LoginForm providers={[]} />);
    expect(screen.queryByTestId('oauth-google-btn')).not.toBeInTheDocument();
  });

  it('should use custom title', () => {
    render(<LoginForm title="Custom Login" />);
    expect(screen.getByText('Custom Login')).toBeInTheDocument();
  });

  it('should use English messages when locale is en', () => {
    render(<LoginForm locale="en" />);
    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('should show forgot password link by default', () => {
    render(<LoginForm />);
    expect(screen.getByText('비밀번호를 잊으셨나요?')).toBeInTheDocument();
  });

  it('should hide forgot password link when disabled', () => {
    render(<LoginForm showForgotPassword={false} />);
    expect(screen.queryByText('비밀번호를 잊으셨나요?')).not.toBeInTheDocument();
  });

  it('should show signup link by default', () => {
    render(<LoginForm />);
    expect(screen.getByText('회원가입')).toBeInTheDocument();
  });

  it('should hide signup link when disabled', () => {
    render(<LoginForm showSignupLink={false} />);
    expect(screen.queryByText('회원가입')).not.toBeInTheDocument();
  });

  describe('slots.header', () => {
    it('should render the default heading when no slots are given', () => {
      render(<LoginForm />);
      expect(screen.getByRole('heading', { name: '로그인' })).toBeInTheDocument();
    });

    it('should hide the header when slots.header is null', () => {
      render(<LoginForm slots={{ header: null }} />);
      expect(screen.queryByRole('heading', { name: '로그인' })).not.toBeInTheDocument();
    });

    it('should replace the header when slots.header is a node', () => {
      render(<LoginForm slots={{ header: <h2>직접 만든 제목</h2> }} />);
      expect(screen.getByRole('heading', { name: '직접 만든 제목' })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: '로그인' })).not.toBeInTheDocument();
    });
  });
});
