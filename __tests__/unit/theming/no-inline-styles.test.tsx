import { render, waitFor } from '@testing-library/react';
import {
  AuthLayout, LoginForm, SignupForm, ForgotPasswordForm, ResetPasswordForm, OAuthButtons,
} from '../../../src/components';
import {
  LoginScreen, SignupScreen, ForgotPasswordScreen, ResetPasswordScreen, EmailVerificationScreen,
} from '../../../src/screens';
import {
  LoginPage, SignupPage, ForgotPasswordPage, ResetPasswordPage, EmailVerificationPage,
} from '../../../src/pages';

/**
 * Inline styles always beat both CSS variables and consumer class names, so a
 * single stray `style={{ … }}` silently breaks classNames slots for that
 * element. Only one exception is allowed: AuthLayout injects the
 * `backgroundColor` prop as a CSS variable.
 */
function inlineStyled(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('[style]')).map((el) => el.outerHTML.slice(0, 120));
}

describe('no inline styles', () => {
  it('LoginForm renders none', () => {
    const { container } = render(<LoginForm providers={['google', 'kakao']} showMagicLink />);
    expect(inlineStyled(container)).toEqual([]);
  });

  it('SignupForm renders none', () => {
    const { container } = render(
      <SignupForm providers={['github']} extraFields={[{ name: 'company', label: 'Company' }]} />
    );
    expect(inlineStyled(container)).toEqual([]);
  });

  it('ForgotPasswordForm renders none', () => {
    const { container } = render(<ForgotPasswordForm />);
    expect(inlineStyled(container)).toEqual([]);
  });

  it('ResetPasswordForm renders none', () => {
    const { container } = render(<ResetPasswordForm token="tok" />);
    expect(inlineStyled(container)).toEqual([]);
  });

  it('OAuthButtons renders none', () => {
    const { container } = render(<OAuthButtons providers={['google', 'github', 'kakao']} />);
    expect(inlineStyled(container)).toEqual([]);
  });

  it('AuthLayout renders none without backgroundColor', () => {
    const { container } = render(<AuthLayout logo={<span>L</span>} title="T" subtitle="S"><div /></AuthLayout>);
    expect(inlineStyled(container)).toEqual([]);
  });

  it('AuthLayout uses the single allowed exception for backgroundColor', () => {
    const { container } = render(<AuthLayout backgroundColor="#123456"><div /></AuthLayout>);
    const styled = container.querySelectorAll('[style]');
    expect(styled).toHaveLength(1);
    expect((styled[0] as HTMLElement).style.getPropertyValue('--wiz-auth-side-panel-background')).toBe('#123456');
  });

  it('no component injects a <style> tag any more', () => {
    const { container } = render(<AuthLayout><LoginForm /></AuthLayout>);
    expect(container.querySelector('style')).toBeNull();
  });
});

/**
 * Screens and Pages (Task 10) each wrap a form in AuthLayout and forward
 * `backgroundColor` straight through, so they share AuthLayout's one allowed
 * exception. Rendered here WITHOUT `backgroundColor`, so the exception does
 * not apply and the bar is the same as every other component: zero.
 */
describe('no inline styles — screens and pages', () => {
  it('LoginScreen renders none', () => {
    const { container } = render(<LoginScreen />);
    expect(inlineStyled(container)).toEqual([]);
  });

  it('SignupScreen renders none', () => {
    const { container } = render(<SignupScreen />);
    expect(inlineStyled(container)).toEqual([]);
  });

  it('ForgotPasswordScreen renders none', () => {
    const { container } = render(<ForgotPasswordScreen />);
    expect(inlineStyled(container)).toEqual([]);
  });

  it('ResetPasswordScreen renders none', () => {
    const { container } = render(<ResetPasswordScreen token="tok" />);
    expect(inlineStyled(container)).toEqual([]);
  });

  it('EmailVerificationScreen renders none', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }) as unknown as typeof fetch;
    const { container } = render(<EmailVerificationScreen token="tok" />);
    await waitFor(() => {
      expect(container.querySelector('.wiz-auth-status-title')).toBeTruthy();
    });
    expect(inlineStyled(container)).toEqual([]);
  });

  it('LoginPage renders none', () => {
    const { container } = render(<LoginPage />);
    expect(inlineStyled(container)).toEqual([]);
  });

  it('SignupPage renders none', () => {
    const { container } = render(<SignupPage />);
    expect(inlineStyled(container)).toEqual([]);
  });

  it('ForgotPasswordPage renders none', () => {
    const { container } = render(<ForgotPasswordPage />);
    expect(inlineStyled(container)).toEqual([]);
  });

  it('ResetPasswordPage renders none', () => {
    const { container } = render(<ResetPasswordPage token="tok" />);
    expect(inlineStyled(container)).toEqual([]);
  });

  it('EmailVerificationPage renders none', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }) as unknown as typeof fetch;
    const { container } = render(<EmailVerificationPage token="tok" />);
    await waitFor(() => {
      expect(container.querySelector('.wiz-auth-status-title')).toBeTruthy();
    });
    expect(inlineStyled(container)).toEqual([]);
  });
});
