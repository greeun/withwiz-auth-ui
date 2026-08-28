import { render, screen } from '@testing-library/react';
import { LoginForm } from '../../../src/components/LoginForm';

describe('LoginForm theming', () => {
  it('routes every classNames slot to its element', () => {
    const { container } = render(
      <LoginForm
        providers={['google']}
        showMagicLink
        classNames={{
          root: 'slot-root',
          header: 'slot-header',
          title: 'slot-title',
          subtitle: 'slot-subtitle',
          form: 'slot-form',
          field: 'slot-field',
          label: 'slot-label',
          input: 'slot-input',
          submitButton: 'slot-submit',
          secondaryButton: 'slot-secondary',
          link: 'slot-link',
          footer: 'slot-footer',
          divider: 'slot-divider',
          dividerLine: 'slot-divider-line',
          dividerText: 'slot-divider-text',
          oauth: 'slot-oauth',
          oauthButton: 'slot-oauth-btn',
        }}
      />
    );

    expect(container.querySelector('.wiz-auth-form.slot-root')).toBeTruthy();
    expect(container.querySelector('.wiz-auth-header.slot-header')).toBeTruthy();
    expect(container.querySelector('.wiz-auth-title.slot-title')).toBeTruthy();
    expect(container.querySelector('.wiz-auth-subtitle.slot-subtitle')).toBeTruthy();
    expect(container.querySelector('form.wiz-auth-fields.slot-form')).toBeTruthy();
    expect(container.querySelectorAll('.wiz-auth-field.slot-field')).toHaveLength(2);
    expect(container.querySelectorAll('.wiz-auth-label.slot-label')).toHaveLength(2);
    expect(container.querySelectorAll('.wiz-auth-input.slot-input')).toHaveLength(2);
    expect(container.querySelector('.wiz-auth-submit.slot-submit')).toBeTruthy();
    expect(container.querySelector('.wiz-auth-secondary.slot-secondary')).toBeTruthy();
    expect(container.querySelector('.wiz-auth-link.slot-link')).toBeTruthy();
    expect(container.querySelector('.wiz-auth-footer.slot-footer')).toBeTruthy();
    expect(container.querySelector('.wiz-auth-divider.slot-divider')).toBeTruthy();
    expect(container.querySelectorAll('.wiz-auth-divider-line.slot-divider-line')).toHaveLength(2);
    expect(container.querySelector('.wiz-auth-divider-text.slot-divider-text')).toBeTruthy();
    expect(container.querySelector('.wiz-oauth-buttons.slot-oauth')).toBeTruthy();
    expect(container.querySelector('.wiz-oauth-btn.slot-oauth-btn')).toBeTruthy();
  });

  it('drops every package class in unstyled mode but keeps consumer slots', () => {
    const { container } = render(<LoginForm unstyled classNames={{ root: 'mine', input: 'my-input' }} />);
    expect(container.querySelector('.wiz-auth-form')).toBeNull();
    expect(container.querySelector('.wiz-auth-input')).toBeNull();
    expect(container.querySelector('.mine')).toBeTruthy();
    expect(container.querySelectorAll('.my-input')).toHaveLength(2);
  });

  it('exposes forceColorScheme on its own root for standalone use', () => {
    const { container } = render(<LoginForm forceColorScheme="dark" />);
    expect(container.querySelector('[data-wiz-scheme="dark"]')).toBeTruthy();
  });

  it('renders the error banner with the error slot', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'nope' }),
    }) as unknown as typeof fetch;

    const { container } = render(<LoginForm classNames={{ error: 'slot-error' }} />);
    const email = screen.getByPlaceholderText('name@example.com');
    const password = screen.getByLabelText('비밀번호');
    const { fireEvent, waitFor } = await import('@testing-library/react');

    fireEvent.change(email, { target: { value: 'a@b.com' } });
    fireEvent.change(password, { target: { value: 'password1' } });
    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => {
      expect(container.querySelector('.wiz-auth-error.slot-error')).toBeTruthy();
    });
  });

  it('carries no inline style anywhere', () => {
    const { container } = render(<LoginForm providers={['google']} showMagicLink />);
    expect(container.querySelectorAll('[style]')).toHaveLength(0);
  });
});
