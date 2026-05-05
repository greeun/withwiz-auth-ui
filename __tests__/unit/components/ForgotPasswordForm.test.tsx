import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ForgotPasswordForm } from '../../../src/components/ForgotPasswordForm';

describe('ForgotPasswordForm', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders title and subtitle in default locale (ko)', () => {
    render(<ForgotPasswordForm />);
    expect(screen.getByRole('heading', { name: '비밀번호 찾기' })).toBeInTheDocument();
    expect(screen.getByText('가입한 이메일을 입력하세요')).toBeInTheDocument();
  });

  it('renders email input with correct label and placeholder', () => {
    render(<ForgotPasswordForm />);
    const input = screen.getByLabelText('이메일');
    expect(input).toHaveAttribute('id', 'wiz-forgot-email');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('placeholder', 'name@example.com');
    expect(input).toBeRequired();
  });

  it('uses English when locale="en"', () => {
    render(<ForgotPasswordForm locale="en" />);
    expect(screen.getByRole('heading', { name: 'Forgot Password' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send reset link' })).toBeInTheDocument();
  });

  it('on successful submit shows success message and back-to-login link', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));

    render(<ForgotPasswordForm />);
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: '재설정 링크 보내기' }));

    await waitFor(() => {
      expect(screen.getByText('재설정 링크를 이메일로 보냈습니다')).toBeInTheDocument();
    });
    const link = screen.getByText('로그인으로 돌아가기');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/login');
  });

  it('on API error shows error message from response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: '등록되지 않은 이메일입니다' }),
    }));

    render(<ForgotPasswordForm />);
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'bad@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: '재설정 링크 보내기' }));

    await waitFor(() => {
      expect(screen.getByText('등록되지 않은 이메일입니다')).toBeInTheDocument();
    });
  });

  it('on network error shows "Network error"', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Failed to fetch')));

    render(<ForgotPasswordForm />);
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: '재설정 링크 보내기' }));

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    let resolveRequest: (value: Response) => void;
    const pendingPromise = new Promise<Response>((resolve) => { resolveRequest = resolve; });
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(pendingPromise));

    render(<ForgotPasswordForm />);
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: '재설정 링크 보내기' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '보내는 중...' })).toBeInTheDocument();
    });
    expect(screen.getByLabelText('이메일')).toBeDisabled();

    resolveRequest!({ ok: true } as Response);
    await waitFor(() => {
      expect(screen.getByText('재설정 링크를 이메일로 보냈습니다')).toBeInTheDocument();
    });
  });

  it('custom loginUrl is used in back-to-login link', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));

    render(<ForgotPasswordForm loginUrl="/auth/login" />);
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: '재설정 링크 보내기' }));

    await waitFor(() => {
      expect(screen.getByText('로그인으로 돌아가기')).toBeInTheDocument();
    });
    expect(screen.getByText('로그인으로 돌아가기').closest('a')).toHaveAttribute('href', '/auth/login');
  });

  it('custom className is applied', () => {
    const { container } = render(<ForgotPasswordForm className="my-custom-class" />);
    expect(container.firstChild).toHaveClass('my-custom-class');
  });
});
