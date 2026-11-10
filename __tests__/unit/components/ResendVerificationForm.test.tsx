import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ResendVerificationForm } from '../../../src/components/ResendVerificationForm';
import { ResendVerificationPage } from '../../../src/pages/ResendVerificationPage';
import { ResendVerificationScreen } from '../../../src/screens/ResendVerificationScreen';

describe('ResendVerificationForm', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('기본 로케일(ko)로 제목·안내·필수 이메일 칸을 보여 준다', () => {
    render(<ResendVerificationForm />);
    expect(screen.getByRole('heading', { name: '인증 메일 다시 받기' })).toBeInTheDocument();
    expect(screen.getByText('가입한 이메일을 입력하면 인증 링크를 다시 보냅니다')).toBeInTheDocument();
    const input = screen.getByLabelText('이메일 *');
    expect(input).toHaveAttribute('id', 'wiz-resend-email');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toBeRequired();
  });

  it('en·ja 로케일 문구를 쓴다', () => {
    const { unmount } = render(<ResendVerificationForm locale="en" />);
    expect(screen.getByRole('button', { name: 'Send verification email' })).toBeInTheDocument();
    unmount();
    render(<ResendVerificationForm locale="ja" />);
    expect(screen.getByRole('heading', { name: '認証メールの再送信' })).toBeInTheDocument();
  });

  it('defaultEmail 로 이메일 칸을 미리 채운다', () => {
    render(<ResendVerificationForm defaultEmail="me@example.com" />);
    expect(screen.getByLabelText('이메일 *')).toHaveValue('me@example.com');
  });

  it('emailReadOnly 면 이메일 칸을 고칠 수 없고 그 값으로 제출한다(0.11.2)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    render(<ResendVerificationForm defaultEmail="me@example.com" emailReadOnly />);
    const input = screen.getByLabelText('이메일 *');
    expect(input).toHaveAttribute('readonly');
    expect(input).toHaveAttribute('aria-readonly', 'true');
    fireEvent.click(screen.getByRole('button', { name: '인증 메일 보내기' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ email: 'me@example.com' });
  });

  it('기본은 고칠 수 있다', () => {
    render(<ResendVerificationForm />);
    expect(screen.getByLabelText('이메일 *')).not.toHaveAttribute('readonly');
  });

  it('apiBasePath/resend-verification 에 { email } 을 보내고 성공 안내를 보여 준다', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    const onSuccess = vi.fn();

    render(<ResendVerificationForm apiBasePath="/auth-api" loginUrl="/signin" hooks={{ onSuccess }} />);
    fireEvent.change(screen.getByLabelText('이메일 *'), { target: { value: 'me@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: '인증 메일 보내기' }));

    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument());
    expect(screen.getByText(/인증 메일을 보냈습니다/)).toBeInTheDocument();
    expect(screen.getByText('로그인으로 돌아가기').closest('a')).toHaveAttribute('href', '/signin');
    expect(onSuccess).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/auth-api/resend-verification');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ email: 'me@example.com' });
  });

  it('서버 오류는 alert 로, 네트워크 오류는 로케일 문구로 보여 준다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 429, json: () => Promise.resolve({ error: '요청이 너무 많습니다' }) }));
    const onError = vi.fn();
    const { unmount } = render(<ResendVerificationForm hooks={{ onError }} />);
    fireEvent.change(screen.getByLabelText('이메일 *'), { target: { value: 'me@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: '인증 메일 보내기' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('요청이 너무 많습니다'));
    expect(onError).toHaveBeenCalledTimes(1);
    unmount();

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Failed to fetch')));
    render(<ResendVerificationForm />);
    fireEvent.change(screen.getByLabelText('이메일 *'), { target: { value: 'me@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: '인증 메일 보내기' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('네트워크 오류가 발생했습니다'));
  });

  it('onBeforeSubmit 이 false 면 요청하지 않는다', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const onBeforeSubmit = vi.fn().mockResolvedValue(false);
    render(<ResendVerificationForm hooks={{ onBeforeSubmit }} />);
    fireEvent.change(screen.getByLabelText('이메일 *'), { target: { value: 'me@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: '인증 메일 보내기' }));
    await waitFor(() => expect(onBeforeSubmit).toHaveBeenCalledWith({ email: 'me@example.com' }));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('Page·Screen 이 AuthLayout 안에 폼을 그리고 인라인 스타일이 없다', () => {
    for (const C of [ResendVerificationPage, ResendVerificationScreen]) {
      const { container, unmount } = render(<C />);
      expect(screen.getByRole('heading', { name: '인증 메일 다시 받기' })).toBeInTheDocument();
      expect(container.querySelector('[style]')).toBeNull();
      unmount();
    }
  });
});
