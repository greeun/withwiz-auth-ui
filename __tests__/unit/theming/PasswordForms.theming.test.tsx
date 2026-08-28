import { render } from '@testing-library/react';
import { ForgotPasswordForm } from '../../../src/components/ForgotPasswordForm';
import { ResetPasswordForm } from '../../../src/components/ResetPasswordForm';

describe('ForgotPasswordForm theming', () => {
  it('routes classNames slots to their elements', () => {
    const { container } = render(
      <ForgotPasswordForm
        classNames={{
          root: 'slot-root', title: 'slot-title', subtitle: 'slot-subtitle',
          form: 'slot-form', field: 'slot-field', label: 'slot-label',
          input: 'slot-input', submitButton: 'slot-submit',
          link: 'slot-link', footer: 'slot-footer',
        }}
      />
    );
    expect(container.querySelector('.wiz-auth-form.slot-root')).toBeTruthy();
    expect(container.querySelector('.wiz-auth-title.slot-title')).toBeTruthy();
    expect(container.querySelector('.wiz-auth-subtitle.slot-subtitle')).toBeTruthy();
    expect(container.querySelector('form.wiz-auth-fields.slot-form')).toBeTruthy();
    expect(container.querySelector('.wiz-auth-field.slot-field')).toBeTruthy();
    expect(container.querySelector('.wiz-auth-label.slot-label')).toBeTruthy();
    expect(container.querySelector('.wiz-auth-input.slot-input')).toBeTruthy();
    expect(container.querySelector('.wiz-auth-submit.slot-submit')).toBeTruthy();
    expect(container.querySelector('.wiz-auth-footer.slot-footer')).toBeTruthy();
    expect(container.querySelector('.wiz-auth-link.slot-link')).toBeTruthy();
  });

  it('supports unstyled mode', () => {
    const { container } = render(<ForgotPasswordForm unstyled classNames={{ root: 'mine' }} />);
    expect(container.querySelector('.wiz-auth-form')).toBeNull();
    expect(container.querySelector('.mine')).toBeTruthy();
  });

  it('carries no inline style', () => {
    const { container } = render(<ForgotPasswordForm />);
    expect(container.querySelectorAll('[style]')).toHaveLength(0);
  });
});

describe('ResetPasswordForm theming', () => {
  it('routes classNames slots to both password fields', () => {
    const { container } = render(
      <ResetPasswordForm token="tok" classNames={{ root: 'slot-root', field: 'slot-field', input: 'slot-input', submitButton: 'slot-submit' }} />
    );
    expect(container.querySelector('.wiz-auth-form.slot-root')).toBeTruthy();
    expect(container.querySelectorAll('.wiz-auth-field.slot-field')).toHaveLength(2);
    expect(container.querySelectorAll('.wiz-auth-input.slot-input')).toHaveLength(2);
    expect(container.querySelector('.wiz-auth-submit.slot-submit')).toBeTruthy();
  });

  it('carries no inline style', () => {
    const { container } = render(<ResetPasswordForm token="tok" />);
    expect(container.querySelectorAll('[style]')).toHaveLength(0);
  });
});
