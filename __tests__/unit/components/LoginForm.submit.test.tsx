import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { LoginForm } from '../../../src/components/LoginForm';

describe('LoginForm submit behavior', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockReset();
    // Mock window.location
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '' },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function fillForm(email: string, password: string) {
    const emailInput = screen.getByPlaceholderText('name@example.com');
    const passwordInput = screen.getByPlaceholderText('비밀번호를 입력하세요');
    fireEvent.change(emailInput, { target: { value: email } });
    fireEvent.change(passwordInput, { target: { value: password } });
  }

  function submitForm() {
    const form = screen.getByRole('button', { name: '로그인' }).closest('form')!;
    fireEvent.submit(form);
  }

  it('shows validation errors for invalid email and short password on submit', async () => {
    render(<LoginForm />);

    fillForm('invalid-email', '123');
    submitForm();

    await waitFor(() => {
      expect(screen.getByText('유효한 이메일을 입력하세요')).toBeInTheDocument();
      expect(screen.getByText('비밀번호는 6자 이상이어야 합니다')).toBeInTheDocument();
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('calls API with correct data on valid submission', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { id: '1', email: 'test@example.com' } }),
    });

    render(<LoginForm />);
    fillForm('test@example.com', 'password123');
    submitForm();

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
          credentials: 'include',
        }),
      );
    });
  });

  it('shows server error message on failed login (res.ok = false)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: '서버 오류가 발생했습니다' }),
    });

    render(<LoginForm />);
    fillForm('test@example.com', 'wrongpass');
    submitForm();

    await waitFor(() => {
      expect(screen.getByText('서버 오류가 발생했습니다')).toBeInTheDocument();
    });
  });

  it('shows EMAIL_NOT_VERIFIED message when code matches', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ code: 'EMAIL_NOT_VERIFIED' }),
    });

    render(<LoginForm />);
    fillForm('test@example.com', 'password123');
    submitForm();

    await waitFor(() => {
      expect(screen.getByText('이메일 인증이 필요합니다')).toBeInTheDocument();
    });
  });

  it('shows network error when fetch throws', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'));

    render(<LoginForm />);
    fillForm('test@example.com', 'password123');
    submitForm();

    await waitFor(() => {
      expect(screen.getByText('네트워크 오류가 발생했습니다')).toBeInTheDocument();
    });
  });

  it('calls hooks.onSuccess on successful login', async () => {
    const mockUser = { id: '1', email: 'test@example.com' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser }),
    });
    const onSuccess = vi.fn();

    render(<LoginForm hooks={{ onSuccess }} />);
    fillForm('test@example.com', 'password123');
    submitForm();

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(mockUser);
    });
  });

  it('calls hooks.onError on failed login', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: '잘못된 인증 정보' }),
    });
    const onError = vi.fn();

    render(<LoginForm hooks={{ onError }} />);
    fillForm('test@example.com', 'password123');
    submitForm();

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('잘못된 인증 정보');
    });
  });

  it('stops submission when hooks.onBeforeSubmit returns false', async () => {
    const onBeforeSubmit = vi.fn().mockResolvedValue(false);

    render(<LoginForm hooks={{ onBeforeSubmit }} />);
    fillForm('test@example.com', 'password123');
    submitForm();

    await waitFor(() => {
      expect(onBeforeSubmit).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' });
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('shows loading state during submission', async () => {
    let resolvePromise: (value: any) => void;
    const pendingPromise = new Promise((resolve) => { resolvePromise = resolve; });
    mockFetch.mockReturnValueOnce(pendingPromise);

    render(<LoginForm />);
    fillForm('test@example.com', 'password123');
    submitForm();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '로그인 중...' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '로그인 중...' })).toBeDisabled();
    });

    // Resolve the pending request to clean up
    resolvePromise!({
      ok: true,
      json: async () => ({ user: { id: '1' } }),
    });
  });

  it('shows magic link button when showMagicLink is true', () => {
    render(<LoginForm showMagicLink={true} />);
    expect(screen.getByRole('button', { name: '이메일 링크로 로그인' })).toBeInTheDocument();
  });
});
