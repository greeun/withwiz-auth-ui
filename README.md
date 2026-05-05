# @withwiz/auth-ui

Customizable authentication UI components for React / Next.js projects.

## Features

- Login, Register, Forgot Password forms
- OAuth support (Google, GitHub, Kakao)
- i18n (Korean, English, Japanese)
- Slot-based layout customization
- Lifecycle hooks (onBeforeSubmit, onSuccess, onError)
- AuthProvider context with session management
- Zod-based form validation
- Unstyled mode for full CSS control
- CSS custom properties for theming

## Installation

```bash
pnpm add @withwiz/auth-ui
```

**Peer dependencies:**

```bash
pnpm add react react-dom next
```

## Quick Start

```tsx
import { AuthProvider, LoginForm } from '@withwiz/auth-ui';
import '@withwiz/auth-ui/styles';

export default function LoginPage() {
  return (
    <AuthProvider apiBasePath="/api/auth">
      <LoginForm
        providers={['google', 'github']}
        locale="en"
        redirectAfterLogin="/dashboard"
      />
    </AuthProvider>
  );
}
```

## Components

### AuthProvider

Wraps your app to provide authentication context (`useAuth` hook).

```tsx
<AuthProvider
  apiBasePath="/api/auth"        // API endpoint base path (default: '/api/auth')
  onAuthChange={(isAuth) => {}}  // Called when auth state changes
>
  {children}
</AuthProvider>
```

#### useAuth Hook

```tsx
const { isAuthenticated, isLoading, user, login, logout, refresh } = useAuth();
```

| Property | Type | Description |
|---|---|---|
| `isAuthenticated` | `boolean` | Whether user is logged in |
| `isLoading` | `boolean` | Loading state during initial check |
| `user` | `{ id, email, name?, role }` | Current user or null |
| `login(email, password)` | `Promise<void>` | Login method |
| `logout()` | `Promise<void>` | Logout method |
| `refresh()` | `Promise<boolean>` | Refresh token |

---

### LoginForm

```tsx
<LoginForm
  providers={['google', 'github', 'kakao']}
  locale="en"                    // 'ko' | 'en' | 'ja'
  redirectAfterLogin="/dashboard"
  showMagicLink={false}
  showForgotPassword={true}
  showRegisterLink={true}
  unstyled={false}
  apiBasePath="/api/auth"
  title="Welcome back"
  subtitle="Sign in to your account"
  messages={{ submitButton: 'Log In' }}  // Partial override
  hooks={{
    onBeforeSubmit: async (data) => true,
    onSuccess: (user) => console.log(user),
    onError: (error) => console.error(error),
  }}
  slots={{
    header: <MyCustomHeader />,
    footer: <MyCustomFooter />,
    oauthSection: <MyOAuth />,
    beforeForm: <Banner />,
    afterForm: <Links />,
  }}
/>
```

---

### RegisterForm

```tsx
<RegisterForm
  providers={['google']}
  locale="ko"
  redirectAfterRegister="/welcome"
  showLoginLink={true}
  unstyled={false}
  apiBasePath="/api/auth"
  extraFields={[
    { name: 'company', label: 'Company', required: true, placeholder: 'Acme Inc.' },
  ]}
  hooks={{
    onBeforeSubmit: async (data) => true,
    onSuccess: (user) => {},
    onError: (error) => {},
  }}
  slots={{ header: null, footer: null }}
/>
```

---

### ForgotPasswordForm

```tsx
<ForgotPasswordForm
  locale="en"
  apiBasePath="/api/auth"
  loginUrl="/login"
  messages={{ title: 'Reset Password' }}
/>
```

---

### AuthLayout

Split-panel layout with decorative patterns for desktop.

```tsx
import { AuthLayout, LoginForm } from '@withwiz/auth-ui';

<AuthLayout
  logo={<img src="/logo.svg" alt="Logo" />}
  title="Welcome"
  subtitle="Sign in to continue"
  pattern="triangle"             // 'triangle' | 'hexagon' | 'dots' | 'none'
  backgroundColor="#f0f4ff"
  leftPanel={<CustomPanel />}    // Override the decorative panel
>
  <LoginForm providers={['google']} />
</AuthLayout>
```

---

### OAuthButtons

Standalone OAuth button group.

```tsx
<OAuthButtons
  providers={['google', 'github', 'kakao']}
  mode="login"                   // 'login' | 'register'
  onOAuthStart={(provider) => {}}
  disabled={false}
  apiBasePath="/api/auth"
/>
```

## Hooks

### useAuthForm

Generic form hook with Zod validation.

```tsx
import { useAuthForm } from '@withwiz/auth-ui/hooks';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

function MyForm() {
  const { errors, loading, serverError, submit } = useAuthForm({
    schema,
    onSubmit: async (data) => {
      await fetch('/api/auth/login', { method: 'POST', body: JSON.stringify(data) });
    },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit({ email, password }); }}>
      {errors.email && <span>{errors.email}</span>}
      {serverError && <span>{serverError}</span>}
      <button disabled={loading}>Submit</button>
    </form>
  );
}
```

## i18n

Built-in locales: `ko`, `en`, `ja`.

```tsx
import { getMessages, mergeMessages } from '@withwiz/auth-ui/i18n';

// Get all messages for a locale
const messages = getMessages('en');

// Merge with custom overrides
const custom = mergeMessages('en', {
  login: { title: 'Sign In', submitButton: 'Go' },
});
```

Each component accepts a `messages` prop for partial overrides without replacing the full locale.

## Styling

### Default styles

Import the built-in stylesheet:

```tsx
import '@withwiz/auth-ui/styles';
```

### CSS Custom Properties

Override via CSS variables:

```css
.wiz-auth-page {
  --wiz-auth-primary: #4f46e5;
  --wiz-auth-primary-hover: #4338ca;
  --wiz-auth-error: #dc2626;
  --wiz-auth-background: #ffffff;
  --wiz-auth-foreground: #111827;
  --wiz-auth-border: #d1d5db;
  --wiz-auth-radius: 6px;
  --wiz-auth-font: system-ui, -apple-system, sans-serif;
}
```

### Unstyled Mode

Pass `unstyled={true}` to remove all default inline styles and class names, giving you full control.

```tsx
<LoginForm unstyled className="my-login-form" />
```

## API Endpoints (Expected)

The components expect these server-side endpoints:

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Email/password login |
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/refresh` | Token refresh |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/forgot-password` | Send reset email |
| POST | `/api/auth/oauth/login` | Start OAuth flow (returns `{ loginUrl }`) |

All endpoints are prefixed with `apiBasePath` (default: `/api/auth`).

## Development

```bash
pnpm install
pnpm build          # Build library
pnpm test           # Run tests
pnpm test:watch     # Watch mode
pnpm test:coverage  # Coverage report
```

## License

MIT

---

# @withwiz/auth-ui (한국어)

React / Next.js 프로젝트를 위한 커스터마이즈 가능한 인증 UI 컴포넌트 라이브러리.

## 주요 기능

- 로그인, 회원가입, 비밀번호 찾기 폼
- OAuth 지원 (Google, GitHub, Kakao)
- 다국어 지원 (한국어, 영어, 일본어)
- 슬롯 기반 레이아웃 커스터마이징
- 라이프사이클 훅 (onBeforeSubmit, onSuccess, onError)
- AuthProvider 컨텍스트 및 세션 관리
- Zod 기반 폼 유효성 검사
- 스타일 제거 모드 (unstyled)로 완전한 CSS 제어
- CSS 커스텀 프로퍼티 기반 테마

## 설치

```bash
pnpm add @withwiz/auth-ui
```

**필수 피어 의존성:**

```bash
pnpm add react react-dom next
```

## 빠른 시작

```tsx
import { AuthProvider, LoginForm } from '@withwiz/auth-ui';
import '@withwiz/auth-ui/styles';

export default function LoginPage() {
  return (
    <AuthProvider apiBasePath="/api/auth">
      <LoginForm
        providers={['google', 'github']}
        locale="ko"
        redirectAfterLogin="/dashboard"
      />
    </AuthProvider>
  );
}
```

## 컴포넌트

### AuthProvider

인증 컨텍스트를 제공하는 래퍼 컴포넌트입니다. `useAuth` 훅을 사용할 수 있게 합니다.

```tsx
<AuthProvider
  apiBasePath="/api/auth"        // API 엔드포인트 기본 경로 (기본값: '/api/auth')
  onAuthChange={(isAuth) => {}}  // 인증 상태 변경 시 호출
>
  {children}
</AuthProvider>
```

#### useAuth 훅

```tsx
const { isAuthenticated, isLoading, user, login, logout, refresh } = useAuth();
```

| 속성 | 타입 | 설명 |
|---|---|---|
| `isAuthenticated` | `boolean` | 로그인 여부 |
| `isLoading` | `boolean` | 초기 인증 확인 로딩 상태 |
| `user` | `{ id, email, name?, role }` | 현재 사용자 또는 null |
| `login(email, password)` | `Promise<void>` | 로그인 함수 |
| `logout()` | `Promise<void>` | 로그아웃 함수 |
| `refresh()` | `Promise<boolean>` | 토큰 갱신 함수 |

---

### LoginForm

```tsx
<LoginForm
  providers={['google', 'github', 'kakao']}
  locale="ko"                    // 'ko' | 'en' | 'ja'
  redirectAfterLogin="/dashboard"
  showMagicLink={false}
  showForgotPassword={true}
  showRegisterLink={true}
  unstyled={false}
  apiBasePath="/api/auth"
  title="다시 오신 것을 환영합니다"
  subtitle="계정에 로그인하세요"
  messages={{ submitButton: '로그인' }}  // 부분 오버라이드
  hooks={{
    onBeforeSubmit: async (data) => true,  // false 반환 시 제출 중단
    onSuccess: (user) => console.log(user),
    onError: (error) => console.error(error),
  }}
  slots={{
    header: <MyCustomHeader />,
    footer: <MyCustomFooter />,
    oauthSection: <MyOAuth />,
    beforeForm: <Banner />,
    afterForm: <Links />,
  }}
/>
```

---

### RegisterForm

```tsx
<RegisterForm
  providers={['google']}
  locale="ko"
  redirectAfterRegister="/welcome"
  showLoginLink={true}
  unstyled={false}
  apiBasePath="/api/auth"
  extraFields={[
    { name: 'company', label: '회사명', required: true, placeholder: '(주)위드위즈' },
  ]}
  hooks={{
    onBeforeSubmit: async (data) => true,
    onSuccess: (user) => {},
    onError: (error) => {},
  }}
  slots={{ header: null, footer: null }}
/>
```

---

### ForgotPasswordForm

```tsx
<ForgotPasswordForm
  locale="ko"
  apiBasePath="/api/auth"
  loginUrl="/login"
  messages={{ title: '비밀번호 재설정' }}
/>
```

---

### AuthLayout

데스크톱에서 분할 패널 레이아웃을 제공하며 장식 패턴을 표시합니다.

```tsx
import { AuthLayout, LoginForm } from '@withwiz/auth-ui';

<AuthLayout
  logo={<img src="/logo.svg" alt="로고" />}
  title="환영합니다"
  subtitle="계속하려면 로그인하세요"
  pattern="triangle"             // 'triangle' | 'hexagon' | 'dots' | 'none'
  backgroundColor="#f0f4ff"
  leftPanel={<CustomPanel />}    // 장식 패널 커스터마이징
>
  <LoginForm providers={['google']} />
</AuthLayout>
```

---

### OAuthButtons

독립 사용 가능한 OAuth 버튼 그룹.

```tsx
<OAuthButtons
  providers={['google', 'github', 'kakao']}
  mode="login"                   // 'login' | 'register'
  onOAuthStart={(provider) => {}}
  disabled={false}
  apiBasePath="/api/auth"
/>
```

## 훅

### useAuthForm

Zod 스키마 기반의 범용 폼 훅.

```tsx
import { useAuthForm } from '@withwiz/auth-ui/hooks';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

function MyForm() {
  const { errors, loading, serverError, submit } = useAuthForm({
    schema,
    onSubmit: async (data) => {
      await fetch('/api/auth/login', { method: 'POST', body: JSON.stringify(data) });
    },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit({ email, password }); }}>
      {errors.email && <span>{errors.email}</span>}
      {serverError && <span>{serverError}</span>}
      <button disabled={loading}>제출</button>
    </form>
  );
}
```

## 다국어 (i18n)

지원 로케일: `ko`, `en`, `ja`

```tsx
import { getMessages, mergeMessages } from '@withwiz/auth-ui/i18n';

// 특정 로케일의 전체 메시지 가져오기
const messages = getMessages('ko');

// 커스텀 오버라이드와 병합
const custom = mergeMessages('ko', {
  login: { title: '로그인', submitButton: '시작하기' },
});
```

각 컴포넌트는 `messages` prop으로 부분 오버라이드를 지원합니다. 전체 로케일을 교체하지 않아도 됩니다.

## 스타일링

### 기본 스타일

내장 스타일시트를 import합니다:

```tsx
import '@withwiz/auth-ui/styles';
```

### CSS 커스텀 프로퍼티

CSS 변수를 오버라이드하여 테마를 적용합니다:

```css
.wiz-auth-page {
  --wiz-auth-primary: #4f46e5;
  --wiz-auth-primary-hover: #4338ca;
  --wiz-auth-error: #dc2626;
  --wiz-auth-background: #ffffff;
  --wiz-auth-foreground: #111827;
  --wiz-auth-border: #d1d5db;
  --wiz-auth-radius: 6px;
  --wiz-auth-font: system-ui, -apple-system, sans-serif;
}
```

### 스타일 제거 모드 (Unstyled)

`unstyled={true}`를 전달하면 모든 기본 인라인 스타일과 클래스가 제거되어 완전히 자유로운 스타일링이 가능합니다.

```tsx
<LoginForm unstyled className="my-login-form" />
```

## 필요한 API 엔드포인트

컴포넌트가 기대하는 서버 측 엔드포인트:

| 메서드 | 엔드포인트 | 설명 |
|---|---|---|
| POST | `/api/auth/login` | 이메일/비밀번호 로그인 |
| POST | `/api/auth/register` | 회원가입 |
| POST | `/api/auth/logout` | 로그아웃 |
| POST | `/api/auth/refresh` | 토큰 갱신 |
| GET | `/api/auth/me` | 현재 사용자 조회 |
| POST | `/api/auth/forgot-password` | 비밀번호 재설정 메일 발송 |
| POST | `/api/auth/oauth/login` | OAuth 플로우 시작 (`{ loginUrl }` 반환) |

모든 엔드포인트는 `apiBasePath` (기본값: `/api/auth`)를 prefix로 사용합니다.

## 개발

```bash
pnpm install
pnpm build          # 라이브러리 빌드
pnpm test           # 테스트 실행
pnpm test:watch     # 워치 모드
pnpm test:coverage  # 커버리지 리포트
```

## 라이선스

MIT
