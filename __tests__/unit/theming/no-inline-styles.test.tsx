import { render } from '@testing-library/react';
import {
  AuthLayout, LoginForm, SignupForm, ForgotPasswordForm, ResetPasswordForm, OAuthButtons,
} from '../../../src/components';

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
