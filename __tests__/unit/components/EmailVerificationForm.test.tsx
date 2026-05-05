import { render, screen, waitFor } from '@testing-library/react';
import { EmailVerificationForm } from '../../../src/components/EmailVerificationForm';

describe('EmailVerificationForm', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading state on mount', () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));
    render(<EmailVerificationForm token="valid-token" />);
    expect(screen.getByText('인증 중...')).toBeInTheDocument();
  });

  it('shows success on valid token', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    }));

    render(<EmailVerificationForm token="valid-token" />);

    await waitFor(() => {
      expect(screen.getByText('인증 완료')).toBeInTheDocument();
      expect(screen.getByText('이메일이 성공적으로 인증되었습니다')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/auth/verify-email', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ token: 'valid-token' }),
    }));
  });

  it('shows login button on success with default loginUrl', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    }));

    render(<EmailVerificationForm token="valid-token" />);

    await waitFor(() => {
      const link = screen.getByText('로그인');
      expect(link.closest('a')).toHaveAttribute('href', '/login');
    });
  });

  it('shows error on invalid token', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Invalid token' }),
    }));

    render(<EmailVerificationForm token="bad-token" />);

    await waitFor(() => {
      expect(screen.getByText('인증 실패')).toBeInTheDocument();
      expect(screen.getByText('Invalid token')).toBeInTheDocument();
    });
  });

  it('shows resend link on error with default resendUrl', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Expired' }),
    }));

    render(<EmailVerificationForm token="expired-token" />);

    await waitFor(() => {
      const link = screen.getByText('인증 이메일 재전송');
      expect(link.closest('a')).toHaveAttribute('href', '/resend-verification');
    });
  });

  it('shows network error on fetch failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fetch failed')));

    render(<EmailVerificationForm token="any-token" />);

    await waitFor(() => {
      expect(screen.getByText('인증 실패')).toBeInTheDocument();
      expect(screen.getByText('네트워크 오류가 발생했습니다')).toBeInTheDocument();
    });
  });

  it('renders in English when locale="en"', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    }));

    render(<EmailVerificationForm token="valid-token" locale="en" />);

    await waitFor(() => {
      expect(screen.getByText('Verified')).toBeInTheDocument();
      expect(screen.getByText('Your email has been verified successfully')).toBeInTheDocument();
    });
  });

  it('uses custom apiBasePath', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    }));

    render(<EmailVerificationForm token="token" apiBasePath="/custom/auth" />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/custom/auth/verify-email', expect.anything());
    });
  });
});
