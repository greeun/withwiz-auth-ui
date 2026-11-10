import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from '../../../src/components/LoginForm';
import { EmailVerificationForm } from '../../../src/components/EmailVerificationForm';
import { ResendVerificationForm } from '../../../src/components/ResendVerificationForm';
import { withEmailQuery } from '../../../src/utils/link-email';

// 0.11 — 미인증 계정이 재발송 화면까지 이어지는 길: 로그인 거부·인증 실패 화면의 링크가 이메일을 넘기고,
// 재발송 폼은 ?email= 로 칸을 미리 채운다.

const originalLocation = window.location;
function setSearch(search: string) {
  Object.defineProperty(window, 'location', {
    writable: true,
    value: { href: `http://localhost/x${search}`, origin: 'http://localhost', search },
  });
}
afterEach(() => {
  Object.defineProperty(window, 'location', { writable: true, value: originalLocation });
  vi.unstubAllGlobals();
});

describe('withEmailQuery', () => {
  it('쿼리·해시를 지키며 email 을 붙이고, 이메일이 없으면 그대로 둔다', () => {
    expect(withEmailQuery('/resend-verification', 'a+b@x.io')).toBe('/resend-verification?email=a%2Bb%40x.io');
    expect(withEmailQuery('/r?lang=ko#top', 'a@x.io')).toBe('/r?lang=ko&email=a%40x.io#top');
    expect(withEmailQuery('/r', undefined)).toBe('/r');
  });
});

describe('LoginForm — EMAIL_NOT_VERIFIED', () => {
  const fill = () => {
    fireEvent.change(screen.getByLabelText('이메일 *'), { target: { value: 'pending@example.com' } });
    fireEvent.change(screen.getByLabelText('비밀번호 *'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: '로그인' }));
  };

  it('미인증 거부면 입력한 이메일을 담은 재발송 링크를 보여 준다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 403, json: () => Promise.resolve({ success: false, error: 'Email not verified', code: 'EMAIL_NOT_VERIFIED' }),
    }));
    render(<LoginForm resendVerificationUrl="/ko/resend-verification" />);
    fill();
    const link = await screen.findByRole('link', { name: '인증 메일 다시 받기' });
    expect(link).toHaveAttribute('href', '/ko/resend-verification?email=pending%40example.com');
    expect(screen.getByRole('alert')).toHaveTextContent('이메일 인증이 필요합니다');
  });

  it('다른 실패에는 재발송 링크가 없다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 401, json: () => Promise.resolve({ success: false, error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' }),
    }));
    render(<LoginForm />);
    fill();
    await screen.findByRole('alert');
    expect(screen.queryByRole('link', { name: '인증 메일 다시 받기' })).toBeNull();
  });
});

describe('EmailVerificationForm — 실패 화면의 재발송 링크', () => {
  it('링크의 ?email= 을 재발송 주소로 넘긴다', async () => {
    setSearch('?email=me%40example.com&token=bad');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 400, json: () => Promise.resolve({ error: 'Invalid token' }) }));
    render(<EmailVerificationForm token="bad" />);
    const link = await screen.findByRole('link', { name: '인증 이메일 재전송' });
    expect(link).toHaveAttribute('href', '/resend-verification?email=me%40example.com');
  });
});

describe('ResendVerificationForm — ?email= 미리 채우기', () => {
  it('주소의 email 로 칸을 채우고, defaultEmail 이 있으면 그것을 쓴다', async () => {
    setSearch('?email=link%40example.com');
    const { unmount } = render(<ResendVerificationForm />);
    await waitFor(() => expect(screen.getByLabelText('이메일 *')).toHaveValue('link@example.com'));
    unmount();
    render(<ResendVerificationForm defaultEmail="prop@example.com" />);
    expect(screen.getByLabelText('이메일 *')).toHaveValue('prop@example.com');
  });
});
