import { describe, it, expect } from 'vitest';
import { readAuthError, networkAuthError, hookFailure } from '../../../src/utils/read-auth-error';

const FALLBACK = '요청에 실패했습니다';

describe('readAuthError — 표준 응답', () => {
  it('userMessage.description 을 문구로, key·code·fieldErrors 를 함께 읽는다', () => {
    const info = readAuthError(400, {
      success: false,
      error: {
        code: 40011,
        key: 'PASSWORD_TOO_WEAK',
        message: 'Password policy violation',
        userMessage: { description: '비밀번호는 문자 3종 이상이어야 합니다' },
        details: { fieldErrors: { password: ['비밀번호는 문자 3종 이상이어야 합니다', '두 번째 사유'] } },
      },
    }, FALLBACK);
    expect(info).toEqual({
      text: '비밀번호는 문자 3종 이상이어야 합니다',
      key: 'PASSWORD_TOO_WEAK',
      code: 40011,
      fieldErrors: { password: '비밀번호는 문자 3종 이상이어야 합니다' },
      status: 400,
      network: false,
    });
  });

  it('userMessage 가 없으면 개발자용 message 대신 기본 문구를 쓴다', () => {
    const info = readAuthError(401, { error: { code: 40101, key: 'INVALID_CREDENTIALS', message: 'Invalid credentials' } }, FALLBACK);
    expect(info.text).toBe(FALLBACK);
    expect(info.key).toBe('INVALID_CREDENTIALS');
  });
});

describe('readAuthError — 문자열형 응답', () => {
  it('문자열 error 를 문구로, code 를 key 로 읽는다', () => {
    const info = readAuthError(403, { success: false, error: 'Email not verified', code: 'EMAIL_NOT_VERIFIED' }, FALLBACK);
    expect(info.text).toBe('Email not verified');
    expect(info.key).toBe('EMAIL_NOT_VERIFIED');
    expect(info.code).toBeUndefined();
  });

  it('error 없이 code 만 있어도 key 를 읽고 문구는 기본 문구를 쓴다', () => {
    const info = readAuthError(403, { code: 'EMAIL_NOT_VERIFIED' }, FALLBACK);
    expect(info.key).toBe('EMAIL_NOT_VERIFIED');
    expect(info.text).toBe(FALLBACK);
  });

  it('details.fieldErrors 의 첫 사유를 읽는다', () => {
    const info = readAuthError(400, {
      error: 'Invalid input',
      details: { formErrors: [], fieldErrors: { email: ['형식이 올바르지 않습니다'] } },
    }, FALLBACK);
    expect(info.fieldErrors).toEqual({ email: '형식이 올바르지 않습니다' });
  });
});

describe('readAuthError — 형태 불명', () => {
  it.each([
    ['null', null],
    ['문자열 본문', '<html>500</html>'],
    ['error 없음', { success: false }],
    ['빈 문자열 error', { error: '' }],
  ])('%s 이면 기본 문구와 빈 fieldErrors 를 쓴다', (_label, body) => {
    const info = readAuthError(500, body, FALLBACK);
    expect(info.text).toBe(FALLBACK);
    expect(info.key).toBeUndefined();
    expect(info.fieldErrors).toEqual({});
    expect(info.status).toBe(500);
  });

  it('fieldErrors 에서 배열이 아니거나 비어 있는 항목은 버린다', () => {
    const info = readAuthError(400, { error: 'x', details: { fieldErrors: { a: [], b: 'not-array', c: ['ok'] } } }, FALLBACK);
    expect(info.fieldErrors).toEqual({ c: 'ok' });
  });
});

describe('networkAuthError', () => {
  it('status 0, network true 와 기본 문구를 돌려준다', () => {
    expect(networkAuthError('네트워크 오류')).toEqual({ text: '네트워크 오류', fieldErrors: {}, status: 0, network: true });
  });
});

describe('hookFailure', () => {
  it('uses the thrown Error message', () => {
    expect(hookFailure(new Error('링크 이전 실패'), 'fallback', 200)).toEqual({
      text: '링크 이전 실패',
      key: 'SUCCESS_HOOK_FAILED',
      fieldErrors: {},
      status: 200,
      network: false,
    });
  });

  it('falls back for non-Error values and empty messages', () => {
    expect(hookFailure('boom', 'fallback', 201).text).toBe('fallback');
    expect(hookFailure(new Error(''), 'fallback', 200).text).toBe('fallback');
    expect(hookFailure(undefined, 'fallback', 200).text).toBe('fallback');
  });
});
