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
- Unstyled mode for full CSS control (all five forms)
- CSS custom properties for theming (24 tokens) + classNames slots + 3-state dark mode

## Theming

**The stylesheet import is required as of 0.6.0.** Component styles moved from
inline `style` attributes into `@layer wiz-auth` in `auth.css`; without the
import the components render unstyled.

```tsx
import '@withwiz/auth-ui/styles';
```

### 1. Brand with CSS variables

All 24 tokens are declared on `:root` inside `@layer wiz-auth`, so any
declaration of your own wins.

```css
:root {
  --wiz-auth-primary: oklch(0.48 0.11 162);
  --wiz-auth-radius: 10px;
  --wiz-auth-font: var(--font-geist-sans), system-ui, sans-serif;
}
```

| Group | Tokens |
|---|---|
| Brand | `primary` · `primary-hover` · `primary-foreground` |
| Surface | `background` · `foreground` · `muted-foreground` |
| Fields | `border` · `input` · `input-background` |
| Accents | `oauth-foreground` · `divider` |
| States | `error` · `error-background` · `field-error` · `success` · `success-background` |
| Metrics | `radius` · `field-height` · `oauth-height` · `content-width` · `field-gap` |
| Misc | `font` · `side-panel-background` · `color-scheme` |

All tokens are prefixed `--wiz-auth-`.

### 2. Fine control with classNames slots

Package styles live in the `wiz-auth` cascade layer, so your utility classes
win over any **unlayered** CSS regardless of import order — no `!important`,
no tailwind-merge.

```tsx
<LoginScreen
  classNames={{ input: 'rounded-xl border-2', submitButton: 'bg-emerald-600 hover:bg-emerald-700' }}
  layoutClassNames={{ sidePanel: 'bg-gradient-to-br from-emerald-600 to-teal-800' }}
/>
```

If your own CSS is itself layered — Tailwind v4's `@import "tailwindcss"`
emits `@layer theme, base, components, utilities;` — layer precedence is
decided by which layer is *declared* first, not by import order, so your
layered utilities can otherwise end up losing to `wiz-auth`. Declare the
layer order yourself before importing Tailwind:

```css
@layer wiz-auth, theme, base, components, utilities;  /* before @import "tailwindcss" */
@import "tailwindcss";
```

`classNames` targets the form; `layoutClassNames` targets the surrounding
`AuthLayout`. They are separate because `title` and `subtitle` exist on both.

Note: `classNames.root` maps to the element carrying `wiz-auth-form` (the form
wrapper `div`), while `classNames.form` maps to the actual `<form>` element.
The class name predates the split and is kept for backwards compatibility.

### 3. Dark mode

Three states are supported out of the box:

| State | How it is detected |
|---|---|
| System | `@media (prefers-color-scheme: dark)`, unless the app declares `[data-theme="light"]` or `.light` |
| App toggle | `[data-theme="dark"]` or `.dark` on the root element |
| Forced | `forceColorScheme="light" \| "dark"` on any screen, page, layout or form |

```tsx
<LoginScreen forceColorScheme="light" />   // stay light regardless of the app theme
```

**`forceColorScheme` and your own token overrides.** When forced, the
package declares its `--wiz-auth-*` tokens on the element carrying
`forceColorScheme` itself (`.wiz-auth-page` on a Screen/Page, the form root
otherwise) — not on `:root`. An element's own declaration always beats an
inherited one, and that is unaffected by specificity or cascade layers, so a
token override declared on an *ancestor* of that element will not win while
`forceColorScheme` is set. Target the forced element itself, or lower:

```css
/* without forceColorScheme — any ancestor works */
:root { --wiz-auth-primary: … }

/* with forceColorScheme — target the page element */
.my-auth-wrapper .wiz-auth-page { --wiz-auth-primary: … }
```

### 4. Full control with unstyled

`unstyled` drops every package class, leaving only what you pass in
`classNames`. Use it to keep the logic and validation while drawing the markup
with your own design system.

```tsx
<LoginForm unstyled classNames={{ root: 'my-card', input: 'my-input', submitButton: 'my-btn' }} />
```

See `docs/preview-*.html` for standalone, no-build previews of each screen and form.

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

Split-panel layout with decorative patterns for desktop. This is the layout the
`*Screen`/`*Page` components wrap around their form — use it directly when you
want that split panel + logo but need to control placement yourself.

```tsx
import { AuthLayout, LoginForm } from '@withwiz/auth-ui';

<AuthLayout
  logo={<img src="/logo.svg" alt="Logo" />}
  title="Welcome"
  subtitle="Sign in to continue"
  pattern="triangle"             // 'triangle' | 'hexagon' | 'dots' | 'none'
  backgroundColor="#f0f4ff"
  leftPanel={<CustomPanel />}    // Override the decorative panel
  fullHeight={true}              // false → drop min-height:100vh to embed in a shell
>
  <LoginForm providers={['google']} />
</AuthLayout>
```

**Embedding the split layout inside your own shell.** `AuthLayout` (and therefore
`*Screen`/`*Page`) defaults to `min-height: 100vh` — it expects to own the
viewport, which is right for a dedicated auth route. To drop the same split
panel + logo into a bounded region of your own page chrome, pass
`fullHeight={false}` so it fills its container instead of the screen:

```tsx
// inside your app shell, in a sized region
<section style={{ height: 600 }}>
  <AuthLayout pattern="triangle" logo={<Logo />} fullHeight={false}>
    <LoginForm providers={['google']} apiBasePath="/api/auth" />
  </AuthLayout>
</section>
```

For a plain embed with no decorative panel at all, use the bare `LoginForm`
(just the card) instead.

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
