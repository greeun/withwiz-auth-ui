import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RegisterForm } from '../../../src/components/RegisterForm';

describe('RegisterForm submit', () => {
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

    fireEvent.change(screen.getByLabelText(/이름/i) || screen.getById('wiz-register-name'), {
      target: { value: name },
    });
    fireEvent.change(screen.getById('wiz-register-email') || screen.getByLabelText(/이메일/i), {
      target: { value: email },
    });
    fireEvent.change(screen.getById('wiz-register-password') || screen.getByLabelText(/비밀번호/i), {
      target: { value: password },
    });
  }

  function fillFormById(overrides: { name?: string; email?: string; password?: string } = {}) {
    const name = overrides.name ?? 'TestUser';
    const email = overrides.email ?? 'test@example.com';
    const password = overrides.password ?? 'password123';

    const nameInput = document.getElementById('wiz-register-name') as HTMLInputElement;
    const emailInput = document.getElementById('wiz-register-email') as HTMLInputElement;
    const passwordInput = document.getElementById('wiz-register-password') as HTMLInputElement;

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

    render(<RegisterForm />);

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

    render(<RegisterForm />);
    fillFormById({ name: 'TestUser', email: 'test@example.com', password: 'password123' });
    submitForm();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    const [url, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('/api/auth/register');
    const body = JSON.parse(options.body);
    expect(body.name).toBe('TestUser');
    expect(body.email).toBe('test@example.com');
    expect(body.password).toBe('password123');
  });

  it('shows success state after successful registration', async () => {
    mockFetch({ ok: true, json: async () => ({ user: { id: '1' } }) });

    render(<RegisterForm />);
    fillFormById();
    submitForm();

    await waitFor(() => {
      expect(screen.getByText('가입 완료!')).toBeInTheDocument();
    });

    expect(screen.getByText('인증 이메일을 확인해주세요')).toBeInTheDocument();
  });

  it('shows server error on failed registration', async () => {
    mockFetch({ ok: false, json: async () => ({ error: 'Email already exists' }) });

    render(<RegisterForm />);
    fillFormById();
    submitForm();

    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });
  });

  it('shows network error when fetch throws', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));

    render(<RegisterForm />);
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
    render(<RegisterForm hooks={{ onSuccess }} />);
    fillFormById();
    submitForm();

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(userData);
    });
  });

  it('calls hooks.onError on API failure', async () => {
    mockFetch({ ok: false, json: async () => ({ error: 'Server error' }) });

    const onError = vi.fn();
    render(<RegisterForm hooks={{ onError }} />);
    fillFormById();
    submitForm();

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('Server error');
    });
  });

  it('stops submission when hooks.onBeforeSubmit returns false', async () => {
    mockFetch({ ok: true, json: async () => ({ user: {} }) });

    const onBeforeSubmit = vi.fn().mockResolvedValue(false);
    render(<RegisterForm hooks={{ onBeforeSubmit }} />);
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
      <RegisterForm
        extraFields={[
          { name: 'company', label: 'Company', placeholder: 'Your company' },
        ]}
      />
    );

    fillFormById();
    const companyInput = document.getElementById('wiz-register-company') as HTMLInputElement;
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
});
