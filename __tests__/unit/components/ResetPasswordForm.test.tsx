import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ResetPasswordForm } from '../../../src/components/ResetPasswordForm';

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders title and two password fields in default locale (ko)', () => {
    render(<ResetPasswordForm token="valid-token" />);
    expect(screen.getByRole('heading', { name: '비밀번호 재설정' })).toBeInTheDocument();
    expect(screen.getByLabelText('새 비밀번호')).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호 확인')).toBeInTheDocument();
  });

  it('renders in English when locale="en"', () => {
    render(<ResetPasswordForm token="valid-token" locale="en" />);
    expect(screen.getByRole('heading', { name: 'Reset Password' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Change Password' })).toBeInTheDocument();
  });

  it('shows validation error when passwords do not match', async () => {
    render(<ResetPasswordForm token="valid-token" />);
    fireEvent.change(screen.getByLabelText('새 비밀번호'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('비밀번호 확인'), { target: { value: 'different123' } });
    fireEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }));

    await waitFor(() => {
      expect(screen.getByText('비밀번호가 일치하지 않습니다')).toBeInTheDocument();
    });
  });

  it('shows validation error for short password', async () => {
    render(<ResetPasswordForm token="valid-token" locale="en" />);
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'short' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: 'Change Password' }));

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    });
  });

  it('calls API and shows success on valid submit', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    }));

    render(<ResetPasswordForm token="valid-token" />);
    fireEvent.change(screen.getByLabelText('새 비밀번호'), { target: { value: 'newpassword123' } });
    fireEvent.change(screen.getByLabelText('비밀번호 확인'), { target: { value: 'newpassword123' } });
    fireEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }));

    await waitFor(() => {
      expect(screen.getByText('비밀번호가 변경되었습니다')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/auth/reset-password', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ token: 'valid-token', password: 'newpassword123' }),
    }));
  });

  it('shows API error on failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Token expired' }),
    }));

    render(<ResetPasswordForm token="expired-token" />);
    fireEvent.change(screen.getByLabelText('새 비밀번호'), { target: { value: 'newpassword123' } });
    fireEvent.change(screen.getByLabelText('비밀번호 확인'), { target: { value: 'newpassword123' } });
    fireEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }));

    await waitFor(() => {
      expect(screen.getByText('Token expired')).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    let resolveRequest: (value: Response) => void;
    const pendingPromise = new Promise<Response>((resolve) => { resolveRequest = resolve; });
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(pendingPromise));

    render(<ResetPasswordForm token="valid-token" />);
    fireEvent.change(screen.getByLabelText('새 비밀번호'), { target: { value: 'newpassword123' } });
    fireEvent.change(screen.getByLabelText('비밀번호 확인'), { target: { value: 'newpassword123' } });
    fireEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '변경 중...' })).toBeInTheDocument();
    });

    resolveRequest!({ ok: true, json: () => Promise.resolve({ success: true }) } as any);
    await waitFor(() => {
      expect(screen.getByText('비밀번호가 변경되었습니다')).toBeInTheDocument();
    });
  });

  it('success state shows login link with default loginUrl', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    }));

    render(<ResetPasswordForm token="valid-token" />);
    fireEvent.change(screen.getByLabelText('새 비밀번호'), { target: { value: 'newpassword123' } });
    fireEvent.change(screen.getByLabelText('비밀번호 확인'), { target: { value: 'newpassword123' } });
    fireEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }));

    await waitFor(() => {
      expect(screen.getByText('비밀번호가 변경되었습니다')).toBeInTheDocument();
    });
    const loginLink = screen.getByRole('link');
    expect(loginLink).toHaveAttribute('href', '/login');
  });
});
