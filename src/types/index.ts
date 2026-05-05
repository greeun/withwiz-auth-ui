import type { ReactNode } from 'react';

export type OAuthProvider = 'google' | 'github' | 'kakao';

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
  register: {
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
}

export interface LoginFormProps {
  providers?: OAuthProvider[];
  redirectAfterLogin?: string;
  showMagicLink?: boolean;
  showForgotPassword?: boolean;
  showRegisterLink?: boolean;
  logo?: ReactNode;
  title?: string;
  subtitle?: string;
  locale?: 'ko' | 'en' | 'ja';
  messages?: Partial<AuthMessages['login']>;
  className?: string;
  unstyled?: boolean;
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
  apiBasePath?: string;
}

export interface RegisterFormProps {
  providers?: OAuthProvider[];
  redirectAfterRegister?: string;
  showLoginLink?: boolean;
  locale?: 'ko' | 'en' | 'ja';
  messages?: Partial<AuthMessages['register']>;
  className?: string;
  unstyled?: boolean;
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
  apiBasePath?: string;
}

export interface OAuthButtonsProps {
  providers: OAuthProvider[];
  mode?: 'login' | 'register';
  onOAuthStart?: (provider: OAuthProvider) => void;
  disabled?: boolean;
  className?: string;
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
}

export interface ResetPasswordFormProps {
  locale?: 'ko' | 'en' | 'ja';
  messages?: Partial<AuthMessages['resetPassword']>;
  apiBasePath?: string;
  className?: string;
  loginUrl?: string;
}
