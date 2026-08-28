import { render, waitFor } from '@testing-library/react';
import { EmailVerificationForm } from '../../../src/components/EmailVerificationForm';

describe('EmailVerificationForm theming', () => {
  it('routes slots in the loading state', () => {
    globalThis.fetch = vi.fn(() => new Promise(() => {})) as unknown as typeof fetch;
    const { container } = render(
      <EmailVerificationForm token="tok" classNames={{ root: 'slot-root', icon: 'slot-icon', message: 'slot-message' }} />
    );
    expect(container.querySelector('.wiz-auth-status.slot-root')).toBeTruthy();
    expect(container.querySelector('.wiz-auth-status-icon.slot-icon')).toBeTruthy();
    expect(container.querySelector('.wiz-auth-status-message.slot-message')).toBeTruthy();
  });

  it('routes slots in the success state', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }) as unknown as typeof fetch;
    const { container } = render(
      <EmailVerificationForm token="tok" classNames={{ root: 'slot-root', title: 'slot-title', primaryAction: 'slot-primary' }} />
    );
    await waitFor(() => {
      expect(container.querySelector('.wiz-auth-status-title.slot-title')).toBeTruthy();
    });
    expect(container.querySelector('.wiz-auth-status.slot-root')).toBeTruthy();
    expect(container.querySelector('.wiz-auth-status-primary.slot-primary')).toBeTruthy();
  });

  it('routes slots in the error state and marks the state for CSS', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'bad token' }) }) as unknown as typeof fetch;
    const { container } = render(
      <EmailVerificationForm token="tok" classNames={{ actions: 'slot-actions', secondaryLink: 'slot-secondary' }} />
    );
    await waitFor(() => {
      expect(container.querySelector('.wiz-auth-status-title[data-state="error"]')).toBeTruthy();
    });
    expect(container.querySelector('.wiz-auth-status-actions.slot-actions')).toBeTruthy();
    expect(container.querySelector('.wiz-auth-status-link.slot-secondary')).toBeTruthy();
  });

  it('carries no inline style in any state', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }) as unknown as typeof fetch;
    const { container } = render(<EmailVerificationForm token="tok" />);
    await waitFor(() => {
      expect(container.querySelector('.wiz-auth-status-title')).toBeTruthy();
    });
    expect(container.querySelectorAll('[style]')).toHaveLength(0);
  });
});
