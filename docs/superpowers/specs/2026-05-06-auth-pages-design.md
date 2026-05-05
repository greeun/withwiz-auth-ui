# Auth Pages Design Spec

withwiz-auth-ui 패키지에 완성된 페이지 컴포넌트를 추가하여 url-shortener-mvp 등 소비 앱에서 라우터에 바로 연결할 수 있도록 한다.

## 결정사항

- 네비게이션: URL 기반 `<a href>` 하드 네비게이션
- 레이아웃: 모든 페이지는 AuthLayout을 포함 (비활성화 옵션 없음)
- 외부 의존성: 없음. 인라인 스타일, 자체 컴포넌트만 사용
- 라우팅 프레임워크 비종속: 순수 React 컴포넌트

## 페이지 목록

| Page | 조합 | 예상 URL |
|------|------|----------|
| LoginPage | AuthLayout + LoginForm | /login |
| RegisterPage | AuthLayout + RegisterForm | /register |
| ForgotPasswordPage | AuthLayout + ForgotPasswordForm | /forgot-password |
| ResetPasswordPage | AuthLayout + ResetPasswordForm | /reset-password?token= |
| EmailVerificationPage | AuthLayout + EmailVerificationForm | /verify-email?token= |

## 파일 구조

```
src/
  components/
    ResetPasswordForm.tsx          # NEW
    EmailVerificationForm.tsx      # NEW
    index.ts                       # UPDATE - export 추가
  pages/
    LoginPage.tsx                  # NEW
    RegisterPage.tsx               # NEW
    ForgotPasswordPage.tsx         # NEW
    ResetPasswordPage.tsx          # NEW
    EmailVerificationPage.tsx      # NEW
    index.ts                       # NEW
  types/
    index.ts                       # UPDATE - page props, new form props 추가
  i18n/
    ko.ts                          # UPDATE - resetPassword, emailVerification 메시지
    en.ts                          # UPDATE
    ja.ts                          # UPDATE
    index.ts                       # UPDATE - AuthMessages 타입 반영
  index.ts                         # UPDATE - pages export 추가
```

## 신규 폼 컴포넌트

### ResetPasswordForm

비밀번호 재설정 폼. 토큰 기반 비밀번호 변경을 처리한다.

**Props:**

```typescript
interface ResetPasswordFormProps {
  token: string;
  locale?: 'ko' | 'en' | 'ja';
  messages?: Partial<AuthMessages['resetPassword']>;
  apiBasePath?: string;
  className?: string;
  loginUrl?: string;
}
```

**동작:**
- 새 비밀번호 + 확인 입력 필드 2개
- zod로 클라이언트 검증: 최소 8자, 두 필드 일치 확인
- `POST {apiBasePath}/reset-password` 호출 (body: `{ token, password }`)
- 성공 시 "비밀번호가 변경되었습니다" 메시지 + 로그인 링크
- 실패 시 에러 메시지 표시

### EmailVerificationForm

이메일 인증 결과를 표시하는 컴포넌트. mount 시 토큰을 자동 검증한다.

**Props:**

```typescript
interface EmailVerificationFormProps {
  token: string;
  locale?: 'ko' | 'en' | 'ja';
  messages?: Partial<AuthMessages['emailVerification']>;
  apiBasePath?: string;
  className?: string;
  loginUrl?: string;
  resendUrl?: string;
}
```

**동작:**
- mount 시 `POST {apiBasePath}/verify-email` 호출 (body: `{ token }`)
- 3가지 상태: loading, success, error
- loading: 스피너 + "인증 중..." 텍스트
- success: 체크 아이콘 + 성공 메시지 + 로그인 버튼
- error: 에러 메시지 + 재전송 링크 + 로그인 버튼
- 아이콘은 인라인 SVG로 구현 (외부 의존성 없음)

## 페이지 컴포넌트 설계

### Props 패턴

각 페이지는 AuthLayout props + 해당 폼의 props를 합친 intersection type을 사용한다. 페이지 자체에 새로운 로직은 없다.

```typescript
// 예시: LoginPage
interface LoginPageProps extends
  Pick<AuthLayoutProps, 'logo' | 'pattern' | 'backgroundColor' | 'leftPanel'>,
  Omit<LoginFormProps, 'className'> {
  className?: string;
}
```

Pick으로 AuthLayout의 커스터마이징 가능한 props만 노출하고, 폼의 props는 전체를 전달한다.

### 페이지 컴포넌트 구조 (공통 패턴)

```tsx
export function LoginPage({ logo, pattern, backgroundColor, leftPanel, className, ...formProps }: LoginPageProps) {
  return (
    <AuthLayout logo={logo} pattern={pattern} backgroundColor={backgroundColor} leftPanel={leftPanel} className={className}>
      <LoginForm {...formProps} />
    </AuthLayout>
  );
}
```

### 토큰 기반 페이지 (ResetPasswordPage, EmailVerificationPage)

토큰은 소비 앱에서 URL query param을 파싱하여 prop으로 전달한다. 페이지 컴포넌트는 라우팅에 관여하지 않는다.

```tsx
// 소비 앱 (Next.js) 사용 예시
// app/reset-password/page.tsx
'use client';
import { useSearchParams } from 'next/navigation';
import { ResetPasswordPage } from '@withwiz/auth-ui/pages';

export default function Page() {
  const token = useSearchParams().get('token') ?? '';
  return <ResetPasswordPage token={token} />;
}
```

## i18n 추가

### AuthMessages 타입 확장

```typescript
interface AuthMessages {
  // ... 기존 login, register, forgotPassword, resetPassword ...

  emailVerification: {
    title: string;
    verifying: string;
    successTitle: string;
    successMessage: string;
    errorTitle: string;
    errorExpired: string;
    errorInvalid: string;
    networkError: string;
    loginButton: string;
    resendLink: string;
  };
}
```

`resetPassword`는 이미 타입 정의가 있으므로 메시지 값만 ko/en/ja에 추가한다.

### 기존 타입 수정

`ResetPasswordFormProps`에 `token: string` 필드를 추가한다 (현재 타입에는 없음).

### 기본값

- `loginUrl`: `/login`
- `resendUrl`: `/resend-verification`
- `apiBasePath`: `/api/auth`

## Export 구조

### package.json exports 추가

```json
{
  "exports": {
    "./pages": {
      "types": "./dist/pages/index.d.ts",
      "default": "./dist/pages/index.js"
    }
  }
}
```

### src/index.ts

```typescript
export * from './components';
export * from './hooks';
export * from './types';
export * from './pages';
export { getMessages, mergeMessages } from './i18n';
```

소비 앱에서 두 가지 방식으로 import 가능:

```typescript
// 전체 import
import { LoginPage } from '@withwiz/auth-ui';

// 트리쉐이킹 최적화
import { LoginPage } from '@withwiz/auth-ui/pages';
```
