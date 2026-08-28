'use client';

import { useState, type FormEvent } from 'react';
import { z } from 'zod';
import { OAuthButtons } from './OAuthButtons';
import { getMessages } from '../i18n';
import { authPost } from '../utils/api-client';
import { cx } from '../utils/class-names';
import type { LoginFormProps } from '../types';

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
  apiBasePath = '/api/auth',
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
      const res = await authPost(`${apiBasePath}/login`, parsed.data);
      const data = await res.json();

      if (!res.ok) {
        const msg = data.code === 'EMAIL_NOT_VERIFIED' ? t.emailNotVerified : (data.error ?? t.invalidCredentials);
        setError(msg);
        hooks?.onError?.(msg);
        return;
      }

      hooks?.onSuccess?.(data.user);
      window.location.href = redirectAfterLogin;
    } catch {
      setError(t.networkError);
      hooks?.onError?.(t.networkError);
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
            placeholder={t.emailPlaceholder}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            disabled={loading}
            className={cls('wiz-auth-input', classNames?.input)}
          />
          {fieldErrors.email && <p className={cls('wiz-auth-field-error', classNames?.fieldError)}>{fieldErrors.email}</p>}
        </div>

        <div className={cls('wiz-auth-field', classNames?.field)}>
          <label htmlFor="wiz-login-password" className={cls('wiz-auth-label', classNames?.label)}>{t.passwordLabel}</label>
          <input
            id="wiz-login-password"
            type="password"
            placeholder={t.passwordPlaceholder}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            disabled={loading}
            className={cls('wiz-auth-input', classNames?.input)}
          />
          {fieldErrors.password && <p className={cls('wiz-auth-field-error', classNames?.fieldError)}>{fieldErrors.password}</p>}
        </div>

        {error && <div className={cls('wiz-auth-error', classNames?.error)}>{error}</div>}

        <button type="submit" disabled={loading} className={cls('wiz-auth-submit', classNames?.submitButton)}>
          {loading ? t.submitting : t.submitButton}
        </button>
      </form>

      {showForgotPassword && (
        <p className={cls('wiz-auth-forgot')}>
          <a href="/forgot-password" className={cls('wiz-auth-link', classNames?.link)}>{t.forgotPassword}</a>
        </p>
      )}

      {showMagicLink && (
        <button
          type="button"
          onClick={() => { window.location.href = '/auth/magic-link'; }}
          className={cls('wiz-auth-secondary', classNames?.secondaryButton)}
        >
          {t.continueWithMagicLink}
        </button>
      )}

      {showSignupLink && (
        <p className={cls('wiz-auth-footer', classNames?.footer)}>
          {t.noAccount} <a href="/signup" className={cls('wiz-auth-link', classNames?.link)}>{t.signUp}</a>
        </p>
      )}

      {slots?.afterForm}
      {slots?.footer}
    </div>
  );
}
