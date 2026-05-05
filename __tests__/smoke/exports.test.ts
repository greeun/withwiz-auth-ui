import { render } from '@testing-library/react';
import React from 'react';
import {
  LoginForm,
  RegisterForm,
  ForgotPasswordForm,
  AuthLayout,
  AuthProvider,
  useAuth,
  OAuthButtons,
  useAuthForm,
  getMessages,
  mergeMessages,
  ResetPasswordForm,
  EmailVerificationForm,
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  EmailVerificationPage,
} from '../../src/index';

// Mock fetch for components that call API on mount (AuthProvider)
beforeEach(() => {
  global.fetch = vi.fn(async () => ({
    ok: false,
    status: 401,
    json: async () => ({ error: 'Unauthorized' }),
  })) as unknown as typeof fetch;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Library exports - smoke tests', () => {
  it('LoginForm can be imported and is a function', () => {
    expect(LoginForm).toBeDefined();
    expect(typeof LoginForm).toBe('function');
  });

  it('RegisterForm can be imported and is a function', () => {
    expect(RegisterForm).toBeDefined();
    expect(typeof RegisterForm).toBe('function');
  });

  it('ForgotPasswordForm can be imported and is a function', () => {
    expect(ForgotPasswordForm).toBeDefined();
    expect(typeof ForgotPasswordForm).toBe('function');
  });

  it('AuthLayout can be imported and is a function', () => {
    expect(AuthLayout).toBeDefined();
    expect(typeof AuthLayout).toBe('function');
  });

  it('AuthProvider can be imported and is a function', () => {
    expect(AuthProvider).toBeDefined();
    expect(typeof AuthProvider).toBe('function');
  });

  it('useAuth can be imported and is a function', () => {
    expect(useAuth).toBeDefined();
    expect(typeof useAuth).toBe('function');
  });

  it('OAuthButtons can be imported and is a function', () => {
    expect(OAuthButtons).toBeDefined();
    expect(typeof OAuthButtons).toBe('function');
  });

  it('useAuthForm can be imported and is a function', () => {
    expect(useAuthForm).toBeDefined();
    expect(typeof useAuthForm).toBe('function');
  });

  it('getMessages can be imported and returns messages for "ko"', () => {
    expect(getMessages).toBeDefined();
    expect(typeof getMessages).toBe('function');

    const messages = getMessages('ko');
    expect(messages).toBeDefined();
    expect(messages.login).toBeDefined();
    expect(messages.login.title).toBeDefined();
    expect(messages.register).toBeDefined();
    expect(messages.forgotPassword).toBeDefined();
    expect(messages.resetPassword).toBeDefined();
    expect(messages.emailVerification).toBeDefined();
  });

  it('mergeMessages can be imported and merges correctly', () => {
    expect(mergeMessages).toBeDefined();
    expect(typeof mergeMessages).toBe('function');

    const merged = mergeMessages('ko', { login: { title: 'Custom Title' } as any });
    expect(merged.login.title).toBe('Custom Title');
    // Other fields should be preserved from base
    expect(merged.login.emailLabel).toBeDefined();
    expect(merged.register.title).toBeDefined();
  });

  it('ResetPasswordForm can be imported and is a function', () => {
    expect(ResetPasswordForm).toBeDefined();
    expect(typeof ResetPasswordForm).toBe('function');
  });
  it('EmailVerificationForm can be imported and is a function', () => {
    expect(EmailVerificationForm).toBeDefined();
    expect(typeof EmailVerificationForm).toBe('function');
  });
  it('LoginPage can be imported and is a function', () => {
    expect(LoginPage).toBeDefined();
    expect(typeof LoginPage).toBe('function');
  });
  it('RegisterPage can be imported and is a function', () => {
    expect(RegisterPage).toBeDefined();
    expect(typeof RegisterPage).toBe('function');
  });
  it('ForgotPasswordPage can be imported and is a function', () => {
    expect(ForgotPasswordPage).toBeDefined();
    expect(typeof ForgotPasswordPage).toBe('function');
  });
  it('ResetPasswordPage can be imported and is a function', () => {
    expect(ResetPasswordPage).toBeDefined();
    expect(typeof ResetPasswordPage).toBe('function');
  });
  it('EmailVerificationPage can be imported and is a function', () => {
    expect(EmailVerificationPage).toBeDefined();
    expect(typeof EmailVerificationPage).toBe('function');
  });
});

describe('Components render without crashing', () => {
  it('LoginForm renders without crashing', () => {
    const { container } = render(React.createElement(LoginForm));
    expect(container).toBeTruthy();
  });

  it('RegisterForm renders without crashing', () => {
    const { container } = render(React.createElement(RegisterForm));
    expect(container).toBeTruthy();
  });

  it('ForgotPasswordForm renders without crashing', () => {
    const { container } = render(React.createElement(ForgotPasswordForm));
    expect(container).toBeTruthy();
  });

  it('AuthLayout renders without crashing with minimal props', () => {
    const { container } = render(
      React.createElement(AuthLayout, { children: React.createElement('div', null, 'child') })
    );
    expect(container).toBeTruthy();
  });

  it('AuthProvider renders without crashing with children', () => {
    const { container } = render(
      React.createElement(AuthProvider, { children: React.createElement('div', null, 'child') })
    );
    expect(container).toBeTruthy();
  });

  it('OAuthButtons renders without crashing with providers', () => {
    const { container } = render(
      React.createElement(OAuthButtons, { providers: ['google', 'github'] })
    );
    expect(container).toBeTruthy();
  });

  it('ResetPasswordForm renders without crashing', () => {
    const { container } = render(React.createElement(ResetPasswordForm, { token: 'test' }));
    expect(container).toBeTruthy();
  });
  it('EmailVerificationForm renders without crashing', () => {
    const { container } = render(React.createElement(EmailVerificationForm, { token: 'test' }));
    expect(container).toBeTruthy();
  });
  it('LoginPage renders without crashing', () => {
    const { container } = render(React.createElement(LoginPage));
    expect(container).toBeTruthy();
  });
  it('RegisterPage renders without crashing', () => {
    const { container } = render(React.createElement(RegisterPage));
    expect(container).toBeTruthy();
  });
  it('ForgotPasswordPage renders without crashing', () => {
    const { container } = render(React.createElement(ForgotPasswordPage));
    expect(container).toBeTruthy();
  });
  it('ResetPasswordPage renders without crashing', () => {
    const { container } = render(React.createElement(ResetPasswordPage, { token: 'test' }));
    expect(container).toBeTruthy();
  });
  it('EmailVerificationPage renders without crashing', () => {
    const { container } = render(React.createElement(EmailVerificationPage, { token: 'test' }));
    expect(container).toBeTruthy();
  });
});
