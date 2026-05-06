import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ResetPasswordForm } from '../../../src/components/ResetPasswordForm';

describe('ResetPasswordForm edge cases', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('uses custom loginUrl in success state', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    }));

    render(<ResetPasswordForm token="valid-token" loginUrl="/custom-login" />);
    fireEvent.change(screen.getByLabelText('새 비밀번호'), { target: { value: 'newpassword123' } });
    fireEvent.change(screen.getByLabelText('비밀번호 확인'), { target: { value: 'newpassword123' } });
    fireEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }));

    await waitFor(() => {
      expect(screen.getByText('비밀번호가 변경되었습니다')).toBeInTheDocument();
    });
    const loginLink = screen.getByRole('link');
    expect(loginLink).toHaveAttribute('href', '/custom-login');
  });

  it('uses custom apiBasePath for the API call', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    }));

    render(<ResetPasswordForm token="tok123" apiBasePath="/custom/api" />);
    fireEvent.change(screen.getByLabelText('새 비밀번호'), { target: { value: 'newpassword123' } });
    fireEvent.change(screen.getByLabelText('비밀번호 확인'), { target: { value: 'newpassword123' } });
    fireEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/custom/api/reset-password', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ token: 'tok123', password: 'newpassword123' }),
      }));
    });
  });

  it('applies custom className prop', () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));
    const { container } = render(<ResetPasswordForm token="tok" className="my-custom-class" />);
    expect(container.firstChild).toHaveClass('my-custom-class');
  });

  it('displays network error message on fetch failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network failure')));

    render(<ResetPasswordForm token="tok" locale="en" />);
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'newpassword123' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'newpassword123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Change Password' }));

    await waitFor(() => {
      expect(screen.getByText('A network error occurred')).toBeInTheDocument();
    });
  });

  it('disables inputs during loading state', async () => {
    let resolveRequest: (value: Response) => void;
    const pendingPromise = new Promise<Response>((resolve) => { resolveRequest = resolve; });
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(pendingPromise));

    render(<ResetPasswordForm token="tok" />);
    fireEvent.change(screen.getByLabelText('새 비밀번호'), { target: { value: 'newpassword123' } });
    fireEvent.change(screen.getByLabelText('비밀번호 확인'), { target: { value: 'newpassword123' } });
    fireEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }));

    await waitFor(() => {
      expect(screen.getByLabelText('새 비밀번호')).toBeDisabled();
      expect(screen.getByLabelText('비밀번호 확인')).toBeDisabled();
      expect(screen.getByRole('button', { name: '변경 중...' })).toBeDisabled();
    });

    resolveRequest!({ ok: true, json: () => Promise.resolve({ success: true }) } as any);
  });
});
