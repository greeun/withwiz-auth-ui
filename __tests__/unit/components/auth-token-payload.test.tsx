import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { EmailVerificationForm } from '../../../src/components/EmailVerificationForm';
import { ResetPasswordForm } from '../../../src/components/ResetPasswordForm';

/**
 * The token-bearing endpoints identify the account by **email + token**, and the
 * verification links this library is paired with carry both (`?email=&token=`).
 * These forms used to post the token alone, so every request was rejected before it
 * reached the token check — the two screens could never succeed.
 *
 * These tests pin the request body, not the rendering.
 */

const body = (fetchMock: ReturnType<typeof vi.fn>) => JSON.parse(fetchMock.mock.calls[0][1].body);

const okFetch = () => vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ success: true }) });

async function submitReset() {
  fireEvent.change(screen.getByLabelText('새 비밀번호'), { target: { value: 'newpassword123' } });
  fireEvent.change(screen.getByLabelText('비밀번호 확인'), { target: { value: 'newpassword123' } });
  fireEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }));
}

describe('token endpoints receive the account email', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.history.replaceState({}, '', '/');
  });
  afterEach(cleanup);

  it('verify-email sends the email prop alongside the token', async () => {
    const fetchMock = okFetch();
    vi.stubGlobal('fetch', fetchMock);

    render(<EmailVerificationForm token="tok-1" email="user@example.com" />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(body(fetchMock)).toEqual({ email: 'user@example.com', token: 'tok-1' });
  });

  it('verify-email falls back to the email in the link query', async () => {
    const fetchMock = okFetch();
    vi.stubGlobal('fetch', fetchMock);
    window.history.replaceState({}, '', '/verify-email?email=from%2Blink%40example.com&token=tok-2');

    render(<EmailVerificationForm token="tok-2" />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(body(fetchMock).email).toBe('from+link@example.com');
  });

  it('verify-email omits email when neither prop nor query has one', async () => {
    const fetchMock = okFetch();
    vi.stubGlobal('fetch', fetchMock);

    render(<EmailVerificationForm token="tok-3" />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(body(fetchMock)).toEqual({ token: 'tok-3' });
  });

  it('reset-password sends the email prop alongside token and password', async () => {
    const fetchMock = okFetch();
    vi.stubGlobal('fetch', fetchMock);

    render(<ResetPasswordForm token="tok-4" email="user@example.com" />);
    await submitReset();

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(body(fetchMock)).toEqual({
      email: 'user@example.com',
      token: 'tok-4',
      password: 'newpassword123',
    });
  });

  it('reset-password falls back to the email in the link query', async () => {
    const fetchMock = okFetch();
    vi.stubGlobal('fetch', fetchMock);
    window.history.replaceState({}, '', '/reset-password?email=q%40example.com&token=tok-5');

    render(<ResetPasswordForm token="tok-5" />);
    await submitReset();

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(body(fetchMock).email).toBe('q@example.com');
  });
});
