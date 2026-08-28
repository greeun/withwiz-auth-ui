'use client';

import { useState, type FormEvent } from 'react';
import { z } from 'zod';
import { OAuthButtons } from './OAuthButtons';
import { getMessages } from '../i18n';
import { authPost } from '../utils/api-client';
import { cx } from '../utils/class-names';
import type { SignupFormProps } from '../types';

export function SignupForm({
  providers = [],
  redirectAfterSignup,
  showLoginLink = true,
  locale = 'ko',
  messages: messageOverrides,
  className,
  classNames,
  unstyled = false,
  forceColorScheme,
  extraFields = [],
  slots,
  hooks,
  onOAuthClick,
  apiBasePath = '/api/auth',
}: SignupFormProps) {
  const t = { ...getMessages(locale).signup, ...messageOverrides };
  const [form, setForm] = useState<Record<string, string>>({ name: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const schema = z.object({
    name: z.string().min(2, { message: t.nameTooShort }),
    email: z.string().email({ message: t.invalidEmail }),
    password: z.string().min(8, { message: t.passwordTooShort }),
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
      const proceed = await hooks.onBeforeSubmit(form);
      if (!proceed) return;
    }

    setLoading(true);
    try {
      const res = await authPost(`${apiBasePath}/signup`, form);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? t.registrationFailed);
        hooks?.onError?.(data.error);
        return;
      }

      setSuccess(true);
      hooks?.onSuccess?.(data.user);

      if (redirectAfterSignup) {
        setTimeout(() => { window.location.href = redirectAfterSignup; }, 3000);
      }
    } catch {
      setError(t.networkError);
    } finally {
      setLoading(false);
    }
  };

  /** Package class only when styled; consumer slot always. */
  const cls = (base: string, slot?: string) => cx(unstyled ? undefined : base, slot);

  if (success) {
    return (
      <div className={cls('wiz-auth-success', classNames?.success)} data-wiz-scheme={forceColorScheme}>
        <h2 className={cls('wiz-auth-success-title', classNames?.title)}>{t.successTitle}</h2>
        <p className={cls('wiz-auth-success-message', classNames?.successText)}>{t.successMessage}</p>
      </div>
    );
  }

  return (
    <div className={cls('wiz-auth-form', cx(className, classNames?.root))} data-wiz-scheme={forceColorScheme}>
      {slots?.header ?? (
        <div className={cls('wiz-auth-header', classNames?.header)}>
          <h1 className={cls('wiz-auth-title', classNames?.title)}>{t.title}</h1>
          <p className={cls('wiz-auth-subtitle', classNames?.subtitle)}>{t.subtitle}</p>
        </div>
      )}

      {slots?.beforeForm}

      {providers.length > 0 && (
        <>
          {slots?.oauthSection ?? (
            <OAuthButtons
              providers={providers}
              mode="signup"
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
          <label htmlFor="wiz-signup-name" className={cls('wiz-auth-label', classNames?.label)}>{t.nameLabel}</label>
          <input id="wiz-signup-name" type="text" placeholder={t.namePlaceholder} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={loading} className={cls('wiz-auth-input', classNames?.input)} />
          {fieldErrors.name && <p className={cls('wiz-auth-field-error', classNames?.fieldError)}>{fieldErrors.name}</p>}
        </div>

        <div className={cls('wiz-auth-field', classNames?.field)}>
          <label htmlFor="wiz-signup-email" className={cls('wiz-auth-label', classNames?.label)}>{t.emailLabel}</label>
          <input id="wiz-signup-email" type="email" placeholder={t.emailPlaceholder} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={loading} className={cls('wiz-auth-input', classNames?.input)} />
          {fieldErrors.email && <p className={cls('wiz-auth-field-error', classNames?.fieldError)}>{fieldErrors.email}</p>}
        </div>

        <div className={cls('wiz-auth-field', classNames?.field)}>
          <label htmlFor="wiz-signup-password" className={cls('wiz-auth-label', classNames?.label)}>{t.passwordLabel}</label>
          <input id="wiz-signup-password" type="password" placeholder={t.passwordPlaceholder} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} disabled={loading} className={cls('wiz-auth-input', classNames?.input)} />
          {fieldErrors.password && <p className={cls('wiz-auth-field-error', classNames?.fieldError)}>{fieldErrors.password}</p>}
        </div>

        {extraFields.map((field) => (
          <div key={field.name} className={cls('wiz-auth-field', classNames?.field)}>
            <label htmlFor={`wiz-signup-${field.name}`} className={cls('wiz-auth-label', classNames?.label)}>{field.label}</label>
            <input id={`wiz-signup-${field.name}`} type={field.type ?? 'text'} placeholder={field.placeholder} value={form[field.name] ?? ''} onChange={(e) => setForm({ ...form, [field.name]: e.target.value })} required={field.required} disabled={loading} className={cls('wiz-auth-input', classNames?.input)} />
          </div>
        ))}

        {error && <div className={cls('wiz-auth-error', classNames?.error)}>{error}</div>}

        <button type="submit" disabled={loading} className={cls('wiz-auth-submit', classNames?.submitButton)}>
          {loading ? t.submitting : t.submitButton}
        </button>
      </form>

      {showLoginLink && (
        <p className={cls('wiz-auth-footer', classNames?.footer)}>
          {t.alreadyHaveAccount} <a href="/login" className={cls('wiz-auth-link', classNames?.link)}>{t.signIn}</a>
        </p>
      )}

      {slots?.afterForm}
      {slots?.footer}
    </div>
  );
}
