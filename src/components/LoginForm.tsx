'use client';

import { useState, type FormEvent } from 'react';
import { z } from 'zod';
import { OAuthButtons } from './OAuthButtons';
import { getMessages } from '../i18n';
import { authPost } from '../utils/api-client';
import { cx } from '../utils/class-names';
import { safeRedirectTarget } from '../utils/safe-redirect';
import { readAuthError, networkAuthError, readJsonSafely, hookFailure } from '../utils/read-auth-error';
import { readSuccessField } from '../utils/read-success-body';
import { pickFieldErrors, formLevelText, fieldErrorA11y } from '../utils/form-errors';
import type { AuthErrorInfo, LoginFormProps } from '../types';

export function LoginForm({
  providers = [],
  redirectAfterLogin = '/',
  showMagicLink = false,
  showForgotPassword = true,
  showSignupLink = true,
  title,
  subtitle,
  locale = 'ko',
  messages: messageOverrides,
  className,
  classNames,
  unstyled = false,
  forceColorScheme,
  slots,
  hooks,
  onOAuthClick,
  oauthMessages,
  apiBasePath = '/api/auth',
  forgotPasswordUrl = '/forgot-password',
  signupUrl = '/signup',
  magicLinkUrl = '/auth/magic-link',
}: LoginFormProps) {
  const t = { ...getMessages(locale).login, ...messageOverrides };
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const schema = z.object({
    email: z.string().email({ message: t.invalidEmail }),
    password: z.string().min(6, { message: t.passwordTooShort }),
  });

  /** Shows a failure (form-level and per-field) and reports it through `hooks.onError`. */
  const fail = (info: AuthErrorInfo) => {
    const shown = pickFieldErrors(info, ['email', 'password']);
    setFieldErrors(shown);
    setError(formLevelText(info, shown));
    hooks?.onError?.(info.text, info);
  };

  /** OAuth start failure: form-level text only — client validation messages on the inputs stay. */
  const failOAuth = (info: AuthErrorInfo) => {
    setError(info.text);
    hooks?.onError?.(info.text, info);
  };

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

    if (hooks?.onBeforeSubmit) {
      const proceed = await hooks.onBeforeSubmit(parsed.data);
      if (!proceed) return;
    }

    setLoading(true);
    try {
      let res: Response;
      let data: unknown;
      try {
        res = await authPost(`${apiBasePath}/login`, parsed.data);
        data = await readJsonSafely(res);
      } catch {
        fail(networkAuthError(t.networkError));
        return;
      }

      if (!res.ok) {
        const info = readAuthError(res.status, data, t.invalidCredentials);
        fail(info.key === 'EMAIL_NOT_VERIFIED' ? { ...info, text: t.emailNotVerified } : info);
        return;
      }
      // A 2xx whose body is not JSON (e.g. a proxy's HTML page) is not a confirmed login.
      if (data === null) {
        fail(readAuthError(res.status, null, t.networkError));
        return;
      }

      // The consumer decides what happens next (since 0.8): a returned string is the
      // redirect target, a throw keeps the user here with the error shown.
      let target: void | string;
      try {
        target = await hooks?.onSuccess?.(readSuccessField(data, 'user'), { body: data });
      } catch (err) {
        fail(hookFailure(err, t.networkError, res.status));
        return;
      }
      window.location.href = safeRedirectTarget(typeof target === 'string' ? target : redirectAfterLogin);
    } finally {
      setLoading(false);
    }
  };

  /** Package class only when styled; consumer slot always. */
  const cls = (base: string, slot?: string) => cx(unstyled ? undefined : base, slot);

  return (
    <div className={cls('wiz-auth-form', cx(className, classNames?.root))} data-wiz-scheme={forceColorScheme}>
      {slots?.header ?? (
        <div className={cls('wiz-auth-header', classNames?.header)}>
          <h1 className={cls('wiz-auth-title', classNames?.title)}>{title ?? t.title}</h1>
          {(subtitle ?? t.subtitle) && (
            <p className={cls('wiz-auth-subtitle', classNames?.subtitle)}>{subtitle ?? t.subtitle}</p>
          )}
        </div>
      )}

      {slots?.beforeForm}

      {providers.length > 0 && (
        <>
          {slots?.oauthSection ?? (
            <OAuthButtons
              providers={providers}
              mode="login"
              onOAuthClick={onOAuthClick}
              onError={failOAuth}
              locale={locale}
              messages={oauthMessages}
              apiBasePath={apiBasePath}
              classNames={{ root: classNames?.oauth, button: classNames?.oauthButton }}
            />
          )}
          <div className={cls('wiz-auth-divider', classNames?.divider)}>
            <hr className={cls('wiz-auth-divider-line', classNames?.dividerLine)} />
            <span className={cls('wiz-auth-divider-text', classNames?.dividerText)}>{t.orDivider}</span>
            <hr className={cls('wiz-auth-divider-line', classNames?.dividerLine)} />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className={cls('wiz-auth-fields', classNames?.form)}>
        <div className={cls('wiz-auth-field', classNames?.field)}>
          <label htmlFor="wiz-login-email" className={cls('wiz-auth-label', classNames?.label)}>{t.emailLabel}</label>
          <input
            id="wiz-login-email"
            type="email"
            autoComplete="email"
            placeholder={t.emailPlaceholder}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            disabled={loading}
            className={cls('wiz-auth-input', classNames?.input)}
            {...fieldErrorA11y('wiz-login-email', fieldErrors.email)}
          />
          {fieldErrors.email && <p id="wiz-login-email-error" className={cls('wiz-auth-field-error', classNames?.fieldError)}>{fieldErrors.email}</p>}
        </div>

        <div className={cls('wiz-auth-field', classNames?.field)}>
          <label htmlFor="wiz-login-password" className={cls('wiz-auth-label', classNames?.label)}>{t.passwordLabel}</label>
          <input
            id="wiz-login-password"
            type="password"
            autoComplete="current-password"
            placeholder={t.passwordPlaceholder}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            disabled={loading}
            className={cls('wiz-auth-input', classNames?.input)}
            {...fieldErrorA11y('wiz-login-password', fieldErrors.password)}
          />
          {fieldErrors.password && <p id="wiz-login-password-error" className={cls('wiz-auth-field-error', classNames?.fieldError)}>{fieldErrors.password}</p>}
        </div>

        {error && <div className={cls('wiz-auth-error', classNames?.error)}>{error}</div>}

        <button type="submit" disabled={loading} className={cls('wiz-auth-submit', classNames?.submitButton)}>
          {loading ? t.submitting : t.submitButton}
        </button>
      </form>

      {showForgotPassword && (
        <p className={cls('wiz-auth-forgot')}>
          <a href={forgotPasswordUrl} className={cls('wiz-auth-link', classNames?.link)}>{t.forgotPassword}</a>
        </p>
      )}

      {showMagicLink && (
        <button
          type="button"
          onClick={() => { window.location.href = safeRedirectTarget(magicLinkUrl, '/auth/magic-link'); }}
          className={cls('wiz-auth-secondary', classNames?.secondaryButton)}
        >
          {t.continueWithMagicLink}
        </button>
      )}

      {showSignupLink && (
        <p className={cls('wiz-auth-footer', classNames?.footer)}>
          {t.noAccount} <a href={signupUrl} className={cls('wiz-auth-link', classNames?.link)}>{t.signUp}</a>
        </p>
      )}

      {slots?.afterForm}
      {slots?.footer}
    </div>
  );
}
