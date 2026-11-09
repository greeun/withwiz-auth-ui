import type { AuthErrorInfo, AuthMessages, MfaInputMode, MfaProof } from '../types';

/** 입력값을 서버로 보낼 증명으로 바꾼다. 형식이 어긋나면 사용자에게 보일 문구를 돌려준다. */
export function toMfaProof(
  mode: MfaInputMode,
  raw: string,
  t: AuthMessages['mfa'],
): { proof: MfaProof } | { error: string } {
  if (mode === 'code') {
    const code = raw.replace(/\s/g, '');
    return /^\d{6}$/.test(code) ? { proof: { code } } : { error: t.codeFormat };
  }
  const recoveryCode = raw.trim();
  return recoveryCode.length >= 1 && recoveryCode.length <= 32
    ? { proof: { recoveryCode } }
    : { error: t.recoveryCodeFormat };
}

/** 잠금 해제까지 남은 초를 분으로 올림한다(최소 1분). 값이 없거나 0 이하면 undefined. */
export function lockMinutes(retryAfter: number | undefined): number | undefined {
  if (retryAfter === undefined || !Number.isFinite(retryAfter) || retryAfter <= 0) return undefined;
  return Math.max(1, Math.ceil(retryAfter / 60));
}

/** MFA 오류 키를 현지화 문구로 바꾼다. 알 수 없는 키·분 정보 없는 잠금은 서버 문구를 쓴다. */
export function describeMfaError(info: AuthErrorInfo, t: AuthMessages['mfa']): string {
  switch (info.key) {
    case 'MFA_INVALID_CODE':
      return t.invalidCode;
    case 'MFA_PENDING_EXPIRED':
      return t.expired;
    case 'MFA_LOCKED': {
      const minutes = lockMinutes(info.retryAfter);
      return minutes === undefined ? info.text : t.locked.replace('{minutes}', String(minutes));
    }
    default:
      return info.text;
  }
}
