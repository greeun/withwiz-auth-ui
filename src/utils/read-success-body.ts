const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * 성공 응답 본문에서 필드 하나를 읽는다.
 *
 * 두 형태를 모두 받는다.
 * - 평면형: `{ user, loginUrl, … }`
 * - 봉투형: `{ success: true, data: { user, loginUrl, … } }` (IApiResponse)
 *
 * 평면형 필드가 있으면 그 값을 우선한다. 본문이 객체가 아니거나 필드가 없으면 undefined.
 */
export function readSuccessField(body: unknown, key: string): unknown {
  if (!isRecord(body)) return undefined;
  if (key in body) return body[key];
  return isRecord(body.data) ? body.data[key] : undefined;
}
