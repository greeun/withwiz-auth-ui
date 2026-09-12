import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { LoginForm } from '../../../src/components/LoginForm';
import { SignupForm } from '../../../src/components/SignupForm';
import { ResetPasswordForm } from '../../../src/components/ResetPasswordForm';
import { ForgotPasswordForm } from '../../../src/components/ForgotPasswordForm';
import { OAuthButtons } from '../../../src/components/OAuthButtons';

const originalLocation = window.location;

function stubLocation() {
  Object.defineProperty(window, 'location', {
    writable: true,
    value: { href: 'https://app.example.com/login', origin: 'https://app.example.com' },
  });
}

function mockFetch(json: unknown, ok = true) {
  const fn = vi.fn().mockResolvedValue({ ok, json: async () => json });
  global.fetch = fn;
  return fn;
}

function setValue(id: string, value: string) {
  fireEvent.change(document.getElementById(id) as HTMLInputElement, { target: { value } });
}

function submit() {
  fireEvent.submit(document.querySelector('form') as HTMLFormElement);
}

beforeEach(stubLocation);
afterEach(() => {
  Object.defineProperty(window, 'location', { writable: true, value: originalLocation });
  vi.restoreAllMocks();
});

describe('open redirect guard', () => {
  it('LoginForm ignores a foreign redirectAfterLogin and lands on /', async () => {
    mockFetch({ user: { id: '1' } });
    render(<LoginForm redirectAfterLogin="https://evil.com/phish" />);
    setValue('wiz-login-email', 'a@b.com');
    setValue('wiz-login-password', 'password123');
    submit();
    await waitFor(() => expect(window.location.href).toBe('/'));
  });

  it('LoginForm still follows a same-origin path', async () => {
    mockFetch({ user: { id: '1' } });
    render(<LoginForm redirectAfterLogin="/dashboard" />);
    setValue('wiz-login-email', 'a@b.com');
    setValue('wiz-login-password', 'password123');
    submit();
    await waitFor(() => expect(window.location.href).toBe('/dashboard'));
  });

  it('SignupForm ignores a protocol-relative redirectAfterSignup', async () => {
    vi.useFakeTimers();
    try {
      mockFetch({ user: { id: '1' } });
      render(<SignupForm redirectAfterSignup="//evil.com" />);
      setValue('wiz-signup-name', 'Tester');
      setValue('wiz-signup-email', 'a@b.com');
      setValue('wiz-signup-password', 'password123');
      await act(async () => { submit(); });
      await act(async () => { vi.advanceTimersByTime(3000); });
      expect(window.location.href).toBe('/');
    } finally {
      vi.useRealTimers();
    }
  });

  it('OAuthButtons refuses a javascript: loginUrl from the server', async () => {
    mockFetch({ loginUrl: 'javascript:alert(1)' });
    render(<OAuthButtons providers={['google']} />);
    fireEvent.click(screen.getByTestId('oauth-google-btn'));
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    await act(async () => {});
    expect(window.location.href).toBe('https://app.example.com/login');
  });

  it('OAuthButtons follows an https loginUrl', async () => {
    mockFetch({ loginUrl: 'https://accounts.google.com/auth' });
    render(<OAuthButtons providers={['google']} />);
    fireEvent.click(screen.getByTestId('oauth-google-btn'));
    await waitFor(() => expect(window.location.href).toBe('https://accounts.google.com/auth'));
  });
});

describe('SignupForm payload', () => {
  it('sends only validated core fields plus declared extraFields', async () => {
    const fetchMock = mockFetch({ user: { id: '1' } });
    const onBeforeSubmit = vi.fn().mockResolvedValue(true);
    render(
      <SignupForm
        extraFields={[{ name: 'company', label: 'Company' }]}
        hooks={{ onBeforeSubmit }}
      />,
    );
    setValue('wiz-signup-name', 'Tester');
    setValue('wiz-signup-email', 'a@b.com');
    setValue('wiz-signup-password', 'password123');
    setValue('wiz-signup-company', 'ACME');
    submit();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toEqual({ name: 'Tester', email: 'a@b.com', password: 'password123', company: 'ACME' });
    expect(onBeforeSubmit).toHaveBeenCalledWith(body);
  });

  it('sends an empty string for an untouched extra field', async () => {
    const fetchMock = mockFetch({ user: { id: '1' } });
    render(<SignupForm extraFields={[{ name: 'phone', label: 'Phone' }]} />);
    setValue('wiz-signup-name', 'Tester');
    setValue('wiz-signup-email', 'a@b.com');
    setValue('wiz-signup-password', 'password123');
    submit();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.phone).toBe('');
    expect(Object.keys(body).sort()).toEqual(['email', 'name', 'password', 'phone']);
  });
});

describe('autocomplete hints', () => {
  it('LoginForm marks email and current password', () => {
    render(<LoginForm />);
    expect(document.getElementById('wiz-login-email')).toHaveAttribute('autocomplete', 'email');
    expect(document.getElementById('wiz-login-password')).toHaveAttribute('autocomplete', 'current-password');
  });

  it('SignupForm marks name, email and a new password', () => {
    render(<SignupForm />);
    expect(document.getElementById('wiz-signup-name')).toHaveAttribute('autocomplete', 'name');
    expect(document.getElementById('wiz-signup-email')).toHaveAttribute('autocomplete', 'email');
    expect(document.getElementById('wiz-signup-password')).toHaveAttribute('autocomplete', 'new-password');
  });

  it('ResetPasswordForm marks both fields as a new password', () => {
    render(<ResetPasswordForm token="t" />);
    expect(document.getElementById('wiz-reset-password')).toHaveAttribute('autocomplete', 'new-password');
    expect(document.getElementById('wiz-reset-confirm')).toHaveAttribute('autocomplete', 'new-password');
  });

  it('ForgotPasswordForm marks the email field', () => {
    render(<ForgotPasswordForm />);
    expect(document.getElementById('wiz-forgot-email')).toHaveAttribute('autocomplete', 'email');
  });
});
