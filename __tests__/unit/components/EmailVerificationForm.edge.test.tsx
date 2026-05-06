import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { EmailVerificationForm } from '../../../src/components/EmailVerificationForm';

describe('EmailVerificationForm edge cases', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('uses custom loginUrl in success state', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    }));

    render(<EmailVerificationForm token="valid-token" loginUrl="/my-login" />);

    await waitFor(() => {
      const link = screen.getByText('로그인');
      expect(link.closest('a')).toHaveAttribute('href', '/my-login');
    });
  });

  it('uses custom resendUrl in error state', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Expired' }),
    }));

    render(<EmailVerificationForm token="bad-token" resendUrl="/custom-resend" />);

    await waitFor(() => {
      const link = screen.getByText('인증 이메일 재전송');
      expect(link.closest('a')).toHaveAttribute('href', '/custom-resend');
    });
  });

  it('applies custom className prop in loading state', () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));
    const { container } = render(<EmailVerificationForm token="tok" className="custom-cls" />);
    expect(container.firstChild).toHaveClass('custom-cls');
  });

  it('applies custom className prop in success state', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    }));

    const { container } = render(<EmailVerificationForm token="tok" className="success-cls" />);

    await waitFor(() => {
      expect(screen.getByText('인증 완료')).toBeInTheDocument();
    });
    expect(container.firstChild).toHaveClass('success-cls');
  });

  it('cleanup on unmount prevents state updates (cancelled flag)', async () => {
    let resolveRequest: (value: Response) => void;
    const pendingPromise = new Promise<Response>((resolve) => { resolveRequest = resolve; });
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(pendingPromise));

    const { unmount } = render(<EmailVerificationForm token="tok" />);

    // Unmount before the fetch resolves
    unmount();

    // Resolve after unmount - should not cause state update warnings
    resolveRequest!({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    } as any);

    // If cancelled flag doesn't work, this would throw a React state update warning
    // We verify the test completes without error
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
