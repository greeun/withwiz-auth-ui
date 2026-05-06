import { render, screen } from '@testing-library/react';
import { SignupForm } from '../../../src/components/SignupForm';

describe('SignupForm', () => {
  it('should render name, email, and password inputs', () => {
    render(<SignupForm />);
    expect(screen.getByLabelText('이름')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('name@example.com')).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument();
  });

  it('should render extra fields when provided', () => {
    render(<SignupForm extraFields={[{ name: 'company', label: 'Company', required: true }]} />);
    expect(screen.getByLabelText('Company')).toBeInTheDocument();
  });

  it('should show login link when enabled', () => {
    render(<SignupForm showLoginLink={true} />);
    expect(screen.getByText('로그인')).toBeInTheDocument();
  });

  it('should hide login link when disabled', () => {
    render(<SignupForm showLoginLink={false} />);
    expect(screen.queryByText('로그인')).not.toBeInTheDocument();
  });

  it('should use English when locale is en', () => {
    render(<SignupForm locale="en" />);
    expect(screen.getByRole('heading', { name: 'Sign Up' })).toBeInTheDocument();
  });

  it('should render OAuth buttons when providers specified', () => {
    render(<SignupForm providers={['google', 'kakao']} />);
    expect(screen.getByTestId('oauth-google-btn')).toBeInTheDocument();
    expect(screen.getByTestId('oauth-kakao-btn')).toBeInTheDocument();
  });

  it('should not render OAuth section when no providers', () => {
    render(<SignupForm providers={[]} />);
    expect(screen.queryByTestId('oauth-google-btn')).not.toBeInTheDocument();
  });
});
