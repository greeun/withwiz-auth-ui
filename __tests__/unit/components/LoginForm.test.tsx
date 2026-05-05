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

  it('should show register link by default', () => {
    render(<LoginForm />);
    expect(screen.getByText('회원가입')).toBeInTheDocument();
  });

  it('should hide register link when disabled', () => {
    render(<LoginForm showRegisterLink={false} />);
    expect(screen.queryByText('회원가입')).not.toBeInTheDocument();
  });
});
