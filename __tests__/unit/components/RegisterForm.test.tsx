import { render, screen } from '@testing-library/react';
import { RegisterForm } from '../../../src/components/RegisterForm';

describe('RegisterForm', () => {
  it('should render name, email, and password inputs', () => {
    render(<RegisterForm />);
    expect(screen.getByLabelText('이름')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('name@example.com')).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument();
  });

  it('should render extra fields when provided', () => {
    render(<RegisterForm extraFields={[{ name: 'company', label: 'Company', required: true }]} />);
    expect(screen.getByLabelText('Company')).toBeInTheDocument();
  });

  it('should show login link when enabled', () => {
    render(<RegisterForm showLoginLink={true} />);
    expect(screen.getByText('로그인')).toBeInTheDocument();
  });

  it('should hide login link when disabled', () => {
    render(<RegisterForm showLoginLink={false} />);
    expect(screen.queryByText('로그인')).not.toBeInTheDocument();
  });

  it('should use English when locale is en', () => {
    render(<RegisterForm locale="en" />);
    expect(screen.getByRole('heading', { name: 'Sign Up' })).toBeInTheDocument();
  });

  it('should render OAuth buttons when providers specified', () => {
    render(<RegisterForm providers={['google', 'kakao']} />);
    expect(screen.getByTestId('oauth-google-btn')).toBeInTheDocument();
    expect(screen.getByTestId('oauth-kakao-btn')).toBeInTheDocument();
  });

  it('should not render OAuth section when no providers', () => {
    render(<RegisterForm providers={[]} />);
    expect(screen.queryByTestId('oauth-google-btn')).not.toBeInTheDocument();
  });
});
