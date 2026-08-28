import type { ReactNode } from 'react';

export type OAuthProvider = 'google' | 'github' | 'kakao';

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
}

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
  hooks?: {
    onBeforeSubmit?: (data: { email: string; password: string }) => Promise<boolean>;
    onSuccess?: (user: unknown) => void;
    onError?: (error: string) => void;
  };
  onOAuthClick?: (provider: OAuthProvider) => void;
  apiBasePath?: string;
}

export interface SignupFormProps {
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
  slots?: {
    header?: ReactNode;
    footer?: ReactNode;
    oauthSection?: ReactNode;
    beforeForm?: ReactNode;
    afterForm?: ReactNode;
  };
  hooks?: {
    onBeforeSubmit?: (data: Record<string, string>) => Promise<boolean>;
    onSuccess?: (user: unknown) => void;
    onError?: (error: string) => void;
  };
  onOAuthClick?: (provider: OAuthProvider) => void;
  apiBasePath?: string;
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
  locale?: 'ko' | 'en' | 'ja';
  messages?: Partial<AuthMessages['forgotPassword']>;
  apiBasePath?: string;
  className?: string;
  loginUrl?: string;
  classNames?: AuthFormClassNames;
  forceColorScheme?: ColorScheme;
  unstyled?: boolean;
}

export interface ResetPasswordFormProps {
  token: string;
  locale?: 'ko' | 'en' | 'ja';
  messages?: Partial<AuthMessages['resetPassword']>;
  apiBasePath?: string;
  className?: string;
  loginUrl?: string;
  classNames?: AuthFormClassNames;
  forceColorScheme?: ColorScheme;
  unstyled?: boolean;
}

export interface EmailVerificationFormProps {
  token: string;
  locale?: 'ko' | 'en' | 'ja';
  messages?: Partial<AuthMessages['emailVerification']>;
  apiBasePath?: string;
  className?: string;
  loginUrl?: string;
  resendUrl?: string;
  classNames?: AuthStatusClassNames;
  forceColorScheme?: ColorScheme;
  unstyled?: boolean;
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
