import { render } from '@testing-library/react';
import { LoginScreen, SignupScreen, ForgotPasswordScreen } from '../../../src/screens';
import { LoginPage } from '../../../src/pages';

describe('Screen/Page theming pass-through', () => {
  it('splits layoutClassNames from form classNames', () => {
    const { container } = render(
      <LoginScreen
        layoutClassNames={{ root: 'layout-root', sidePanel: 'layout-side' }}
        classNames={{ root: 'form-root', input: 'form-input' }}
      />
    );
    expect(container.querySelector('.wiz-auth-page.layout-root')).toBeTruthy();
    expect(container.querySelector('.wiz-auth-side-panel.layout-side')).toBeTruthy();
    expect(container.querySelector('.wiz-auth-form.form-root')).toBeTruthy();
    expect(container.querySelectorAll('.wiz-auth-input.form-input')).toHaveLength(2);
  });

  it('puts forceColorScheme on the layout only, not on the nested form', () => {
    const { container } = render(<LoginScreen forceColorScheme="dark" />);
    expect(container.querySelectorAll('[data-wiz-scheme="dark"]')).toHaveLength(1);
    expect(container.querySelector('.wiz-auth-page')?.getAttribute('data-wiz-scheme')).toBe('dark');
  });

  it('applies to SignupScreen too', () => {
    const { container } = render(<SignupScreen layoutClassNames={{ logo: 'layout-logo' }} logo={<span>L</span>} />);
    expect(container.querySelector('.wiz-auth-logo.layout-logo')).toBeTruthy();
  });

  it('applies to ForgotPasswordScreen too', () => {
    const { container } = render(<ForgotPasswordScreen classNames={{ input: 'form-input' }} />);
    expect(container.querySelector('.wiz-auth-input.form-input')).toBeTruthy();
  });

  it('applies to Page aliases too', () => {
    const { container } = render(<LoginPage layoutClassNames={{ content: 'layout-content' }} />);
    expect(container.querySelector('.wiz-auth-content.layout-content')).toBeTruthy();
  });
});
