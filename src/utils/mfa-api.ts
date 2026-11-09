import type { AuthErrorInfo, MfaProof, MfaSetupInfo, MfaStatus } from '../types';
import { authGet, authPost } from './api-client';
import { networkAuthError, readAuthError, readJsonSafely } from './read-auth-error';
import { readSuccessField } from './read-success-body';

export interface MfaRequestTexts {
  /** 서버 문구가 없는 실패, 또는 성공 본문의 형태가 어긋났을 때 */
  fallback: string;
  /** 응답을 받지 못했거나 본문이 JSON 이 아닐 때 */
  network: string;
}

export type MfaResult<T> =
  | { ok: true; data: T; body: unknown; status: number }
  | { ok: false; error: AuthErrorInfo };

type Parse<T> = (body: unknown) => T | undefined;

/** 공통 흐름: 요청 → 실패 정규화 → 본문 파싱. 파싱이 undefined 를 돌려주면 형태 불일치로 실패 처리한다. */
async function run<T>(
  request: () => Promise<Response>,
  texts: MfaRequestTexts,
  parse: Parse<T>,
): Promise<MfaResult<T>> {
  let res: Response;
  try {
    res = await request();
  } catch {
    return { ok: false, error: networkAuthError(texts.network) };
  }
  const body = await readJsonSafely(res);
  if (!res.ok) return { ok: false, error: readAuthError(res.status, body, texts.fallback) };
  if (body === null) return { ok: false, error: readAuthError(res.status, null, texts.network) };
  const data = parse(body);
  if (data === undefined) return { ok: false, error: readAuthError(res.status, null, texts.fallback) };
  return { ok: true, data, body, status: res.status };
}

const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string');

const parseRecoveryCodes: Parse<{ recoveryCodes: string[] }> = (body) => {
  const recoveryCodes = readSuccessField(body, 'recoveryCodes');
  return isStringArray(recoveryCodes) ? { recoveryCodes } : undefined;
};

export function verifyMfa(
  apiBasePath: string,
  proof: MfaProof,
  texts: MfaRequestTexts,
  opts?: { mfaToken?: string },
): Promise<MfaResult<{ user: unknown; redirectTo?: string }>> {
  const payload = opts?.mfaToken ? { ...proof, mfaToken: opts.mfaToken } : proof;
  return run(() => authPost(`${apiBasePath}/mfa/verify`, payload), texts, (body) => {
    const redirectTo = readSuccessField(body, 'redirectTo');
    return {
      user: readSuccessField(body, 'user'),
      ...(typeof redirectTo === 'string' && redirectTo ? { redirectTo } : {}),
    };
  });
}

export function getMfaStatus(apiBasePath: string, texts: MfaRequestTexts): Promise<MfaResult<MfaStatus>> {
  return run(() => authGet(`${apiBasePath}/mfa`), texts, (body) => {
    const enabled = readSuccessField(body, 'enabled');
    const remaining = readSuccessField(body, 'recoveryCodesRemaining');
    return typeof enabled === 'boolean' && typeof remaining === 'number'
      ? { enabled, recoveryCodesRemaining: remaining }
      : undefined;
  });
}

export function setupMfa(apiBasePath: string, texts: MfaRequestTexts): Promise<MfaResult<MfaSetupInfo>> {
  return run(() => authPost(`${apiBasePath}/mfa/setup`), texts, (body) => {
    const secret = readSuccessField(body, 'secret');
    const otpauthUri = readSuccessField(body, 'otpauthUri');
    return typeof secret === 'string' && typeof otpauthUri === 'string' ? { secret, otpauthUri } : undefined;
  });
}

export function enableMfa(
  apiBasePath: string,
  code: string,
  texts: MfaRequestTexts,
): Promise<MfaResult<{ recoveryCodes: string[] }>> {
  return run(() => authPost(`${apiBasePath}/mfa/enable`, { code }), texts, parseRecoveryCodes);
}

export function disableMfa(apiBasePath: string, proof: MfaProof, texts: MfaRequestTexts): Promise<MfaResult<null>> {
  return run(() => authPost(`${apiBasePath}/mfa/disable`, proof), texts, () => null);
}

export function regenerateRecoveryCodes(
  apiBasePath: string,
  code: string,
  texts: MfaRequestTexts,
): Promise<MfaResult<{ recoveryCodes: string[] }>> {
  return run(() => authPost(`${apiBasePath}/mfa/recovery-codes`, { code }), texts, parseRecoveryCodes);
}
