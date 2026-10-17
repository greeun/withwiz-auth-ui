import type { AuthErrorInfo } from '../types';

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** `details.fieldErrors` 의 각 배열에서 첫 사유만 남긴다. 형태가 어긋난 항목은 버린다. */
function firstFieldErrors(details: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!isRecord(details) || !isRecord(details.fieldErrors)) return out;
  for (const [field, reasons] of Object.entries(details.fieldErrors)) {
    if (Array.isArray(reasons) && typeof reasons[0] === 'string' && reasons[0]) out[field] = reasons[0];
  }
  return out;
}

/**
 * 실패 응답 본문을 하나의 형태로 정규화한다.
 *
 * 두 응답 형태를 모두 받는다.
 * - 표준: `{ error: { code, key, message, userMessage: { description }, details: { fieldErrors } } }`
 * - 문자열형: `{ error: "…", code?: "…", details?: { fieldErrors } }`
 *
 * 표준 응답의 `message` 는 개발자용 영문이라 표시하지 않는다 — `userMessage` 가 없으면 `fallback` 을 쓴다.
 * 본문이 JSON 이 아니거나(`body` 가 null) 형태를 알 수 없으면 `fallback` 과 빈 `fieldErrors` 를 돌려준다.
 */
export function readAuthError(status: number, body: unknown, fallback: string): AuthErrorInfo {
  const base: AuthErrorInfo = { text: fallback, fieldErrors: {}, status, network: false };
  if (!isRecord(body)) return base;

  const { error } = body;
  if (isRecord(error)) {
    const userMessage = isRecord(error.userMessage) ? error.userMessage : undefined;
    const description = typeof userMessage?.description === 'string' ? userMessage.description : '';
    return {
      ...base,
      text: description || fallback,
      key: typeof error.key === 'string' ? error.key : undefined,
      code: typeof error.code === 'number' ? error.code : undefined,
      fieldErrors: firstFieldErrors(error.details),
    };
  }

  // String form. `error` may be missing while `code` alone still identifies the failure
  // (e.g. `{ code: 'EMAIL_NOT_VERIFIED' }`), so `code` and `details` are read regardless.
  return {
    ...base,
    text: typeof error === 'string' && error ? error : fallback,
    key: typeof body.code === 'string' ? body.code : undefined,
    fieldErrors: firstFieldErrors(body.details),
  };
}

/** 응답을 받지 못한 경우(네트워크 오류)의 오류 정보. */
export function networkAuthError(text: string): AuthErrorInfo {
  return { text, fieldErrors: {}, status: 0, network: true };
}

/** `res.json()` 이 실패해도(HTML 오류 페이지 등) 예외 대신 null 을 돌려준다. */
export async function readJsonSafely(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
