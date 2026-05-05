# Auth Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** withwiz-auth-ui 패키지에 5개 완성형 페이지 컴포넌트를 추가하여 소비 앱에서 라우터에 바로 연결할 수 있도록 한다.

**Architecture:** 기존 폼 컴포넌트 + AuthLayout을 조합하는 thin wrapper 페이지. 신규 폼 2개(ResetPasswordForm, EmailVerificationForm)를 먼저 생성한 뒤, 5개 페이지를 구성한다. 외부 의존성 없이 인라인 스타일, 인라인 SVG만 사용.

**Tech Stack:** React 18+, TypeScript, Zod, Vitest, tsup

**Design Spec:** `docs/superpowers/specs/2026-05-06-auth-pages-design.md`

---

### Task 1: Types — EmailVerificationFormProps 추가, ResetPasswordFormProps에 token 추가

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/unit/types/page-types.test.ts`:

```typescript
import type {
  ResetPasswordFormProps,
  EmailVerificationFormProps,
  LoginPageProps,
  RegisterPageProps,
  ForgotPasswordPageProps,
  ResetPasswordPageProps,
  EmailVerificationPageProps,
  AuthMessages,
} from '../../../src/types';

describe('Type definitions exist', () => {
  it('ResetPasswordFormProps includes token', () => {
    const props: ResetPasswordFormProps = {
      token: 'abc',
    };
    expect(props.token).toBe('abc');
  });

  it('EmailVerificationFormProps exists with required token', () => {
    const props: EmailVerificationFormProps = {
      token: 'xyz',
    };
    expect(props.token).toBe('xyz');
  });

  it('LoginPageProps exists', () => {
    const props: LoginPageProps = {};
    expect(props).toBeDefined();
  });

  it('RegisterPageProps exists', () => {
    const props: RegisterPageProps = {};
    expect(props).toBeDefined();
  });

  it('ForgotPasswordPageProps exists', () => {
    const props: ForgotPasswordPageProps = {};
    expect(props).toBeDefined();
  });

  it('ResetPasswordPageProps exists with required token', () => {
    const props: ResetPasswordPageProps = { token: 'abc' };
    expect(props.token).toBe('abc');
  });

  it('EmailVerificationPageProps exists with required token', () => {
    const props: EmailVerificationPageProps = { token: 'abc' };
    expect(props.token).toBe('abc');
  });

  it('AuthMessages includes emailVerification', () => {
    const msgs = {} as AuthMessages;
    expect(msgs.emailVerification).toBeDefined;
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/unit/types/page-types.test.ts`
Expected: FAIL — types don't exist yet

- [ ] **Step 3: Add types to `src/types/index.ts`**

Add `token: string` to `ResetPasswordFormProps`. Add `EmailVerificationFormProps`. Add `emailVerification` to `AuthMessages`. Add all 5 page props types.

Append to `src/types/index.ts`:

```typescript
// Add token to existing ResetPasswordFormProps:
// Change the interface to include: token: string;

// New interface:
export interface EmailVerificationFormProps {
  token: string;
  locale?: 'ko' | 'en' | 'ja';
  messages?: Partial<AuthMessages['emailVerification']>;
  apiBasePath?: string;
  className?: string;
  loginUrl?: string;
  resendUrl?: string;
}

// Add to AuthMessages interface:
//   emailVerification: {
//     title: string;
//     verifying: string;
//     successTitle: string;
//     successMessage: string;
//     errorTitle: string;
//     errorExpired: string;
//     errorInvalid: string;
//     networkError: string;
//     loginButton: string;
//     resendLink: string;
//   };

// Page props types:
export interface LoginPageProps extends
  Pick<AuthLayoutProps, 'logo' | 'pattern' | 'backgroundColor' | 'leftPanel'>,
  Omit<LoginFormProps, 'className'> {
  className?: string;
}

export interface RegisterPageProps extends
  Pick<AuthLayoutProps, 'logo' | 'pattern' | 'backgroundColor' | 'leftPanel'>,
  Omit<RegisterFormProps, 'className'> {
  className?: string;
}

export interface ForgotPasswordPageProps extends
  Pick<AuthLayoutProps, 'logo' | 'pattern' | 'backgroundColor' | 'leftPanel'>,
  Omit<ForgotPasswordFormProps, 'className'> {
  className?: string;
}

export interface ResetPasswordPageProps extends
  Pick<AuthLayoutProps, 'logo' | 'pattern' | 'backgroundColor' | 'leftPanel'>,
  Omit<ResetPasswordFormProps, 'className'> {
  className?: string;
}

export interface EmailVerificationPageProps extends
  Pick<AuthLayoutProps, 'logo' | 'pattern' | 'backgroundColor' | 'leftPanel'>,
  Omit<EmailVerificationFormProps, 'className'> {
  className?: string;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/unit/types/page-types.test.ts`
Expected: PASS

- [ ] **Step 5: Run existing tests to check for regressions**

Run: `npx vitest run`
Expected: All existing tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/types/index.ts __tests__/unit/types/page-types.test.ts
git commit -m "feat: add page and email verification types"
```

---

### Task 2: i18n — emailVerification 메시지 추가 (ko, en, ja)

**Files:**
- Modify: `src/i18n/ko.ts`
- Modify: `src/i18n/en.ts`
- Modify: `src/i18n/ja.ts`
- Modify: `src/i18n/index.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/unit/i18n/email-verification-i18n.test.ts`:

```typescript
import { getMessages, mergeMessages } from '../../../src/i18n';

describe('emailVerification i18n messages', () => {
  it('ko has emailVerification messages', () => {
    const m = getMessages('ko');
    expect(m.emailVerification).toBeDefined();
    expect(m.emailVerification.title).toBe('이메일 인증');
    expect(m.emailVerification.verifying).toBe('인증 중...');
    expect(m.emailVerification.successTitle).toBe('인증 완료');
    expect(m.emailVerification.loginButton).toBe('로그인');
    expect(m.emailVerification.resendLink).toBe('인증 이메일 재전송');
  });

  it('en has emailVerification messages', () => {
    const m = getMessages('en');
    expect(m.emailVerification).toBeDefined();
    expect(m.emailVerification.title).toBe('Email Verification');
    expect(m.emailVerification.verifying).toBe('Verifying...');
    expect(m.emailVerification.successTitle).toBe('Verified');
  });

  it('ja has emailVerification messages', () => {
    const m = getMessages('ja');
    expect(m.emailVerification).toBeDefined();
    expect(m.emailVerification.title).toBe('メール認証');
    expect(m.emailVerification.verifying).toBe('認証中...');
  });

  it('mergeMessages includes emailVerification', () => {
    const m = mergeMessages('ko', {
      emailVerification: { title: 'Custom' } as any,
    });
    expect(m.emailVerification.title).toBe('Custom');
    expect(m.emailVerification.verifying).toBe('인증 중...');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/unit/i18n/email-verification-i18n.test.ts`
Expected: FAIL — emailVerification not in messages

- [ ] **Step 3: Add emailVerification to ko.ts**

Add to `src/i18n/ko.ts` inside the export, after `resetPassword`:

```typescript
  emailVerification: {
    title: '이메일 인증',
    verifying: '인증 중...',
    successTitle: '인증 완료',
    successMessage: '이메일이 성공적으로 인증되었습니다',
    errorTitle: '인증 실패',
    errorExpired: '인증 링크가 만료되었습니다',
    errorInvalid: '유효하지 않은 인증 링크입니다',
    networkError: '네트워크 오류가 발생했습니다',
    loginButton: '로그인',
    resendLink: '인증 이메일 재전송',
  },
```

- [ ] **Step 4: Add emailVerification to en.ts**

Add to `src/i18n/en.ts` inside the export, after `resetPassword`:

```typescript
  emailVerification: {
    title: 'Email Verification',
    verifying: 'Verifying...',
    successTitle: 'Verified',
    successMessage: 'Your email has been verified successfully',
    errorTitle: 'Verification Failed',
    errorExpired: 'Verification link has expired',
    errorInvalid: 'Invalid verification link',
    networkError: 'A network error occurred',
    loginButton: 'Go to Login',
    resendLink: 'Resend verification email',
  },
```

- [ ] **Step 5: Add emailVerification to ja.ts**

Add to `src/i18n/ja.ts` inside the export, after `resetPassword`:

```typescript
  emailVerification: {
    title: 'メール認証',
    verifying: '認証中...',
    successTitle: '認証完了',
    successMessage: 'メールアドレスが正常に認証されました',
    errorTitle: '認証失敗',
    errorExpired: '認証リンクの有効期限が切れています',
    errorInvalid: '無効な認証リンクです',
    networkError: 'ネットワークエラーが発生しました',
    loginButton: 'ログイン',
    resendLink: '認証メールを再送信',
  },
```

- [ ] **Step 6: Update `src/i18n/index.ts` mergeMessages**

The `mergeMessages` function must include the new `emailVerification` key:

```typescript
export function mergeMessages(locale: string, overrides?: Partial<AuthMessages>): AuthMessages {
  const base = getMessages(locale);
  if (!overrides) return base;
  return {
    login: { ...base.login, ...overrides.login },
    register: { ...base.register, ...overrides.register },
    forgotPassword: { ...base.forgotPassword, ...overrides.forgotPassword },
    resetPassword: { ...base.resetPassword, ...overrides.resetPassword },
    emailVerification: { ...base.emailVerification, ...overrides.emailVerification },
  };
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npx vitest run __tests__/unit/i18n/email-verification-i18n.test.ts`
Expected: PASS

- [ ] **Step 8: Run all tests for regressions**

Run: `npx vitest run`
Expected: All PASS

- [ ] **Step 9: Commit**

```bash
git add src/i18n/ko.ts src/i18n/en.ts src/i18n/ja.ts src/i18n/index.ts __tests__/unit/i18n/email-verification-i18n.test.ts
git commit -m "feat: add emailVerification i18n messages (ko, en, ja)"
```

---

### Task 3: ResetPasswordForm component

**Files:**
- Create: `src/components/ResetPasswordForm.tsx`
- Modify: `src/components/index.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/unit/components/ResetPasswordForm.test.tsx`:

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ResetPasswordForm } from '../../../src/components/ResetPasswordForm';

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders title and two password fields in default locale (ko)', () => {
    render(<ResetPasswordForm token="valid-token" />);
    expect(screen.getByRole('heading', { name: '비밀번호 재설정' })).toBeInTheDocument();
    expect(screen.getByLabelText('새 비밀번호')).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호 확인')).toBeInTheDocument();
  });

  it('renders in English when locale="en"', () => {
    render(<ResetPasswordForm token="valid-token" locale="en" />);
    expect(screen.getByRole('heading', { name: 'Reset Password' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Change Password' })).toBeInTheDocument();
  });

  it('shows validation error when passwords do not match', async () => {
    render(<ResetPasswordForm token="valid-token" />);
    fireEvent.change(screen.getByLabelText('새 비밀번호'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('비밀번호 확인'), { target: { value: 'different123' } });
    fireEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }));

    await waitFor(() => {
      expect(screen.getByText('비밀번호가 일치하지 않습니다')).toBeInTheDocument();
    });
  });

  it('shows validation error for short password', async () => {
    render(<ResetPasswordForm token="valid-token" locale="en" />);
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'short' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: 'Change Password' }));

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    });
  });

  it('calls API and shows success on valid submit', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    }));

    render(<ResetPasswordForm token="valid-token" />);
    fireEvent.change(screen.getByLabelText('새 비밀번호'), { target: { value: 'newpassword123' } });
    fireEvent.change(screen.getByLabelText('비밀번호 확인'), { target: { value: 'newpassword123' } });
    fireEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }));

    await waitFor(() => {
      expect(screen.getByText('비밀번호가 변경되었습니다')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/auth/reset-password', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ token: 'valid-token', password: 'newpassword123' }),
    }));
  });

  it('shows API error on failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Token expired' }),
    }));

    render(<ResetPasswordForm token="expired-token" />);
    fireEvent.change(screen.getByLabelText('새 비밀번호'), { target: { value: 'newpassword123' } });
    fireEvent.change(screen.getByLabelText('비밀번호 확인'), { target: { value: 'newpassword123' } });
    fireEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }));

    await waitFor(() => {
      expect(screen.getByText('Token expired')).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    let resolveRequest: (value: Response) => void;
    const pendingPromise = new Promise<Response>((resolve) => { resolveRequest = resolve; });
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(pendingPromise));

    render(<ResetPasswordForm token="valid-token" />);
    fireEvent.change(screen.getByLabelText('새 비밀번호'), { target: { value: 'newpassword123' } });
    fireEvent.change(screen.getByLabelText('비밀번호 확인'), { target: { value: 'newpassword123' } });
    fireEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '변경 중...' })).toBeInTheDocument();
    });

    resolveRequest!({ ok: true, json: () => Promise.resolve({ success: true }) } as any);
    await waitFor(() => {
      expect(screen.getByText('비밀번호가 변경되었습니다')).toBeInTheDocument();
    });
  });

  it('success state shows login link with default loginUrl', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    }));

    render(<ResetPasswordForm token="valid-token" />);
    fireEvent.change(screen.getByLabelText('새 비밀번호'), { target: { value: 'newpassword123' } });
    fireEvent.change(screen.getByLabelText('비밀번호 확인'), { target: { value: 'newpassword123' } });
    fireEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }));

    await waitFor(() => {
      expect(screen.getByText('비밀번호가 변경되었습니다')).toBeInTheDocument();
    });
    const loginLink = screen.getByRole('link');
    expect(loginLink).toHaveAttribute('href', '/login');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/unit/components/ResetPasswordForm.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Create `src/components/ResetPasswordForm.tsx`**

```tsx
'use client';

import { useState, type FormEvent } from 'react';
import { z } from 'zod';
import { getMessages } from '../i18n';
import { authPost } from '../utils/api-client';
import type { ResetPasswordFormProps } from '../types';

export function ResetPasswordForm({
  token,
  locale = 'ko',
  messages: messageOverrides,
  apiBasePath = '/api/auth',
  className,
  loginUrl = '/login',
}: ResetPasswordFormProps) {
  const allMessages = getMessages(locale);
  const t = { ...allMessages.resetPassword, ...messageOverrides };
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const schema = z.object({
    password: z.string().min(8, { message: allMessages.register.passwordTooShort }),
    confirm: z.string(),
  }).refine((data) => data.password === data.confirm, {
    message: t.passwordMismatch,
    path: ['confirm'],
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { errs[i.path[0] as string] = i.message; });
      setFieldErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const res = await authPost(`${apiBasePath}/reset-password`, { token, password: parsed.data.password });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Failed');
        return;
      }
      setSuccess(true);
    } catch {
      setError(allMessages.login.networkError);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '24px' }}>
        <p style={{ color: '#16a34a', fontSize: '14px' }}>{t.success}</p>
        <a href={loginUrl} style={{ marginTop: '16px', display: 'inline-block', fontSize: '14px', color: '#4f46e5' }}>
          {allMessages.forgotPassword.backToLogin}
        </a>
      </div>
    );
  }

  return (
    <div className={className} style={{ width: '100%', maxWidth: '384px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, textAlign: 'center', marginBottom: '8px' }}>{t.title}</h1>
      <p style={{ fontSize: '14px', color: '#6b7280', textAlign: 'center', marginBottom: '24px' }}>{t.subtitle}</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label htmlFor="wiz-reset-password" style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{t.passwordLabel}</label>
          <input
            id="wiz-reset-password"
            type="password"
            placeholder={t.passwordPlaceholder}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            disabled={loading}
            style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
          />
          {fieldErrors.password && <p style={{ marginTop: '4px', fontSize: '12px', color: '#ef4444' }}>{fieldErrors.password}</p>}
        </div>

        <div>
          <label htmlFor="wiz-reset-confirm" style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{t.confirmLabel}</label>
          <input
            id="wiz-reset-confirm"
            type="password"
            placeholder={t.confirmPlaceholder}
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            disabled={loading}
            style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
          />
          {fieldErrors.confirm && <p style={{ marginTop: '4px', fontSize: '12px', color: '#ef4444' }}>{fieldErrors.confirm}</p>}
        </div>

        {error && <div style={{ padding: '12px', fontSize: '14px', color: '#dc2626', backgroundColor: '#fef2f2', borderRadius: '6px' }}>{error}</div>}

        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', height: '40px', backgroundColor: '#4f46e5', color: '#fff', borderRadius: '6px', fontSize: '14px', fontWeight: 500, border: 'none', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}
        >
          {loading ? t.submitting : t.submitButton}
        </button>
      </form>
    </div>
  );
}
```

**i18n reuse strategy:** `resetPassword` messages don't include `passwordTooShort` or `networkError` keys. Instead of expanding the type, reuse existing messages: `register.passwordTooShort` for validation, `login.networkError` for catch block, `forgotPassword.backToLogin` for the success-state login link.

- [ ] **Step 4: Add export to `src/components/index.ts`**

Add this line:
```typescript
export { ResetPasswordForm } from './ResetPasswordForm';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run __tests__/unit/components/ResetPasswordForm.test.tsx`
Expected: PASS

- [ ] **Step 6: Run all tests for regressions**

Run: `npx vitest run`
Expected: All PASS

- [ ] **Step 7: Commit**

```bash
git add src/components/ResetPasswordForm.tsx src/components/index.ts __tests__/unit/components/ResetPasswordForm.test.tsx
git commit -m "feat: add ResetPasswordForm component"
```

---

### Task 4: EmailVerificationForm component

**Files:**
- Create: `src/components/EmailVerificationForm.tsx`
- Modify: `src/components/index.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/unit/components/EmailVerificationForm.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { EmailVerificationForm } from '../../../src/components/EmailVerificationForm';

describe('EmailVerificationForm', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading state on mount', () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));
    render(<EmailVerificationForm token="valid-token" />);
    expect(screen.getByText('인증 중...')).toBeInTheDocument();
  });

  it('shows success on valid token', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    }));

    render(<EmailVerificationForm token="valid-token" />);

    await waitFor(() => {
      expect(screen.getByText('인증 완료')).toBeInTheDocument();
      expect(screen.getByText('이메일이 성공적으로 인증되었습니다')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/auth/verify-email', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ token: 'valid-token' }),
    }));
  });

  it('shows login button on success with default loginUrl', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    }));

    render(<EmailVerificationForm token="valid-token" />);

    await waitFor(() => {
      const link = screen.getByText('로그인');
      expect(link.closest('a')).toHaveAttribute('href', '/login');
    });
  });

  it('shows error on invalid token', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Invalid token' }),
    }));

    render(<EmailVerificationForm token="bad-token" />);

    await waitFor(() => {
      expect(screen.getByText('인증 실패')).toBeInTheDocument();
      expect(screen.getByText('Invalid token')).toBeInTheDocument();
    });
  });

  it('shows resend link on error with default resendUrl', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Expired' }),
    }));

    render(<EmailVerificationForm token="expired-token" />);

    await waitFor(() => {
      const link = screen.getByText('인증 이메일 재전송');
      expect(link.closest('a')).toHaveAttribute('href', '/resend-verification');
    });
  });

  it('shows network error on fetch failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fetch failed')));

    render(<EmailVerificationForm token="any-token" />);

    await waitFor(() => {
      expect(screen.getByText('인증 실패')).toBeInTheDocument();
      expect(screen.getByText('네트워크 오류가 발생했습니다')).toBeInTheDocument();
    });
  });

  it('renders in English when locale="en"', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    }));

    render(<EmailVerificationForm token="valid-token" locale="en" />);

    await waitFor(() => {
      expect(screen.getByText('Verified')).toBeInTheDocument();
      expect(screen.getByText('Your email has been verified successfully')).toBeInTheDocument();
    });
  });

  it('uses custom apiBasePath', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    }));

    render(<EmailVerificationForm token="token" apiBasePath="/custom/auth" />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/custom/auth/verify-email', expect.anything());
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/unit/components/EmailVerificationForm.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Create `src/components/EmailVerificationForm.tsx`**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { getMessages } from '../i18n';
import { authPost } from '../utils/api-client';
import type { EmailVerificationFormProps } from '../types';

export function EmailVerificationForm({
  token,
  locale = 'ko',
  messages: messageOverrides,
  apiBasePath = '/api/auth',
  className,
  loginUrl = '/login',
  resendUrl = '/resend-verification',
}: EmailVerificationFormProps) {
  const t = { ...getMessages(locale).emailVerification, ...messageOverrides };
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      try {
        const res = await authPost(`${apiBasePath}/verify-email`, { token });
        const data = await res.json();

        if (cancelled) return;

        if (res.ok) {
          setStatus('success');
        } else {
          setStatus('error');
          setErrorMessage(data.error ?? t.errorInvalid);
        }
      } catch {
        if (cancelled) return;
        setStatus('error');
        setErrorMessage(t.networkError);
      }
    }

    verify();
    return () => { cancelled = true; };
  }, [token, apiBasePath]);

  if (status === 'loading') {
    return (
      <div className={className} style={{ textAlign: 'center', padding: '48px 24px' }}>
        <svg width="40" height="40" viewBox="0 0 40 40" style={{ animation: 'wiz-spin 1s linear infinite', margin: '0 auto 16px' }}>
          <circle cx="20" cy="20" r="16" fill="none" stroke="#d1d5db" strokeWidth="4" />
          <circle cx="20" cy="20" r="16" fill="none" stroke="#4f46e5" strokeWidth="4" strokeDasharray="80" strokeDashoffset="60" strokeLinecap="round" />
        </svg>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>{t.verifying}</p>
        <style>{`@keyframes wiz-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className={className} style={{ textAlign: 'center', padding: '48px 24px' }}>
        <svg width="48" height="48" viewBox="0 0 48 48" style={{ margin: '0 auto 16px' }}>
          <circle cx="24" cy="24" r="22" fill="#f0fdf4" stroke="#16a34a" strokeWidth="2" />
          <path d="M15 24l6 6 12-12" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#16a34a', marginBottom: '8px' }}>{t.successTitle}</h2>
        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>{t.successMessage}</p>
        <a
          href={loginUrl}
          style={{ display: 'inline-block', padding: '10px 24px', backgroundColor: '#4f46e5', color: '#fff', borderRadius: '6px', fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}
        >
          {t.loginButton}
        </a>
      </div>
    );
  }

  return (
    <div className={className} style={{ textAlign: 'center', padding: '48px 24px' }}>
      <svg width="48" height="48" viewBox="0 0 48 48" style={{ margin: '0 auto 16px' }}>
        <circle cx="24" cy="24" r="22" fill="#fef2f2" stroke="#dc2626" strokeWidth="2" />
        <path d="M17 17l14 14M31 17l-14 14" fill="none" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#dc2626', marginBottom: '8px' }}>{t.errorTitle}</h2>
      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>{errorMessage}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
        <a
          href={resendUrl}
          style={{ fontSize: '14px', color: '#4f46e5', textDecoration: 'none' }}
        >
          {t.resendLink}
        </a>
        <a
          href={loginUrl}
          style={{ display: 'inline-block', padding: '10px 24px', backgroundColor: '#4f46e5', color: '#fff', borderRadius: '6px', fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}
        >
          {t.loginButton}
        </a>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Add export to `src/components/index.ts`**

Add this line:
```typescript
export { EmailVerificationForm } from './EmailVerificationForm';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run __tests__/unit/components/EmailVerificationForm.test.tsx`
Expected: PASS

- [ ] **Step 6: Run all tests for regressions**

Run: `npx vitest run`
Expected: All PASS

- [ ] **Step 7: Commit**

```bash
git add src/components/EmailVerificationForm.tsx src/components/index.ts __tests__/unit/components/EmailVerificationForm.test.tsx
git commit -m "feat: add EmailVerificationForm component"
```

---

### Task 5: Page components — LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage, EmailVerificationPage

**Files:**
- Create: `src/pages/LoginPage.tsx`
- Create: `src/pages/RegisterPage.tsx`
- Create: `src/pages/ForgotPasswordPage.tsx`
- Create: `src/pages/ResetPasswordPage.tsx`
- Create: `src/pages/EmailVerificationPage.tsx`
- Create: `src/pages/index.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/unit/pages/pages.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  EmailVerificationPage,
} from '../../../src/pages';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ success: true }),
  }));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('LoginPage', () => {
  it('renders AuthLayout with LoginForm', () => {
    const { container } = render(<LoginPage />);
    expect(container.querySelector('.wiz-auth-page')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '로그인' })).toBeInTheDocument();
    expect(screen.getByLabelText('이메일')).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument();
  });

  it('passes layout props to AuthLayout', () => {
    const { container } = render(<LoginPage pattern="dots" backgroundColor="#ff0000" />);
    const sidePanel = container.querySelector('.wiz-auth-side-panel');
    expect(sidePanel).toHaveStyle({ backgroundColor: '#ff0000' });
  });

  it('passes form props through', () => {
    render(<LoginPage locale="en" />);
    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
  });
});

describe('RegisterPage', () => {
  it('renders AuthLayout with RegisterForm', () => {
    const { container } = render(<RegisterPage />);
    expect(container.querySelector('.wiz-auth-page')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '회원가입' })).toBeInTheDocument();
    expect(screen.getByLabelText('이름')).toBeInTheDocument();
  });
});

describe('ForgotPasswordPage', () => {
  it('renders AuthLayout with ForgotPasswordForm', () => {
    const { container } = render(<ForgotPasswordPage />);
    expect(container.querySelector('.wiz-auth-page')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '비밀번호 찾기' })).toBeInTheDocument();
  });
});

describe('ResetPasswordPage', () => {
  it('renders AuthLayout with ResetPasswordForm', () => {
    const { container } = render(<ResetPasswordPage token="abc" />);
    expect(container.querySelector('.wiz-auth-page')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '비밀번호 재설정' })).toBeInTheDocument();
  });
});

describe('EmailVerificationPage', () => {
  it('renders AuthLayout with EmailVerificationForm', async () => {
    const { container } = render(<EmailVerificationPage token="abc" />);
    expect(container.querySelector('.wiz-auth-page')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/unit/pages/pages.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Create `src/pages/LoginPage.tsx`**

```tsx
'use client';

import { AuthLayout } from '../components/AuthLayout';
import { LoginForm } from '../components/LoginForm';
import type { LoginPageProps } from '../types';

export function LoginPage({ logo, pattern, backgroundColor, leftPanel, className, ...formProps }: LoginPageProps) {
  return (
    <AuthLayout logo={logo} pattern={pattern} backgroundColor={backgroundColor} leftPanel={leftPanel} className={className}>
      <LoginForm {...formProps} />
    </AuthLayout>
  );
}
```

- [ ] **Step 4: Create `src/pages/RegisterPage.tsx`**

```tsx
'use client';

import { AuthLayout } from '../components/AuthLayout';
import { RegisterForm } from '../components/RegisterForm';
import type { RegisterPageProps } from '../types';

export function RegisterPage({ logo, pattern, backgroundColor, leftPanel, className, ...formProps }: RegisterPageProps) {
  return (
    <AuthLayout logo={logo} pattern={pattern} backgroundColor={backgroundColor} leftPanel={leftPanel} className={className}>
      <RegisterForm {...formProps} />
    </AuthLayout>
  );
}
```

- [ ] **Step 5: Create `src/pages/ForgotPasswordPage.tsx`**

```tsx
'use client';

import { AuthLayout } from '../components/AuthLayout';
import { ForgotPasswordForm } from '../components/ForgotPasswordForm';
import type { ForgotPasswordPageProps } from '../types';

export function ForgotPasswordPage({ logo, pattern, backgroundColor, leftPanel, className, ...formProps }: ForgotPasswordPageProps) {
  return (
    <AuthLayout logo={logo} pattern={pattern} backgroundColor={backgroundColor} leftPanel={leftPanel} className={className}>
      <ForgotPasswordForm {...formProps} />
    </AuthLayout>
  );
}
```

- [ ] **Step 6: Create `src/pages/ResetPasswordPage.tsx`**

```tsx
'use client';

import { AuthLayout } from '../components/AuthLayout';
import { ResetPasswordForm } from '../components/ResetPasswordForm';
import type { ResetPasswordPageProps } from '../types';

export function ResetPasswordPage({ logo, pattern, backgroundColor, leftPanel, className, ...formProps }: ResetPasswordPageProps) {
  return (
    <AuthLayout logo={logo} pattern={pattern} backgroundColor={backgroundColor} leftPanel={leftPanel} className={className}>
      <ResetPasswordForm {...formProps} />
    </AuthLayout>
  );
}
```

- [ ] **Step 7: Create `src/pages/EmailVerificationPage.tsx`**

```tsx
'use client';

import { AuthLayout } from '../components/AuthLayout';
import { EmailVerificationForm } from '../components/EmailVerificationForm';
import type { EmailVerificationPageProps } from '../types';

export function EmailVerificationPage({ logo, pattern, backgroundColor, leftPanel, className, ...formProps }: EmailVerificationPageProps) {
  return (
    <AuthLayout logo={logo} pattern={pattern} backgroundColor={backgroundColor} leftPanel={leftPanel} className={className}>
      <EmailVerificationForm {...formProps} />
    </AuthLayout>
  );
}
```

- [ ] **Step 8: Create `src/pages/index.ts`**

```typescript
export { LoginPage } from './LoginPage';
export { RegisterPage } from './RegisterPage';
export { ForgotPasswordPage } from './ForgotPasswordPage';
export { ResetPasswordPage } from './ResetPasswordPage';
export { EmailVerificationPage } from './EmailVerificationPage';
```

- [ ] **Step 9: Run test to verify it passes**

Run: `npx vitest run __tests__/unit/pages/pages.test.tsx`
Expected: PASS

- [ ] **Step 10: Run all tests for regressions**

Run: `npx vitest run`
Expected: All PASS

- [ ] **Step 11: Commit**

```bash
git add src/pages/ __tests__/unit/pages/
git commit -m "feat: add LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage, EmailVerificationPage"
```

---

### Task 6: Exports — src/index.ts, package.json, tsup.config.ts, smoke tests

**Files:**
- Modify: `src/index.ts`
- Modify: `package.json`
- Modify: `tsup.config.ts`
- Modify: `__tests__/smoke/exports.test.ts`

- [ ] **Step 1: Update `src/index.ts`**

Add pages export:

```typescript
export * from './components';
export * from './hooks';
export * from './types';
export * from './pages';
export { getMessages, mergeMessages } from './i18n';
```

- [ ] **Step 2: Update `package.json` exports**

Add `"./pages"` entry to the `exports` field:

```json
"./pages": { "types": "./dist/pages/index.d.ts", "default": "./dist/pages/index.js" }
```

- [ ] **Step 3: Update `tsup.config.ts`**

Add pages entry point:

```typescript
entry: [
  'src/index.ts',
  'src/components/index.ts',
  'src/hooks/index.ts',
  'src/i18n/index.ts',
  'src/pages/index.ts',
],
```

- [ ] **Step 4: Update smoke tests**

Add to `__tests__/smoke/exports.test.ts`:

In the imports, add:
```typescript
import {
  // ... existing imports ...
  ResetPasswordForm,
  EmailVerificationForm,
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  EmailVerificationPage,
} from '../../src/index';
```

Add to `'Library exports - smoke tests'` describe block:

```typescript
  it('ResetPasswordForm can be imported and is a function', () => {
    expect(ResetPasswordForm).toBeDefined();
    expect(typeof ResetPasswordForm).toBe('function');
  });

  it('EmailVerificationForm can be imported and is a function', () => {
    expect(EmailVerificationForm).toBeDefined();
    expect(typeof EmailVerificationForm).toBe('function');
  });

  it('LoginPage can be imported and is a function', () => {
    expect(LoginPage).toBeDefined();
    expect(typeof LoginPage).toBe('function');
  });

  it('RegisterPage can be imported and is a function', () => {
    expect(RegisterPage).toBeDefined();
    expect(typeof RegisterPage).toBe('function');
  });

  it('ForgotPasswordPage can be imported and is a function', () => {
    expect(ForgotPasswordPage).toBeDefined();
    expect(typeof ForgotPasswordPage).toBe('function');
  });

  it('ResetPasswordPage can be imported and is a function', () => {
    expect(ResetPasswordPage).toBeDefined();
    expect(typeof ResetPasswordPage).toBe('function');
  });

  it('EmailVerificationPage can be imported and is a function', () => {
    expect(EmailVerificationPage).toBeDefined();
    expect(typeof EmailVerificationPage).toBe('function');
  });
```

Add to `'Components render without crashing'` describe block:

```typescript
  it('ResetPasswordForm renders without crashing', () => {
    const { container } = render(React.createElement(ResetPasswordForm, { token: 'test' }));
    expect(container).toBeTruthy();
  });

  it('EmailVerificationForm renders without crashing', () => {
    const { container } = render(React.createElement(EmailVerificationForm, { token: 'test' }));
    expect(container).toBeTruthy();
  });

  it('LoginPage renders without crashing', () => {
    const { container } = render(React.createElement(LoginPage));
    expect(container).toBeTruthy();
  });

  it('RegisterPage renders without crashing', () => {
    const { container } = render(React.createElement(RegisterPage));
    expect(container).toBeTruthy();
  });

  it('ForgotPasswordPage renders without crashing', () => {
    const { container } = render(React.createElement(ForgotPasswordPage));
    expect(container).toBeTruthy();
  });

  it('ResetPasswordPage renders without crashing', () => {
    const { container } = render(React.createElement(ResetPasswordPage, { token: 'test' }));
    expect(container).toBeTruthy();
  });

  it('EmailVerificationPage renders without crashing', () => {
    const { container } = render(React.createElement(EmailVerificationPage, { token: 'test' }));
    expect(container).toBeTruthy();
  });
```

Also add `emailVerification` check to the `getMessages` test:

```typescript
    expect(messages.emailVerification).toBeDefined();
```

And update `mergeMessages` test to include `emailVerification`:

```typescript
    expect(merged.emailVerification).toBeDefined();
```

- [ ] **Step 5: Run all tests**

Run: `npx vitest run`
Expected: All PASS

- [ ] **Step 6: Build the package**

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 7: Commit**

```bash
git add src/index.ts package.json tsup.config.ts __tests__/smoke/exports.test.ts
git commit -m "feat: export pages and update build config"
```
