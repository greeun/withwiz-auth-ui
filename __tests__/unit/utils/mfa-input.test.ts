import { describe, it, expect } from 'vitest';
import { toMfaProof, lockMinutes, describeMfaError } from '../../../src/utils/mfa-input';
import { ko } from '../../../src/i18n';
import type { AuthErrorInfo } from '../../../src/types';

const base: AuthErrorInfo = { text: '', fieldErrors: {}, status: 400, network: false };

describe('toMfaProof', () => {
  it('숫자 코드: 모든 공백을 제거하고 6자리 숫자만 허용', () => {
    expect(toMfaProof('code', ' 123 456 ', ko.mfa)).toEqual({ proof: { code: '123456' } });
    expect(toMfaProof('code', '12345', ko.mfa)).toEqual({ error: ko.mfa.codeFormat });
    expect(toMfaProof('code', '12345a', ko.mfa)).toEqual({ error: ko.mfa.codeFormat });
  });
  it('복구 코드: 앞뒤 공백만 자르고 1..32자', () => {
    expect(toMfaProof('recoveryCode', ' ABCD-1234 ', ko.mfa)).toEqual({ proof: { recoveryCode: 'ABCD-1234' } });
    expect(toMfaProof('recoveryCode', '   ', ko.mfa)).toEqual({ error: ko.mfa.recoveryCodeFormat });
    expect(toMfaProof('recoveryCode', 'a'.repeat(33), ko.mfa)).toEqual({ error: ko.mfa.recoveryCodeFormat });
    expect(toMfaProof('recoveryCode', 'a'.repeat(32), ko.mfa)).toEqual({ proof: { recoveryCode: 'a'.repeat(32) } });
  });
});

describe('lockMinutes', () => {
  it('올림하고 최소 1분, 값이 없거나 0 이하면 undefined', () => {
    expect(lockMinutes(600)).toBe(10);
    expect(lockMinutes(61)).toBe(2);
    expect(lockMinutes(1)).toBe(1);
    expect(lockMinutes(undefined)).toBeUndefined();
    expect(lockMinutes(0)).toBeUndefined();
  });
});

describe('describeMfaError', () => {
  it('키별 문구', () => {
    expect(describeMfaError({ ...base, key: 'MFA_INVALID_CODE' }, ko.mfa)).toBe(ko.mfa.invalidCode);
    expect(describeMfaError({ ...base, key: 'MFA_PENDING_EXPIRED' }, ko.mfa)).toBe(ko.mfa.expired);
    expect(describeMfaError({ ...base, key: 'MFA_LOCKED', retryAfter: 600 }, ko.mfa)).toBe('시도가 너무 많습니다. 10분 뒤 다시 시도하세요');
  });
  it('retryAfter 없는 잠금과 그 밖의 키는 서버 문구', () => {
    expect(describeMfaError({ ...base, key: 'MFA_LOCKED', text: '서버 문구' }, ko.mfa)).toBe('서버 문구');
    expect(describeMfaError({ ...base, key: 'OTHER', text: '서버 문구' }, ko.mfa)).toBe('서버 문구');
  });
});
