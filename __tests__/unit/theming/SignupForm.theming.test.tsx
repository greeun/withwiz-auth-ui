import { render } from '@testing-library/react';
import { SignupForm } from '../../../src/components/SignupForm';

describe('SignupForm theming', () => {
  it('routes classNames slots to their elements', () => {
    const { container } = render(
      <SignupForm
        providers={['google']}
        classNames={{
          root: 'slot-root',
          header: 'slot-header',
          form: 'slot-form',
          field: 'slot-field',
          label: 'slot-label',
          input: 'slot-input',
          submitButton: 'slot-submit',
          link: 'slot-link',
          footer: 'slot-footer',
          divider: 'slot-divider',
          oauth: 'slot-oauth',
        }}
      />
    );

    expect(container.querySelector('.wiz-auth-form.slot-root')).toBeTruthy();
    expect(container.querySelector('.wiz-auth-header.slot-header')).toBeTruthy();
    expect(container.querySelector('form.wiz-auth-fields.slot-form')).toBeTruthy();
    expect(container.querySelectorAll('.wiz-auth-field.slot-field')).toHaveLength(3);
    expect(container.querySelectorAll('.wiz-auth-input.slot-input')).toHaveLength(3);
    expect(container.querySelector('.wiz-auth-submit.slot-submit')).toBeTruthy();
    expect(container.querySelector('.wiz-auth-link.slot-link')).toBeTruthy();
    expect(container.querySelector('.wiz-auth-footer.slot-footer')).toBeTruthy();
    expect(container.querySelector('.wiz-auth-divider.slot-divider')).toBeTruthy();
    expect(container.querySelector('.wiz-oauth-buttons.slot-oauth')).toBeTruthy();
  });

  it('applies the field slot to extraFields too', () => {
    const { container } = render(
      <SignupForm
        extraFields={[{ name: 'company', label: 'Company' }]}
        classNames={{ field: 'slot-field', input: 'slot-input' }}
      />
    );
    expect(container.querySelectorAll('.wiz-auth-field.slot-field')).toHaveLength(4);
    expect(container.querySelectorAll('.wiz-auth-input.slot-input')).toHaveLength(4);
  });

  it('carries no inline style anywhere', () => {
    const { container } = render(<SignupForm providers={['google']} />);
    expect(container.querySelectorAll('[style]')).toHaveLength(0);
  });
});
