import type { ReactNode } from 'react';

export type OAuthProvider = 'google' | 'github' | 'kakao' | 'meta' | 'microsoft';

/**
 * Normalized failure information handed to `hooks.onError` (second argument).
 * Built from either response shape the server may send — the standard envelope
 * (`error: { code, key, userMessage, details }`) or the string form (`error: "…"`, `code`).
 */
export interface AuthErrorInfo {
  /** Text shown to the user */
  text: string;
  /** Machine key for branching: `error.key` (standard) or `code` (string form) */
  key?: string;
  /** Numeric code of the standard envelope (e.g. 40305) */
  code?: number;
  /** First reason per field, from `details.fieldErrors` */
  fieldErrors: Record<string, string>;
  /** HTTP status; 0 when no response was received */
  status: number;
  /** True when the request never got a response (network failure) */
  network: boolean;
}

/** `hooks.onSuccess` 의 두 번째 인자 (since 0.8). */
export interface AuthSuccessContext {
  /** LoginForm·SignupForm 은 파싱한 성공 응답 본문 전체를 넘긴다. 그 밖의 폼은 항상 null. */
  body: unknown;
}

/** Lifecycle hooks shared by the forms. */
export interface AuthFormHooks<TSubmit, TSuccess = unknown> {
  /** Return false to cancel the submission. */
  onBeforeSubmit?: (data: TSubmit) => Promise<boolean>;
  /**
   * Called after a successful response.
   *
   * `LoginForm` and `SignupForm` await it (since 0.8):
   * - return a path (a string starting with `/`, or an http(s) URL) to redirect there instead of
   *   `redirectAfterLogin` / `redirectAfterSignup`; it goes through the same same-origin check.
   *   Any other return value (empty string, a toast id, a non-string) is ignored and the
   *   default redirect applies;
   * - throw an `Error` with a message to stay on the page — the message is shown and `onError`
   *   is called (other thrown values show the form's generic fallback text).
   * The other forms ignore the return value. The return type is `unknown` so handlers written
   * for 0.7 that returned values (e.g. `() => toast('hi')`) still compile.
   */
  onSuccess?: (result: TSuccess, context: AuthSuccessContext) => unknown;
  /** `message` is the text the form shows; `info` carries the structured failure (since 0.7). */
  onError?: (message: string, info: AuthErrorInfo) => void;
}

export type ColorScheme = 'light' | 'dark';

/** Class name slots for the four form components. */
export interface AuthFormClassNames {
  /** Outer wrapper (carries `wiz-auth-form`). Release the width cap here. */
  root?: string;
  /** Title + subtitle block */
  header?: string;
  title?: string;
  subtitle?: string;
  /** The `<form>` element — adjust field spacing here */
  form?: string;
  /** One label + input pair */
  field?: string;
  label?: string;
  /** The `*` after a required field's label (since 0.8.4) */
  requiredMark?: string;
  input?: string;
  /** Validation message under a field */
  fieldError?: string;
  /** Error banner above the submit button */
  error?: string;
  submitButton?: string;
  /** Magic-link button */
  secondaryButton?: string;
  /** Inline links (forgot password, sign up, sign in) */
  link?: string;
  /** Paragraph holding the footer link */
  footer?: string;
  /** OAuth divider container */
  divider?: string;
  dividerLine?: string;
  dividerText?: string;
  /** OAuth button group */
  oauth?: string;
  oauthButton?: string;
  /** Submitted-successfully state box */
  success?: string;
  successText?: string;
}

/** Class name slots for AuthLayout. */
export interface AuthLayoutClassNames {
  root?: string;
  /** Left column holding logo, title and children */
  content?: string;
  logo?: string;
  title?: string;
  subtitle?: string;
  /** Wrapper around children */
  body?: string;
  sidePanel?: string;
}

/** Class name slots for the EmailVerification status screens. */
export interface AuthStatusClassNames {
  root?: string;
  icon?: string;
  title?: string;
  message?: string;
  actions?: string;
  /** Button-shaped link (go to login) */
  primaryAction?: string;
  /** Plain link (resend verification) */
  secondaryLink?: string;
}

/** Class name slots for OAuthButtons used on its own. */
export interface OAuthButtonsClassNames {
  root?: string;
  button?: string;
}

export interface AuthMessages {
  login: {
    title: string;
    subtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    submitButton: string;
    submitting: string;
    forgotPassword: string;
    noAccount: string;
    signUp: string;
    orDivider: string;
    continueWithGoogle: string;
    continueWithGitHub: string;
    continueWithKakao: string;
    continueWithMagicLink: string;
    invalidEmail: string;
    passwordTooShort: string;
    invalidCredentials: string;
    emailNotVerified: string;
    networkError: string;
  };
  signup: {
    title: string;
    subtitle: string;
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    submitButton: string;
    submitting: string;
    alreadyHaveAccount: string;
    signIn: string;
    orDivider: string;
    continueWithGoogle: string;
    continueWithGitHub: string;
    continueWithKakao: string;
    nameTooShort: string;
    invalidEmail: string;
    passwordTooShort: string;
    registrationFailed: string;
    networkError: string;
    successTitle: string;
    successMessage: string;
  };
  forgotPassword: {
    title: string;
    subtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    submitButton: string;
    submitting: string;
    success: string;
    backToLogin: string;
    failed: string;
    networkError: string;
  };
  resetPassword: {
    title: string;
    subtitle: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    confirmLabel: string;
    confirmPlaceholder: string;
    submitButton: string;
    submitting: string;
    success: string;
    passwordMismatch: string;
    failed: string;
    networkError: string;
  };
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
  oauth: {
    /** `{provider}` is replaced with the provider's display name */
    continueWith: string;
    /** Used when `mode="signup"`; `{provider}` placeholder as above */
    signUpWith: string;
    failed: string;
    providers: Record<OAuthProvider, string>;
  };
}

/** OAuth label overrides; provider display names may be overridden one by one. */
export type OAuthMessagesOverride = Partial<Omit<AuthMessages['oauth'], 'providers'>> & {
  providers?: Partial<Record<OAuthProvider, string>>;
};

/** Partial overrides for `mergeMessages`, one level deep (and per provider for `oauth`). */
export type AuthMessagesOverrides = {
  [K in Exclude<keyof AuthMessages, 'oauth'>]?: Partial<AuthMessages[K]>;
} & { oauth?: OAuthMessagesOverride };

export interface AuthLayoutProps {
  children: ReactNode;
  logo?: ReactNode;
  title?: string;
  subtitle?: string;
  pattern?: 'triangle' | 'hexagon' | 'dots' | 'none';
  backgroundColor?: string;
  leftPanel?: ReactNode;
  className?: string;
  /** When false, drops the `min-height: 100vh` so the layout fits inside a
   *  bounded region (e.g. embedded in an app shell). Defaults to true. */
  fullHeight?: boolean;
  classNames?: AuthLayoutClassNames;
  forceColorScheme?: ColorScheme;
}

export interface LoginFormProps {
  /** Show `*` after required field labels. Default `true` (since 0.8.4). */
  requiredMark?: boolean;
  providers?: OAuthProvider[];
  redirectAfterLogin?: string;
  showMagicLink?: boolean;
  showForgotPassword?: boolean;
  showSignupLink?: boolean;
  logo?: ReactNode;
  title?: string;
  subtitle?: string;
  locale?: 'ko' | 'en' | 'ja';
  messages?: Partial<AuthMessages['login']>;
  className?: string;
  unstyled?: boolean;
  classNames?: AuthFormClassNames;
  forceColorScheme?: ColorScheme;
  slots?: {
    header?: ReactNode;
    footer?: ReactNode;
    oauthSection?: ReactNode;
    beforeForm?: ReactNode;
    afterForm?: ReactNode;
  };
  hooks?: AuthFormHooks<{ email: string; password: string }>;
  onOAuthClick?: (provider: OAuthProvider) => void;
  /** Label overrides for the built-in OAuth buttons (they follow `locale` otherwise). */
  oauthMessages?: OAuthMessagesOverride;
  apiBasePath?: string;
  /** Link target of "forgot password". Default `/forgot-password` */
  forgotPasswordUrl?: string;
  /** Link target of "sign up". Default `/signup` */
  signupUrl?: string;
  /** Where the magic-link button goes. Default `/auth/magic-link` */
  magicLinkUrl?: string;
}

export interface SignupFormProps {
  /** Show `*` after required field labels. Default `true` (since 0.8.4). */
  requiredMark?: boolean;
  providers?: OAuthProvider[];
  redirectAfterSignup?: string;
  showLoginLink?: boolean;
  locale?: 'ko' | 'en' | 'ja';
  messages?: Partial<AuthMessages['signup']>;
  className?: string;
  unstyled?: boolean;
  classNames?: AuthFormClassNames;
  forceColorScheme?: ColorScheme;
  extraFields?: Array<{
    name: string;
    label: string;
    type?: string;
    required?: boolean;
    placeholder?: string;
  }>;
  /**
   * Values sent with the signup request without rendering an input (since 0.8),
   * e.g. `{ language: locale }`. The validated name/email/password and the
   * `extraFields` values always win over keys of the same name. Allow-list what
   * you persist on the server.
   */
  extraPayload?: Record<string, unknown>;
  slots?: {
    header?: ReactNode;
    footer?: ReactNode;
    oauthSection?: ReactNode;
    beforeForm?: ReactNode;
    afterForm?: ReactNode;
  };
  hooks?: AuthFormHooks<Record<string, string>>;
  onOAuthClick?: (provider: OAuthProvider) => void;
  /** Label overrides for the built-in OAuth buttons (they follow `locale` otherwise). */
  oauthMessages?: OAuthMessagesOverride;
  apiBasePath?: string;
  /** Link target of "sign in". Default `/login` */
  loginUrl?: string;
}

export interface OAuthButtonsProps {
  providers: OAuthProvider[];
  mode?: 'login' | 'signup';
  onOAuthStart?: (provider: OAuthProvider) => void;
  onOAuthClick?: (provider: OAuthProvider) => void;
  disabled?: boolean;
  className?: string;
  classNames?: OAuthButtonsClassNames;
  apiBasePath?: string;
  locale?: 'ko' | 'en' | 'ja';
  messages?: OAuthMessagesOverride;
  /** Called when starting the OAuth flow fails (non-2xx response or no `loginUrl`). */
  onError?: (info: AuthErrorInfo) => void;
}

export interface AuthProviderProps {
  children: ReactNode;
  apiBasePath?: string;
  onAuthChange?: (isAuthenticated: boolean) => void;
}

export interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: { id: string; email: string; name?: string; role: string } | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
}

export interface ForgotPasswordFormProps {
  /** Show `*` after required field labels. Default `true` (since 0.8.4). */
  requiredMark?: boolean;
  /** `header`: undefined → built-in title, null → hidden, node → replaces it (since 0.8). */
  slots?: { header?: ReactNode };
  locale?: 'ko' | 'en' | 'ja';
  messages?: Partial<AuthMessages['forgotPassword']>;
  apiBasePath?: string;
  className?: string;
  loginUrl?: string;
  classNames?: AuthFormClassNames;
  forceColorScheme?: ColorScheme;
  unstyled?: boolean;
  hooks?: AuthFormHooks<{ email: string }, void>;
}

export interface ResetPasswordFormProps {
  /** Show `*` after required field labels. Default `true` (since 0.8.4). */
  requiredMark?: boolean;
  /** `header`: undefined → built-in title, null → hidden, node → replaces it (since 0.8). */
  slots?: { header?: ReactNode };
  token: string;
  /**
   * Account the link was issued for. Falls back to the link's `?email=` query when
   * omitted — the endpoint matches token **and** email, so one of the two must reach it.
   */
  email?: string;
  locale?: 'ko' | 'en' | 'ja';
  messages?: Partial<AuthMessages['resetPassword']>;
  apiBasePath?: string;
  className?: string;
  loginUrl?: string;
  classNames?: AuthFormClassNames;
  forceColorScheme?: ColorScheme;
  unstyled?: boolean;
  hooks?: AuthFormHooks<{ password: string }, void>;
}

export interface EmailVerificationFormProps {
  token: string;
  /**
   * Account the link was issued for. Falls back to the link's `?email=` query when
   * omitted — the endpoint matches token **and** email, so one of the two must reach it.
   */
  email?: string;
  locale?: 'ko' | 'en' | 'ja';
  messages?: Partial<AuthMessages['emailVerification']>;
  apiBasePath?: string;
  className?: string;
  loginUrl?: string;
  resendUrl?: string;
  classNames?: AuthStatusClassNames;
  forceColorScheme?: ColorScheme;
  unstyled?: boolean;
  /** Verification runs on mount, so only the outcome hooks apply. */
  hooks?: Pick<AuthFormHooks<never, void>, 'onSuccess' | 'onError'>;
}

export interface LoginPageProps
  extends Pick<AuthLayoutProps, 'logo' | 'pattern' | 'backgroundColor' | 'leftPanel' | 'fullHeight' | 'forceColorScheme'>,
    Omit<LoginFormProps, 'className' | 'forceColorScheme'> {
  className?: string;
  /** Class name slots for the surrounding AuthLayout */
  layoutClassNames?: AuthLayoutClassNames;
}

export interface SignupPageProps
  extends Pick<AuthLayoutProps, 'logo' | 'pattern' | 'backgroundColor' | 'leftPanel' | 'fullHeight' | 'forceColorScheme'>,
    Omit<SignupFormProps, 'className' | 'forceColorScheme'> {
  className?: string;
  /** Class name slots for the surrounding AuthLayout */
  layoutClassNames?: AuthLayoutClassNames;
}

export interface ForgotPasswordPageProps
  extends Pick<AuthLayoutProps, 'logo' | 'pattern' | 'backgroundColor' | 'leftPanel' | 'fullHeight' | 'forceColorScheme'>,
    Omit<ForgotPasswordFormProps, 'className' | 'forceColorScheme'> {
  className?: string;
  /** Class name slots for the surrounding AuthLayout */
  layoutClassNames?: AuthLayoutClassNames;
}

export interface ResetPasswordPageProps
  extends Pick<AuthLayoutProps, 'logo' | 'pattern' | 'backgroundColor' | 'leftPanel' | 'fullHeight' | 'forceColorScheme'>,
    Omit<ResetPasswordFormProps, 'className' | 'forceColorScheme'> {
  className?: string;
  /** Class name slots for the surrounding AuthLayout */
  layoutClassNames?: AuthLayoutClassNames;
}

export interface EmailVerificationPageProps
  extends Pick<AuthLayoutProps, 'logo' | 'pattern' | 'backgroundColor' | 'leftPanel' | 'fullHeight' | 'forceColorScheme'>,
    Omit<EmailVerificationFormProps, 'className' | 'forceColorScheme'> {
  className?: string;
  /** Class name slots for the surrounding AuthLayout */
  layoutClassNames?: AuthLayoutClassNames;
}
