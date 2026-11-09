import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MfaSettings } from '../../../src/components/MfaSettings';

const mockFetch = vi.fn();

const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body });
const fail = (status: number, body: unknown) => ({ ok: false, status, json: async () => body });

const statusOff = () => ok({ success: true, enabled: false, recoveryCodesRemaining: 0 });
const statusOn = (n = 10) => ok({ success: true, enabled: true, recoveryCodesRemaining: n });
const SETUP = { success: true, secret: 'JBSWY3DPEHPK3PXP', otpauthUri: 'otpauth://totp/binder:a%40b.c?secret=JBSWY3DPEHPK3PXP&issuer=binder' };
const CODES = Array.from({ length: 10 }, (_, i) => `code-${String(i).padStart(4, '0')}`);
const codesBody = () => ok({ success: true, recoveryCodes: CODES });

const btn = (name: string) => screen.getByRole('button', { name });
const typeCode = (value: string, label = '인증 코드') =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
const bodyOf = (call: number) => JSON.parse(mockFetch.mock.calls[call][1].body);

function stubClipboard() {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  return writeText;
}

/** 꺼짐 화면 → [켜기] → setup 화면까지 진행한다. */
async function toSetup(props: Parameters<typeof MfaSettings>[0] = {}) {
  mockFetch.mockResolvedValueOnce(statusOff()).mockResolvedValueOnce(ok(SETUP));
  const r = render(<MfaSettings {...props} />);
  fireEvent.click(await screen.findByRole('button', { name: '2단계 인증 켜기' }));
  await screen.findByLabelText('인증 코드');
  return r;
}

/** setup → 코드 입력 → enable 성공 → 복구 코드 화면까지 진행한다. */
async function toRecoveryCodes(props: Parameters<typeof MfaSettings>[0] = {}) {
  const r = await toSetup(props);
  mockFetch.mockResolvedValueOnce(codesBody());
  typeCode('123456');
  fireEvent.click(btn('켜기'));
  await screen.findByText(CODES[0]);
  return r;
}

beforeEach(() => {
  global.fetch = mockFetch;
  mockFetch.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
  delete (navigator as { clipboard?: unknown }).clipboard;
});

describe('MfaSettings', () => {
  it('불러오는 동안 loading 문구를 보인다', () => {
    mockFetch.mockReturnValueOnce(new Promise(() => {}));
    render(<MfaSettings />);
    expect(screen.getByText('불러오는 중...')).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/mfa', expect.objectContaining({ method: 'GET', credentials: 'include' }));
  });

  it('404 MFA_NOT_CONFIGURED: 아무것도 그리지 않는다(container 비어 있음), slots.notConfigured 를 주면 그것을 그린다', async () => {
    const notConfigured = () => fail(404, { success: false, error: { key: 'MFA_NOT_CONFIGURED', message: 'x' } });
    const onError = vi.fn();
    mockFetch.mockResolvedValueOnce(notConfigured());
    const { container, unmount } = render(<MfaSettings hooks={{ onError }} />);
    await waitFor(() => expect(container).toBeEmptyDOMElement());
    unmount();

    mockFetch.mockResolvedValueOnce(notConfigured());
    render(<MfaSettings slots={{ notConfigured: <p>MFA 미지원</p> }} />);
    expect(await screen.findByText('MFA 미지원')).toBeInTheDocument();
    expect(onError).not.toHaveBeenCalled();
  });

  it('401: onUnauthenticated 를 부르고 unauthenticated 문구', async () => {
    mockFetch.mockResolvedValueOnce(fail(401, { success: false, error: { key: 'UNAUTHORIZED', message: 'x' } }));
    const onUnauthenticated = vi.fn();
    const onError = vi.fn();
    render(<MfaSettings hooks={{ onUnauthenticated, onError }} />);
    expect(await screen.findByText('로그인이 필요합니다')).toBeInTheDocument();
    expect(onUnauthenticated).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });

  it('그 밖의 상태 조회 실패: 오류와 [다시 시도], 누르면 다시 조회한다', async () => {
    mockFetch
      .mockResolvedValueOnce(fail(500, { error: { key: 'X', userMessage: { description: '서버 오류' } } }))
      .mockResolvedValueOnce(statusOn(5));
    render(<MfaSettings />);
    expect(await screen.findByRole('alert')).toHaveTextContent('서버 오류');
    fireEvent.click(btn('다시 시도'));
    expect(await screen.findByText('2단계 인증이 켜져 있습니다')).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('꺼짐 → 켜기 → setup: QR(role=img)·비밀 키·코드 입력란, issuerLabel 표시', async () => {
    await toSetup({ issuerLabel: 'binder (a@b.c)' });
    expect(mockFetch.mock.calls[1][0]).toBe('/api/auth/mfa/setup');
    expect(mockFetch.mock.calls[1][1]).toMatchObject({ method: 'POST', credentials: 'include' });
    expect(screen.getByRole('img', { name: '인증 앱으로 스캔할 QR 코드' })).toBeInTheDocument();
    expect(screen.getByText(SETUP.secret)).toHaveClass('wiz-auth-mfa-secret');
    expect(screen.getByText('binder (a@b.c)')).toBeInTheDocument();
    expect(document.activeElement).toBe(screen.getByLabelText('인증 코드'));
    // 등록·재발급은 인증 앱 코드만 받는다.
    expect(screen.queryByRole('button', { name: '복구 코드로 로그인' })).toBeNull();
  });

  it('renderQr 를 주면 otpauthUri 로 불러 그 결과를 그리고 내장 QR 은 그리지 않는다', async () => {
    const renderQr = vi.fn((uri: string) => <span data-testid="custom-qr">{uri.length}</span>);
    await toSetup({ renderQr });
    expect(renderQr).toHaveBeenCalledWith(SETUP.otpauthUri);
    expect(screen.getByTestId('custom-qr')).toBeInTheDocument();
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('setup 취소는 서버 요청 없이 꺼짐 화면으로', async () => {
    await toSetup();
    fireEvent.click(btn('취소'));
    expect(screen.getByText('2단계 인증이 꺼져 있습니다')).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('enable 성공: onEnabled 호출, 복구 코드 10개 표시, [완료] 는 저장 확인 체크 전까지 비활성', async () => {
    const onEnabled = vi.fn();
    await toRecoveryCodes({ hooks: { onEnabled } });
    expect(mockFetch.mock.calls[2][0]).toBe('/api/auth/mfa/enable');
    expect(bodyOf(2)).toEqual({ code: '123456' });
    expect(onEnabled).toHaveBeenCalledTimes(1);
    const list = document.querySelector('ol.wiz-auth-mfa-codes')!;
    expect(list.querySelectorAll('li > code')).toHaveLength(10);
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: '복구 코드' }));
    expect(btn('완료')).toBeDisabled();
    fireEvent.click(screen.getByLabelText('복구 코드를 안전한 곳에 저장했습니다'));
    expect(btn('완료')).not.toBeDisabled();
  });

  it('[완료]: 복구 코드가 DOM 에서 사라지고 상태를 다시 조회해 켜짐 화면', async () => {
    await toRecoveryCodes();
    mockFetch.mockResolvedValueOnce(statusOn(10));
    fireEvent.click(screen.getByLabelText('복구 코드를 안전한 곳에 저장했습니다'));
    fireEvent.click(btn('완료'));
    expect(screen.queryByText(CODES[0])).toBeNull();
    expect(await screen.findByText('2단계 인증이 켜져 있습니다')).toBeInTheDocument();
    expect(mockFetch.mock.calls[3][0]).toBe('/api/auth/mfa');
    expect(document.body.textContent).not.toContain(CODES[3]);
  });

  it('enable MFA_INVALID_CODE: 입력란 오류, setup 화면 유지', async () => {
    await toSetup();
    mockFetch.mockResolvedValueOnce(fail(401, { error: { key: 'MFA_INVALID_CODE', message: 'x' } }));
    typeCode('123456');
    fireEvent.click(btn('켜기'));
    expect(await screen.findByText('코드가 올바르지 않습니다')).toBeInTheDocument();
    const input = screen.getByLabelText('인증 코드');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveValue('');
    expect(document.activeElement).toBe(input);
    expect(screen.getByText(SETUP.secret)).toBeInTheDocument();
    expect(screen.queryByText('로그인이 필요합니다')).toBeNull();
  });

  it('형식이 틀린 코드는 요청하지 않고 codeFormat 을 보인다', async () => {
    await toSetup();
    typeCode('12ab');
    fireEvent.click(btn('켜기'));
    expect(screen.getByText('6자리 숫자를 입력하세요')).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('잠금(429, retryAfter 600): "10분" 문구, 제출 비활성', async () => {
    await toSetup();
    mockFetch.mockResolvedValueOnce(fail(429, { error: { key: 'MFA_LOCKED', message: 'x' }, retryAfter: 600 }));
    typeCode('123456');
    fireEvent.click(btn('켜기'));
    expect(await screen.findByRole('alert')).toHaveTextContent('10분');
    expect(btn('켜기')).toBeDisabled();
    // 단계를 떠나면 잠금 표시가 풀린다.
    fireEvent.click(btn('취소'));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('켜짐: 남은 코드 {count} 표시, 3 이하면 recoveryCodesLow 경고, 4면 경고 없음', async () => {
    mockFetch.mockResolvedValueOnce(statusOn(3));
    const { unmount } = render(<MfaSettings />);
    expect(await screen.findByText('남은 복구 코드: 3개')).toBeInTheDocument();
    expect(screen.getByText('복구 코드가 얼마 남지 않았습니다. 다시 만들어 두세요')).toHaveClass('wiz-auth-mfa-warning');
    unmount();

    mockFetch.mockResolvedValueOnce(statusOn(4));
    render(<MfaSettings />);
    expect(await screen.findByText('남은 복구 코드: 4개')).toBeInTheDocument();
    expect(screen.queryByText('복구 코드가 얼마 남지 않았습니다. 다시 만들어 두세요')).toBeNull();
  });

  it('재발급: 코드 입력 → onRecoveryCodesRegenerated, 새 복구 코드 화면', async () => {
    const onRecoveryCodesRegenerated = vi.fn();
    mockFetch.mockResolvedValueOnce(statusOn(2)).mockResolvedValueOnce(codesBody());
    render(<MfaSettings hooks={{ onRecoveryCodesRegenerated }} />);
    fireEvent.click(await screen.findByRole('button', { name: '복구 코드 다시 만들기' }));
    expect(document.activeElement).toBe(screen.getByLabelText('인증 코드'));
    expect(screen.queryByRole('button', { name: '복구 코드로 로그인' })).toBeNull();
    typeCode('654321');
    fireEvent.click(btn('다시 만들기'));
    expect(await screen.findByText(CODES[9])).toBeInTheDocument();
    expect(mockFetch.mock.calls[1][0]).toBe('/api/auth/mfa/recovery-codes');
    expect(bodyOf(1)).toEqual({ code: '654321' });
    expect(onRecoveryCodesRegenerated).toHaveBeenCalledTimes(1);
  });

  it('끄기: 복구 코드 모드로 바꿔 { recoveryCode } 로 보내고, 성공하면 onDisabled·꺼짐 화면', async () => {
    const onDisabled = vi.fn();
    mockFetch.mockResolvedValueOnce(statusOn(8)).mockResolvedValueOnce(ok({ success: true }));
    render(<MfaSettings hooks={{ onDisabled }} />);
    fireEvent.click(await screen.findByRole('button', { name: '2단계 인증 끄기' }));
    fireEvent.click(btn('복구 코드로 로그인'));
    expect(document.activeElement).toBe(screen.getByLabelText('복구 코드'));
    typeCode(' ABCD-1234 ', '복구 코드');
    fireEvent.click(btn('끄기'));
    expect(await screen.findByText('2단계 인증이 꺼져 있습니다')).toBeInTheDocument();
    expect(mockFetch.mock.calls[1][0]).toBe('/api/auth/mfa/disable');
    expect(bodyOf(1)).toEqual({ recoveryCode: 'ABCD-1234' });
    expect(onDisabled).toHaveBeenCalledTimes(1);
  });

  it('navigator.clipboard 가 없으면 복사 버튼을 그리지 않는다, 있으면 writeText 에 코드 줄바꿈 문자열', async () => {
    const { unmount } = await toRecoveryCodes();
    expect(screen.queryByRole('button', { name: '복사' })).toBeNull();
    // 복사가 없어도 다운로드·완료 흐름은 그대로다.
    expect(btn('다운로드')).toBeInTheDocument();
    unmount();

    const writeText = stubClipboard();
    await toRecoveryCodes();
    fireEvent.click(btn('복사'));
    expect(await screen.findByRole('button', { name: '복사했습니다' })).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith(CODES.join('\n'));
  });

  it('setup 의 비밀 키 복사는 비밀 키를 writeText 에 넘긴다', async () => {
    const writeText = stubClipboard();
    await toSetup();
    fireEvent.click(btn('복사'));
    expect(await screen.findByRole('button', { name: '복사했습니다' })).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith(SETUP.secret);
  });

  it('다운로드: URL.createObjectURL 에 text/plain Blob, a.download === recoveryCodesFileName', async () => {
    const createObjectURL = vi.fn(() => 'blob:mfa');
    const revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    let clicked: HTMLAnchorElement | undefined;
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clicked = this;
    });

    await toRecoveryCodes({ recoveryCodesFileName: 'binder-codes.txt' });
    fireEvent.click(btn('다운로드'));

    const blob = (createObjectURL.mock.calls[0] as unknown[])[0] as Blob;
    expect(blob.type).toBe('text/plain');
    // jsdom 의 Blob 에는 text() 가 없어 FileReader 로 읽는다.
    const text = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsText(blob);
    });
    expect(text).toBe(CODES.join('\n') + '\n');
    expect(clicked?.download).toBe('binder-codes.txt');
    expect(clicked?.href).toBe('blob:mfa');
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mfa');
    expect(document.querySelector('a[download]')).toBeNull();
    delete (URL as { createObjectURL?: unknown }).createObjectURL;
    delete (URL as { revokeObjectURL?: unknown }).revokeObjectURL;
  });

  it('localStorage·sessionStorage 의 setItem 을 한 번도 부르지 않는다', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    await toRecoveryCodes();
    mockFetch.mockResolvedValueOnce(statusOn(10));
    fireEvent.click(screen.getByLabelText('복구 코드를 안전한 곳에 저장했습니다'));
    fireEvent.click(btn('완료'));
    await screen.findByText('2단계 인증이 켜져 있습니다');
    expect(setItem).not.toHaveBeenCalled();
  });

  it('모든 실패에서 hooks.onError(text, info)', async () => {
    const onError = vi.fn();
    // 상태 조회 실패
    mockFetch.mockResolvedValueOnce(fail(500, { error: { key: 'X', userMessage: { description: '조회 실패' } } }));
    render(<MfaSettings hooks={{ onError }} />);
    await screen.findByRole('alert');
    expect(onError).toHaveBeenLastCalledWith('조회 실패', expect.objectContaining({ status: 500 }));

    // setup 실패(꺼짐 화면에 오류)
    mockFetch.mockResolvedValueOnce(statusOff()).mockResolvedValueOnce(fail(500, { error: { key: 'Y', userMessage: { description: 'setup 실패' } } }));
    fireEvent.click(btn('다시 시도'));
    fireEvent.click(await screen.findByRole('button', { name: '2단계 인증 켜기' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('setup 실패');
    expect(onError).toHaveBeenLastCalledWith('setup 실패', expect.objectContaining({ key: 'Y' }));

    // enable 실패(잘못된 코드)
    mockFetch.mockResolvedValueOnce(ok(SETUP)).mockResolvedValueOnce(fail(401, { error: { key: 'MFA_INVALID_CODE', message: 'x' } }));
    fireEvent.click(btn('2단계 인증 켜기'));
    await screen.findByLabelText('인증 코드');
    typeCode('123456');
    fireEvent.click(btn('켜기'));
    await screen.findByText('코드가 올바르지 않습니다');
    expect(onError).toHaveBeenLastCalledWith('코드가 올바르지 않습니다', expect.objectContaining({ key: 'MFA_INVALID_CODE' }));

    // 네트워크 실패
    mockFetch.mockRejectedValueOnce(new Error('offline'));
    typeCode('123456');
    fireEvent.click(btn('켜기'));
    expect(await screen.findByRole('alert')).toHaveTextContent('네트워크 오류가 발생했습니다');
    expect(onError).toHaveBeenLastCalledWith('네트워크 오류가 발생했습니다', expect.objectContaining({ network: true }));
    expect(onError).toHaveBeenCalledTimes(4);
  });

  it('작업 중 401(MFA_ 키 아님)은 onUnauthenticated 와 unauthenticated 문구', async () => {
    const onUnauthenticated = vi.fn();
    const onError = vi.fn();
    mockFetch.mockResolvedValueOnce(statusOn(5)).mockResolvedValueOnce(fail(401, { error: { key: 'UNAUTHORIZED', message: 'x' } }));
    render(<MfaSettings hooks={{ onUnauthenticated, onError }} />);
    fireEvent.click(await screen.findByRole('button', { name: '2단계 인증 끄기' }));
    typeCode('123456');
    fireEvent.click(btn('끄기'));
    expect(await screen.findByText('로그인이 필요합니다')).toBeInTheDocument();
    expect(onUnauthenticated).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });

  it('unstyled: 패키지 클래스를 빼고 classNames 만 남긴다, apiBasePath·forceColorScheme 반영', async () => {
    mockFetch.mockResolvedValueOnce(statusOn(5));
    const { container } = render(
      <MfaSettings unstyled apiBasePath="/auth" forceColorScheme="dark" classNames={{ root: 'my-root', submitButton: 'my-btn' }} />,
    );
    await screen.findByText('2단계 인증이 켜져 있습니다');
    expect(mockFetch.mock.calls[0][0]).toBe('/auth/mfa');
    const root = container.firstElementChild!;
    expect(root).toHaveClass('my-root');
    expect(root).toHaveAttribute('data-wiz-scheme', 'dark');
    expect(container.querySelector('[class*="wiz-auth"]')).toBeNull();
  });
});
