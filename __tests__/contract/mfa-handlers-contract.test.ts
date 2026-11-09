// @vitest-environment node
/**
 * MFA 계약 테스트 — 실제 @withwiz/toolkit 0.30 MFA 처리기 ↔ auth-ui 요청 함수
 *
 * jsdom 에서는 toolkit 의 JWT 서명이 실패하므로(대기 토큰도 JWT 다) 화면 없이 node 환경에서 돌린다.
 * auth-ui 화면이 쓰는 요청 함수(mfa-api)와 오류 정규화(readAuthError)를 그대로 쓰고, fetch 만 실제 처리기로 보낸다.
 * 화면 동작은 mfa-contract.test.tsx(고정 데이터)가 맡고, 이 파일은 그 고정 데이터가 실제 응답과 같은 모양인지 확인한다.
 */
import { NextRequest } from 'next/server';
import { createAuthHandlers } from '@withwiz/toolkit/next/auth-handlers';
import { createInMemoryMfaAttemptStore, currentStep, totpCode } from '@withwiz/toolkit/core/auth/mfa';
import type { MfaRepository, UserMfaRecord } from '@withwiz/toolkit/core/auth/mfa/types';
import type { AuthHandlerOptions } from '@withwiz/toolkit/next/auth-types/handler-types';
import { authPost } from '../../src/utils/api-client';
import { readAuthError, readJsonSafely } from '../../src/utils/read-auth-error';
import {
  disableMfa,
  enableMfa,
  getMfaStatus,
  regenerateRecoveryCodes,
  setupMfa,
  verifyMfa,
} from '../../src/utils/mfa-api';

const TEXTS = { fallback: 'fallback', network: 'network' };
const API = '/api/auth';
const EMAIL = 'mfa@example.com';
const PASSWORD = 'password123';
const KEY = Buffer.alloc(32, 7).toString('base64url');

/** PrismaMfaRepository 와 같은 의미의 메모리 구현(toolkit 테스트의 fakes 와 같다) */
class MemoryMfaRepository implements MfaRepository {
  records = new Map<string, UserMfaRecord>();
  codes = new Map<string, { hash: string; used: boolean }[]>();
  async findByUserId(userId: string) {
    const r = this.records.get(userId);
    return r ? { ...r } : null;
  }
  async savePendingSecret(userId: string, secretEnc: string) {
    this.records.set(userId, { userId, secretEnc, enabledAt: null, lastUsedStep: null });
    this.codes.delete(userId);
  }
  async enable(userId: string, hashes: string[]) {
    this.records.get(userId)!.enabledAt = new Date();
    this.codes.set(userId, hashes.map((hash) => ({ hash, used: false })));
  }
  async disable(userId: string) {
    this.records.delete(userId);
    this.codes.delete(userId);
  }
  async markStepUsed(userId: string, step: number) {
    const r = this.records.get(userId);
    if (!r || (r.lastUsedStep !== null && r.lastUsedStep >= step)) return false;
    r.lastUsedStep = step;
    return true;
  }
  async consumeRecoveryCode(userId: string, hash: string) {
    const c = (this.codes.get(userId) ?? []).find((x) => x.hash === hash && !x.used);
    if (!c) return false;
    c.used = true;
    return true;
  }
  async replaceRecoveryCodes(userId: string, hashes: string[]) {
    this.codes.set(userId, hashes.map((hash) => ({ hash, used: false })));
  }
  async countUnusedRecoveryCodes(userId: string) {
    return (this.codes.get(userId) ?? []).filter((c) => !c.used).length;
  }
}

function createBackend(errorFormat: 'legacy' | 'standard', tokenDelivery: 'cookie' | 'header' | 'hybrid') {
  const users = new Map<string, any>();
  let seq = 0;
  const options = {
    dependencies: {
      userRepository: {
        findById: async (id: string) => [...users.values()].find((u) => u.id === id) ?? null,
        findByEmail: async (email: string) => users.get(email) ?? null,
        create: async (data: any) => {
          const user = { id: `u${++seq}`, role: 'user', isActive: true, ...data };
          users.set(data.email, user);
          return user;
        },
        update: async (id: string, data: any) => Object.assign([...users.values()].find((u) => u.id === id), data),
        delete: async () => {},
        updateLastLoginAt: async () => {},
        verifyEmail: async () => {},
      },
      oauthAccountRepository: {
        findByProvider: async () => null, findByUserId: async () => [], create: async (d: any) => d,
        update: async (_id: string, d: any) => d, delete: async () => {},
      },
      emailTokenRepository: {
        create: async () => ({}), findByEmailAndToken: async () => null, delete: async () => {},
        deleteExpired: async () => {}, markAsUsed: async () => {}, findEmailByToken: async () => null,
      },
      emailSender: {
        sendVerificationEmail: async () => {}, sendPasswordResetEmail: async () => {},
        sendMagicLinkEmail: async () => {}, sendWelcomeEmail: async () => {},
      },
    },
    jwt: { secret: 'x'.repeat(40) },
    urls: { baseUrl: 'http://localhost', mfaChallenge: '/mfa' },
    features: { emailVerificationRequired: false },
    errorFormat,
    tokenDelivery,
    mfa: {
      enabled: true,
      issuer: 'binder',
      encryptionKeys: [KEY],
      repository: new MemoryMfaRepository(),
      attemptStore: createInMemoryMfaAttemptStore(),
    },
  } as unknown as AuthHandlerOptions;

  const h = createAuthHandlers(options);
  const routes: Record<string, (req: NextRequest) => Promise<Response>> = {
    'POST register': h.register,
    'POST login': h.login,
    'GET mfa': h.mfaStatus,
    'POST mfa/verify': h.mfaVerify,
    'POST mfa/setup': h.mfaSetup,
    'POST mfa/enable': h.mfaEnable,
    'POST mfa/disable': h.mfaDisable,
    'POST mfa/recovery-codes': h.mfaRecoveryCodes,
  };

  // 브라우저처럼 Set-Cookie 를 저장했다가 다음 요청에 붙인다(값만 다루고 속성은 무시한다).
  const jar = new Map<string, string>();
  let bearer: string | undefined;

  vi.stubGlobal('fetch', async (input: string, init: RequestInit = {}) => {
    const url = new URL(input, 'http://localhost');
    const route = routes[`${init.method ?? 'GET'} ${url.pathname.slice(API.length + 1)}`];
    if (!route) return new Response('{"success":false,"error":"Not found"}', { status: 404 });
    const headers = new Headers(init.headers);
    if (jar.size) headers.set('cookie', [...jar].map(([k, v]) => `${k}=${v}`).join('; '));
    if (bearer) headers.set('authorization', `Bearer ${bearer}`);
    const res = await route(new NextRequest(url, { ...init, headers } as any));
    for (const line of res.headers.getSetCookie()) {
      const [pair, ...attrs] = line.split(';');
      const [name, ...rest] = pair.split('=');
      const removed = attrs.some((a) => /^\s*max-age=0\s*$/i.test(a)) || rest.join('=') === '';
      if (removed) jar.delete(name.trim());
      else jar.set(name.trim(), rest.join('='));
    }
    return res;
  });

  return {
    jar,
    /** header 모드는 쿠키가 없으므로 로그인 본문의 access 토큰을 Authorization 으로 보낸다 */
    setBearer: (token?: string) => { bearer = token; },
  };
}

async function post(path: string, body?: unknown) {
  const res = await authPost(`${API}/${path}`, body);
  const json = await readJsonSafely(res);
  return { res, json: json as any, error: res.ok ? undefined : readAuthError(res.status, json, TEXTS.fallback) };
}

/** 가입 → 로그인 → MFA 켜기. 반환한 secret 으로 코드를 만들고, 등록에 쓴 스텝은 다시 쓸 수 없다. */
async function signUpAndEnable(backend: ReturnType<typeof createBackend>) {
  await post('register', { email: EMAIL, password: PASSWORD });
  const login = await post('login', { email: EMAIL, password: PASSWORD });
  expect(login.res.status).toBe(200);
  backend.setBearer(login.json?.accessToken ?? login.json?.data?.accessToken ?? login.json?.tokens?.accessToken);

  const before = await getMfaStatus(API, TEXTS);
  expect(before).toMatchObject({ ok: true, data: { enabled: false, recoveryCodesRemaining: 0 } });

  const setup = await setupMfa(API, TEXTS);
  if (!setup.ok) throw new Error(`setup failed: ${setup.error.key}`);
  expect(setup.data.otpauthUri).toMatch(/^otpauth:\/\/totp\//);
  expect(setup.data.otpauthUri).toContain(`secret=${setup.data.secret}`);

  const enabled = await enableMfa(API, totpCode(setup.data.secret, currentStep() - 1), TEXTS);
  if (!enabled.ok) throw new Error(`enable failed: ${enabled.error.key}`);
  expect(enabled.data.recoveryCodes).toHaveLength(10);

  const after = await getMfaStatus(API, TEXTS);
  expect(after).toMatchObject({ ok: true, data: { enabled: true, recoveryCodesRemaining: 10 } });

  backend.setBearer(undefined);
  backend.jar.clear();
  return { secret: setup.data.secret, recoveryCodes: enabled.data.recoveryCodes };
}

function wrongCode(secret: string) {
  const valid = new Set([-1, 0, 1].map((d) => totpCode(secret, currentStep() + d)));
  return valid.has('000000') ? '111111' : '000000';
}

afterEach(() => vi.unstubAllGlobals());

describe.each(['legacy', 'standard'] as const)('실제 MFA 처리기 계약 — errorFormat %s', (errorFormat) => {
  it('hybrid: 로그인 401 MFA_REQUIRED 본문 최상위 mfaToken → 오답은 MFA_INVALID_CODE → 복구 코드로 통과', async () => {
    const backend = createBackend(errorFormat, 'hybrid');
    const { secret, recoveryCodes } = await signUpAndEnable(backend);

    const login = await post('login', { email: EMAIL, password: PASSWORD });
    expect(login.res.status).toBe(401);
    expect(login.error).toMatchObject({ key: 'MFA_REQUIRED', status: 401 });
    expect(typeof login.json.mfaToken).toBe('string');
    const mfaToken = login.json.mfaToken as string;

    const bad = await verifyMfa(API, { code: wrongCode(secret) }, TEXTS, { mfaToken });
    expect(bad).toMatchObject({ ok: false, error: { key: 'MFA_INVALID_CODE', status: 401 } });

    const good = await verifyMfa(API, { recoveryCode: recoveryCodes[0] }, TEXTS, { mfaToken });
    if (!good.ok) throw new Error(`verify failed: ${good.error.key}`);
    expect(good.data.user).toMatchObject({ email: EMAIL });
  });

  it('cookie: 본문에 mfaToken 이 없고 mfa_pending 쿠키만으로 검증이 통과한다', async () => {
    const backend = createBackend(errorFormat, 'cookie');
    const { secret } = await signUpAndEnable(backend);

    const login = await post('login', { email: EMAIL, password: PASSWORD });
    expect(login.error).toMatchObject({ key: 'MFA_REQUIRED', status: 401 });
    expect(login.json).not.toHaveProperty('mfaToken');
    expect([...backend.jar.keys()].some((k) => k.includes('mfa_pending'))).toBe(true);

    const good = await verifyMfa(API, { code: totpCode(secret, currentStep() + 1) }, TEXTS);
    if (!good.ok) throw new Error(`verify failed: ${good.error.key}`);
    expect(good.data.user).toMatchObject({ email: EMAIL });
  });

  it('대기 토큰이 없거나 위조되면 MFA_PENDING_EXPIRED(401)', async () => {
    const backend = createBackend(errorFormat, 'header');
    await signUpAndEnable(backend);
    const res = await verifyMfa(API, { code: '123456' }, TEXTS, { mfaToken: 'forged.token.value' });
    expect(res).toMatchObject({ ok: false, error: { key: 'MFA_PENDING_EXPIRED', status: 401 } });
  });

  // toolkit 한도: 대기 토큰당 실패 5회면 토큰 폐기(MFA_PENDING_EXPIRED → 화면은 처음부터 다시),
  // 사용자당 15분 실패 10회면 잠금(429). 그래서 두 번 로그인해 오답을 5회씩 넣는다.
  it('대기 토큰은 오답 5회에 폐기되고, 사용자 실패 10회째에 429 MFA_LOCKED 와 최상위 retryAfter(초)를 읽는다', async () => {
    const backend = createBackend(errorFormat, 'hybrid');
    const { secret } = await signUpAndEnable(backend);
    const wrong = async (mfaToken: string) => verifyMfa(API, { code: wrongCode(secret) }, TEXTS, { mfaToken });

    const first = (await post('login', { email: EMAIL, password: PASSWORD })).json.mfaToken as string;
    for (let i = 0; i < 4; i++) {
      expect(await wrong(first)).toMatchObject({ ok: false, error: { key: 'MFA_INVALID_CODE', status: 401 } });
    }
    await wrong(first);
    expect(await wrong(first)).toMatchObject({ ok: false, error: { key: 'MFA_PENDING_EXPIRED', status: 401 } });

    const second = (await post('login', { email: EMAIL, password: PASSWORD })).json.mfaToken as string;
    let last: Awaited<ReturnType<typeof verifyMfa>> | undefined;
    for (let i = 0; i < 5; i++) {
      last = await wrong(second);
      if (!last.ok && last.error.status === 429) break;
    }
    expect(last).toMatchObject({ ok: false, error: { key: 'MFA_LOCKED', status: 429 } });
    expect(!last!.ok && last!.error.retryAfter).toBeGreaterThan(0);
  });

  it('재발급과 해제: 새 복구 코드 10개를 읽고, 복구 코드로 끈 뒤 상태가 꺼짐이 된다', async () => {
    const backend = createBackend(errorFormat, 'hybrid');
    const { secret, recoveryCodes } = await signUpAndEnable(backend);
    const login = await post('login', { email: EMAIL, password: PASSWORD });
    const verified = await verifyMfa(API, { recoveryCode: recoveryCodes[0] }, TEXTS, { mfaToken: login.json.mfaToken });
    expect(verified.ok).toBe(true);
    backend.setBearer((verified as any).body?.accessToken ?? (verified as any).body?.data?.accessToken);

    const regenerated = await regenerateRecoveryCodes(API, totpCode(secret, currentStep() + 1), TEXTS);
    if (!regenerated.ok) throw new Error(`regenerate failed: ${regenerated.error.key}`);
    expect(regenerated.data.recoveryCodes).toHaveLength(10);
    expect(regenerated.data.recoveryCodes).not.toContain(recoveryCodes[1]);

    const disabled = await disableMfa(API, { recoveryCode: regenerated.data.recoveryCodes[0] }, TEXTS);
    expect(disabled.ok).toBe(true);
    expect(await getMfaStatus(API, TEXTS)).toMatchObject({ ok: true, data: { enabled: false } });
  });
});
