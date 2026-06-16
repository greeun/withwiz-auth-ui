# @withwiz/auth-ui

Customizable authentication UI components for React / Next.js projects.

## Features

- Login, Signup, Forgot Password, Reset Password, Email Verification forms
- OAuth support (Google, GitHub, Kakao)
- i18n (Korean, English, Japanese)
- Slot-based layout customization
- Lifecycle hooks (onBeforeSubmit, onSuccess, onError)
- AuthProvider context with session management
- Zod-based form validation
- Unstyled mode for full CSS control
- CSS custom properties for theming

## Structure

The package is layered. **`Form` is the real unit** — a self-contained card
(header + validation + API calls). A `Page` is just a thin wrapper:
`AuthLayout` (2-column split + decorative panel) around the matching `Form`.

```
Pick your entry point (granularity):

  〔Screen / Page〕  whole thing     ← built-in split layout, no assembly
     LoginScreen / SignupScreen / ...   (Screen = Form-shaped name)
     LoginPage   / SignupPage   / ...   (Page   = route-component name)
     │  same composition, two names
     └─ both are just a wrap:
          ┌─────────────────────────────┐
          │  AuthLayout (2-col split,    │
          │   triangle panel, logo)      │
          │   └── <LoginForm {...props}/>│  ← the core
          └─────────────────────────────┘

  〔Form〕  core only   ★recommended for custom layouts★
     LoginForm / SignupForm / ForgotPasswordForm /
     ResetPasswordForm / EmailVerificationForm
     │  (own card max-384 + header + zod validation + API calls)
     │
     └─ your layout, your call:
          <Modal>          <Sidebar>        <CustomPage>
            └ <LoginForm/>    └ <SignupForm/>  └ <LoginForm/>

  〔Parts〕  finer grain
     OAuthButtons   AuthLayout   useAuth / AuthProvider
```

```tsx
// 1) Page — built-in split layout, zero assembly
import { LoginPage } from '@withwiz/auth-ui';
<LoginPage providers={['google', 'kakao']} />

// 2) Form only — your own layout (recommended)
import { LoginForm } from '@withwiz/auth-ui';
<MyModal>
  <LoginForm providers={['google', 'kakao']} redirectAfterLogin="/dashboard" />
</MyModal>

// 3) Form + your own wrap
import { LoginForm, AuthLayout } from '@withwiz/auth-ui';
<AuthLayout pattern="hexagon" logo={<Logo />}>
  <LoginForm providers={['google']} />
</AuthLayout>
```

> `Form` components render their own card and header. `logo` and the decorative
> panel come from `AuthLayout`/`Page` only — a standalone `Form` shows neither.

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

export default function Login() {
  return (
    <AuthProvider apiBasePath="/api/auth">
      {/* Form only — drop into your own layout */}
      <LoginForm
        providers={['google', 'github']}
        locale="en"
        redirectAfterLogin="/dashboard"
      />
    </AuthProvider>
  );
}
```

## Pages

A `Page` = `AuthLayout` + the matching `Form`. Use it when you want the built-in
split layout without assembling it yourself. Page props are the union of
`AuthLayout`'s visual props (`logo`, `pattern`, `backgroundColor`, `leftPanel`)
and the wrapped `Form`'s props — extra props pass straight through to the form.

```tsx
import { LoginPage } from '@withwiz/auth-ui';
import '@withwiz/auth-ui/styles';

<LoginPage
  logo={<img src="/logo.svg" alt="Logo" />}
  pattern="triangle"             // 'triangle' | 'hexagon' | 'dots' | 'none'
  backgroundColor="#f0f4ff"
  providers={['google', 'kakao']}   // ↓ forwarded to <LoginForm />
  redirectAfterLogin="/dashboard"
  locale="ko"
/>
```

Available: `LoginPage`, `SignupPage`, `ForgotPasswordPage`, `ResetPasswordPage`,
`EmailVerificationPage` (also exported from `@withwiz/auth-ui/pages`).

## Screens

A `Screen` is the bundled experience used like a single form: the matching
`Form` + the triangle side panel + an optional logo, all in one component.
Same composition as a `Page`, just expressed as a Form-shaped default — reach
for it when you want "the login form, with our layout" in one import.

```tsx
import { LoginScreen } from '@withwiz/auth-ui';
import '@withwiz/auth-ui/styles';

// Triangle panel is on by default; logo is optional (renders nothing if omitted).
<LoginScreen
  logo={<Logo />}                  // optional
  providers={['google', 'kakao']}  // ↓ forwarded to <LoginForm />
  redirectAfterLogin="/dashboard"
  locale="ko"
/>
```

Bake your brand in once with a thin app-side wrapper so every screen shares it:

```tsx
// app/auth.tsx
import { LoginScreen, SignupScreen, ForgotPasswordScreen, ResetPasswordScreen } from '@withwiz/auth-ui';
import { Logo } from '@/components/Logo';

const brand = { logo: <Logo />, pattern: 'triangle', backgroundColor: '#f0f4ff' } as const;

export const Login  = (p) => <LoginScreen  {...brand} {...p} />;
export const Signup = (p) => <SignupScreen {...brand} {...p} />;
export const Forgot = (p) => <ForgotPasswordScreen {...brand} {...p} />;
export const Reset  = (p) => <ResetPasswordScreen  {...brand} {...p} />;
```

Available: `LoginScreen`, `SignupScreen`, `ForgotPasswordScreen`,
`ResetPasswordScreen`, `EmailVerificationScreen` (also exported from
`@withwiz/auth-ui/screens`). Each `*ScreenProps` equals the matching
`*PageProps`.

> `Screen` and `Page` render the same thing today. `Screen` is the Form-shaped
> name; `Page` is kept for the route-component convention.

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
  showSignupLink={true}
  unstyled={false}
  onOAuthClick={(provider) => {}}  // Override default OAuth redirect
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

### SignupForm

```tsx
<SignupForm
  providers={['google']}
  locale="ko"
  redirectAfterSignup="/welcome"
  showLoginLink={true}
  unstyled={false}
  apiBasePath="/api/auth"
  onOAuthClick={(provider) => {}}
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

### ResetPasswordForm

```tsx
<ResetPasswordForm
  token={tokenFromUrl}            // required — from the reset email link
  locale="ko"
  apiBasePath="/api/auth"
  loginUrl="/login"
  messages={{ title: '비밀번호 재설정' }}
/>
```

---

### EmailVerificationForm

```tsx
<EmailVerificationForm
  token={tokenFromUrl}            // required — from the verification email link
  locale="ko"
  apiBasePath="/api/auth"
  loginUrl="/login"
  resendUrl="/auth/resend"
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
  mode="login"                   // 'login' | 'signup'
  onOAuthStart={(provider) => {}}
  onOAuthClick={(provider) => {}}  // Override default redirect
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
| POST | `/api/auth/signup` | User registration |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/refresh` | Token refresh |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/forgot-password` | Send reset email |
| POST | `/api/auth/reset-password` | Set new password (`{ token, password }`) |
| POST | `/api/auth/verify-email` | Verify email (`{ token }`) |
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
