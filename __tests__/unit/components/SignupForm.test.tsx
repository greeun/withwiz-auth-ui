import { render, screen } from '@testing-library/react';
import { SignupForm } from '../../../src/components/SignupForm';

describe('SignupForm', () => {
  it('should render name, email, and password inputs', () => {
    render(<SignupForm />);
    expect(screen.getByLabelText('이름 *')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('name@example.com')).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호 *')).toBeInTheDocument();
  });

  it('should render extra fields when provided', () => {
    render(<SignupForm extraFields={[{ name: 'company', label: 'Company', required: true }]} />);
    expect(screen.getByLabelText('Company *')).toBeInTheDocument();
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

  describe('slots.header', () => {
    it('should render the default heading when no slots are given', () => {
      render(<SignupForm />);
      expect(screen.getByRole('heading', { name: '회원가입' })).toBeInTheDocument();
    });

    it('should hide the header when slots.header is null', () => {
      render(<SignupForm slots={{ header: null }} />);
      expect(screen.queryByRole('heading', { name: '회원가입' })).not.toBeInTheDocument();
    });

    it('should replace the header when slots.header is a node', () => {
      render(<SignupForm slots={{ header: <h2>직접 만든 제목</h2> }} />);
      expect(screen.getByRole('heading', { name: '직접 만든 제목' })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: '회원가입' })).not.toBeInTheDocument();
    });
  });

  describe('slots.oauthSection', () => {
    it('should show the "or" divider with the built-in OAuth buttons', () => {
      const { container } = render(<SignupForm providers={['google']} />);
      expect(container.querySelector('.wiz-auth-divider')).toBeTruthy();
    });

    it('should hide the OAuth buttons and the divider when slots.oauthSection is null', () => {
      const { container } = render(<SignupForm providers={['google']} slots={{ oauthSection: null }} />);
      expect(screen.queryByTestId('oauth-google-btn')).not.toBeInTheDocument();
      expect(container.querySelector('.wiz-auth-divider')).toBeNull();
    });

    it('should keep the divider when slots.oauthSection is a node', () => {
      const { container } = render(<SignupForm providers={['google']} slots={{ oauthSection: <div>직접 만든 OAuth</div> }} />);
      expect(screen.getByText('직접 만든 OAuth')).toBeInTheDocument();
      expect(container.querySelector('.wiz-auth-divider')).toBeTruthy();
    });
  });
});
