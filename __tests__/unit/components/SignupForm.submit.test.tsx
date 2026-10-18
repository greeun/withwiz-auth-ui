import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { SignupForm } from '../../../src/components/SignupForm';

describe('SignupForm submit', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  function mockFetch(response: { ok: boolean; json: () => Promise<unknown> }) {
    global.fetch = vi.fn().mockResolvedValue(response);
  }

  function fillForm(overrides: { name?: string; email?: string; password?: string } = {}) {
    const name = overrides.name ?? 'TestUser';
    const email = overrides.email ?? 'test@example.com';
    const password = overrides.password ?? 'password123';

    fireEvent.change(screen.getByLabelText(/이름/i) || screen.getById('wiz-signup-name'), {
      target: { value: name },
    });
    fireEvent.change(screen.getById('wiz-signup-email') || screen.getByLabelText(/이메일/i), {
      target: { value: email },
    });
    fireEvent.change(screen.getById('wiz-signup-password') || screen.getByLabelText(/비밀번호/i), {
      target: { value: password },
    });
  }

  function fillFormById(overrides: { name?: string; email?: string; password?: string } = {}) {
    const name = overrides.name ?? 'TestUser';
    const email = overrides.email ?? 'test@example.com';
    const password = overrides.password ?? 'password123';

    const nameInput = document.getElementById('wiz-signup-name') as HTMLInputElement;
    const emailInput = document.getElementById('wiz-signup-email') as HTMLInputElement;
    const passwordInput = document.getElementById('wiz-signup-password') as HTMLInputElement;

    fireEvent.change(nameInput, { target: { value: name } });
    fireEvent.change(emailInput, { target: { value: email } });
    fireEvent.change(passwordInput, { target: { value: password } });
  }

  function submitForm() {
    const form = document.querySelector('form') as HTMLFormElement;
    fireEvent.submit(form);
  }

  it('shows validation errors for short name, invalid email, short password', async () => {
    mockFetch({ ok: true, json: async () => ({ user: {} }) });

    render(<SignupForm />);

    fillFormById({ name: 'A', email: 'invalid', password: 'short' });
    submitForm();

    await waitFor(() => {
      expect(screen.getByText('이름은 2자 이상이어야 합니다')).toBeInTheDocument();
      expect(screen.getByText(/유효한 이메일/i)).toBeInTheDocument();
      expect(screen.getByText('비밀번호는 8자 이상이어야 합니다')).toBeInTheDocument();
    });

    // fetch should not have been called due to validation errors
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('calls API with correct data on valid submit', async () => {
    mockFetch({ ok: true, json: async () => ({ user: { id: '1' } }) });

    render(<SignupForm />);
    fillFormById({ name: 'TestUser', email: 'test@example.com', password: 'password123' });
    submitForm();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    const [url, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('/api/auth/signup');
    const body = JSON.parse(options.body);
    expect(body.name).toBe('TestUser');
    expect(body.email).toBe('test@example.com');
    expect(body.password).toBe('password123');
  });

  it('shows success state after successful registration', async () => {
    mockFetch({ ok: true, json: async () => ({ user: { id: '1' } }) });

    render(<SignupForm />);
    fillFormById();
    submitForm();

    await waitFor(() => {
      expect(screen.getByText('가입 완료!')).toBeInTheDocument();
    });

    expect(screen.getByText('인증 이메일을 확인해주세요')).toBeInTheDocument();
  });

  it('shows server error on failed registration', async () => {
    mockFetch({ ok: false, json: async () => ({ error: 'Email already exists' }) });

    render(<SignupForm />);
    fillFormById();
    submitForm();

    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });
  });

  it('shows network error when fetch throws', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));

    render(<SignupForm />);
    fillFormById();
    submitForm();

    await waitFor(() => {
      expect(screen.getByText(/네트워크/i)).toBeInTheDocument();
    });
  });

  it('calls hooks.onSuccess with user data on success', async () => {
    const userData = { id: '1', email: 'test@example.com', name: 'TestUser' };
    mockFetch({ ok: true, json: async () => ({ user: userData }) });

    const onSuccess = vi.fn();
    render(<SignupForm hooks={{ onSuccess }} />);
    fillFormById();
    submitForm();

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(userData, { body: { user: userData } });
    });
  });

  it('calls hooks.onError on API failure', async () => {
    mockFetch({ ok: false, json: async () => ({ error: 'Server error' }) });

    const onError = vi.fn();
    render(<SignupForm hooks={{ onError }} />);
    fillFormById();
    submitForm();

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('Server error', expect.objectContaining({ text: 'Server error', network: false }));
    });
  });

  it('stops submission when hooks.onBeforeSubmit returns false', async () => {
    mockFetch({ ok: true, json: async () => ({ user: {} }) });

    const onBeforeSubmit = vi.fn().mockResolvedValue(false);
    render(<SignupForm hooks={{ onBeforeSubmit }} />);
    fillFormById();
    submitForm();

    await waitFor(() => {
      expect(onBeforeSubmit).toHaveBeenCalled();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('includes extra field values in API request', async () => {
    mockFetch({ ok: true, json: async () => ({ user: { id: '1' } }) });

    render(
      <SignupForm
        extraFields={[
          { name: 'company', label: 'Company', placeholder: 'Your company' },
        ]}
      />
    );

    fillFormById();
    const companyInput = document.getElementById('wiz-signup-company') as HTMLInputElement;
    fireEvent.change(companyInput, { target: { value: 'Acme Inc' } });
    submitForm();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    const [, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.company).toBe('Acme Inc');
    expect(body.name).toBe('TestUser');
    expect(body.email).toBe('test@example.com');
    expect(body.password).toBe('password123');
  });

  describe('0.8', () => {
    it('sends extraPayload but never lets it override form fields', async () => {
      mockFetch({ ok: true, json: async () => ({ user: { id: '1' } }) });
      render(
        <SignupForm
          extraFields={[{ name: 'company', label: '회사' }]}
          extraPayload={{ language: 'ja', email: 'evil@example.com', password: 'x', name: 'x', company: 'x' }}
        />,
      );
      fillFormById({ name: '홍길동', email: 'user@example.com', password: 'password123' });
      fireEvent.change(document.getElementById('wiz-signup-company') as HTMLInputElement, { target: { value: 'Acme' } });
      submitForm();
      await waitFor(() => expect(global.fetch).toHaveBeenCalled());
      const sent = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
      expect(sent).toEqual({
        language: 'ja',
        name: '홍길동',
        email: 'user@example.com',
        password: 'password123',
        company: 'Acme',
      });
    });

    it('passes the envelope user and redirects to the returned path', async () => {
      const original = window.location;
      Object.defineProperty(window, 'location', { value: { href: '' }, writable: true, configurable: true });
      vi.useFakeTimers({ shouldAdvanceTime: true });
      try {
        const body = { success: true, data: { user: { id: '9' } } };
        mockFetch({ ok: true, json: async () => body });
        const onSuccess = vi.fn(async () => '/welcome');
        render(<SignupForm hooks={{ onSuccess }} redirectAfterSignup="/default" />);
        fillFormById({ name: '홍길동' });
        submitForm();
        await waitFor(() => expect(onSuccess).toHaveBeenCalledWith({ id: '9' }, { body }));
        await act(async () => { vi.advanceTimersByTime(3000); });
        expect(window.location.href).toBe('/welcome');
      } finally {
        vi.useRealTimers();
        Object.defineProperty(window, 'location', { value: original, writable: true, configurable: true });
      }
    });

    it('uses redirectAfterSignup when the hook returns an empty string', async () => {
      const original = window.location;
      Object.defineProperty(window, 'location', { value: { href: '' }, writable: true, configurable: true });
      vi.useFakeTimers({ shouldAdvanceTime: true });
      try {
        mockFetch({ ok: true, json: async () => ({ user: { id: '1' } }) });
        const onSuccess = vi.fn(async () => '');
        render(<SignupForm hooks={{ onSuccess }} redirectAfterSignup="/x" />);
        fillFormById({ name: '홍길동' });
        submitForm();
        await waitFor(() => expect(onSuccess).toHaveBeenCalled());
        await act(async () => { vi.advanceTimersByTime(3000); });
        expect(window.location.href).toBe('/x');
      } finally {
        vi.useRealTimers();
        Object.defineProperty(window, 'location', { value: original, writable: true, configurable: true });
      }
    });

    it('shows the hook error instead of the success screen when the hook throws', async () => {
      mockFetch({ ok: true, json: async () => ({ user: { id: '1' } }) });
      render(<SignupForm hooks={{ onSuccess: async () => { throw new Error('후처리 실패'); } }} />);
      fillFormById({ name: '홍길동' });
      submitForm();
      expect(await screen.findByText('후처리 실패')).toBeInTheDocument();
      expect(screen.queryByText('가입 완료!')).not.toBeInTheDocument();
    });
  });
});
