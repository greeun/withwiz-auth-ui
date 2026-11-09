import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from '../../../src/components/LoginForm';

const mockFetch = vi.fn();

const mfaRequired = (extra = {}) => ({
  ok: false,
  status: 401,
  json: async () => ({
    success: false,
    error: { code: 40110, key: 'MFA_REQUIRED', message: 'x', userMessage: { description: '2단계 인증 필요' } },
    ...extra,
  }),
});
const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body });

async function loginToSecondStep(extra = {}, props: Record<string, unknown> = {}) {
  mockFetch.mockResolvedValueOnce(mfaRequired(extra));
  render(<LoginForm {...props} />);
  fireEvent.change(screen.getByLabelText(/이메일/), { target: { value: 'a@b.com' } });
  fireEvent.change(screen.getByLabelText(/비밀번호/), { target: { value: 'secret12' } });
  fireEvent.click(screen.getByRole('button', { name: '로그인' }));
  await screen.findByLabelText('인증 코드');
}
const secondBody = () => JSON.parse(mockFetch.mock.calls[1][1].body);

beforeEach(() => {
  global.fetch = mockFetch;
  mockFetch.mockReset();
  Object.defineProperty(window, 'location', { writable: true, value: { href: '', origin: 'http://localhost' } });
});

describe('LoginForm 2단계 전환', () => {
  it('MFA_REQUIRED 면 오류 대신 코드 입력 단계로 바뀐다', async () => {
    const onError = vi.fn();
    await loginToSecondStep({}, { hooks: { onError } });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(onError).not.toHaveBeenCalled();
    expect(screen.getByLabelText('인증 코드')).toBeInTheDocument();
  });

  it('2단계에서 OAuth 버튼·구분선·비밀번호 찾기·회원가입 링크를 숨긴다', async () => {
    await loginToSecondStep({}, { providers: ['google'] });
    expect(screen.queryByText(/Google/)).toBeNull();
    expect(screen.queryByText('또는')).toBeNull();
    expect(screen.queryByText('비밀번호를 잊으셨나요?')).toBeNull();
    expect(screen.queryByText('회원가입')).toBeNull();
  });

  it('본문 mfaToken(문자열)을 검증 요청에 싣는다', async () => {
    await loginToSecondStep({ mfaToken: 'tok' });
    mockFetch.mockResolvedValueOnce(ok({ success: true, user: {} }));
    fireEvent.change(screen.getByLabelText('인증 코드'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: '확인' }));
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
    expect(secondBody().mfaToken).toBe('tok');
  });

  it('cookie 모드(mfaToken 없음): 검증 요청 본문에 mfaToken 키가 없다', async () => {
    await loginToSecondStep();
    mockFetch.mockResolvedValueOnce(ok({ success: true, user: {} }));
    fireEvent.change(screen.getByLabelText('인증 코드'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: '확인' }));
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
    expect('mfaToken' in secondBody()).toBe(false);
  });

  it('mfaToken 이 문자열이 아니면 무시한다', async () => {
    await loginToSecondStep({ mfaToken: 123 });
    mockFetch.mockResolvedValueOnce(ok({ success: true, user: {} }));
    fireEvent.change(screen.getByLabelText('인증 코드'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: '확인' }));
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
    expect('mfaToken' in secondBody()).toBe(false);
  });

  it('검증 성공 시에만 hooks.onSuccess 를 부르고 redirectAfterLogin 으로 간다', async () => {
    const onSuccess = vi.fn();
    await loginToSecondStep({}, { hooks: { onSuccess }, redirectAfterLogin: '/home' });
    expect(onSuccess).not.toHaveBeenCalled();
    mockFetch.mockResolvedValueOnce(ok({ success: true, user: { id: 'u1' } }));
    fireEvent.change(screen.getByLabelText('인증 코드'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: '확인' }));
    await waitFor(() => expect(window.location.href).toBe('/home'));
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('2단계 성공 시 안전하지 않은 redirectAfterLogin 은 막고 / 로 간다', async () => {
    await loginToSecondStep({}, { redirectAfterLogin: 'https://evil.com' });
    mockFetch.mockResolvedValueOnce(ok({ success: true, user: { id: 'u1' } }));
    fireEvent.change(screen.getByLabelText('인증 코드'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: '확인' }));
    await waitFor(() => expect(window.location.href).not.toBe(''));
    expect(window.location.href).toBe('/');
  });

  it('처음부터 다시: 1단계로 돌아가고 이메일은 유지, 비밀번호는 빈 값', async () => {
    await loginToSecondStep();
    fireEvent.click(screen.getByRole('button', { name: '처음부터 다시' }));
    expect((screen.getByLabelText(/이메일/) as HTMLInputElement).value).toBe('a@b.com');
    expect((screen.getByLabelText(/비밀번호/) as HTMLInputElement).value).toBe('');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('mfaMessages 로 2단계 문구를 바꿀 수 있다', async () => {
    mockFetch.mockResolvedValueOnce(mfaRequired());
    render(<LoginForm mfaMessages={{ title: '두 번째 확인' }} />);
    fireEvent.change(screen.getByLabelText(/이메일/), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/비밀번호/), { target: { value: 'secret12' } });
    fireEvent.click(screen.getByRole('button', { name: '로그인' }));
    expect(await screen.findByRole('heading', { name: '두 번째 확인' })).toBeInTheDocument();
  });

  it('slots.header 를 준 소비자는 2단계에서도 그 header 를 본다', async () => {
    await loginToSecondStep({}, { slots: { header: <div>MY-HEADER</div> } });
    expect(screen.getByText('MY-HEADER')).toBeInTheDocument();
  });

  it('MFA_REQUIRED 가 아닌 401 은 0.9 와 같이 오류로 보인다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ success: false, error: { code: 40101, key: 'INVALID_CREDENTIALS', message: 'x', userMessage: { description: '잘못됨' } } }),
    });
    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText(/이메일/), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/비밀번호/), { target: { value: 'secret12' } });
    fireEvent.click(screen.getByRole('button', { name: '로그인' }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '2단계 인증' })).toBeNull();
  });
});
