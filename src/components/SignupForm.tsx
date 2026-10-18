'use client';

import { useState, type FormEvent } from 'react';
import { z } from 'zod';
import { OAuthButtons } from './OAuthButtons';
import { getMessages } from '../i18n';
import { authPost } from '../utils/api-client';
import { cx } from '../utils/class-names';
import { safeRedirectTarget, pickRedirectTarget } from '../utils/safe-redirect';
import { readAuthError, networkAuthError, readJsonSafely, hookFailure } from '../utils/read-auth-error';
import { readSuccessField } from '../utils/read-success-body';
import { pickFieldErrors, formLevelText, fieldErrorA11y } from '../utils/form-errors';
import type { AuthErrorInfo, SignupFormProps } from '../types';

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
  extraPayload,
  slots,
  hooks,
  onOAuthClick,
  oauthMessages,
  apiBasePath = '/api/auth',
  loginUrl = '/login',
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

  /** Shows a failure (form-level and per-field) and reports it through `hooks.onError`. */
  const fail = (info: AuthErrorInfo) => {
    const shown = pickFieldErrors(info, ['name', 'email', 'password', ...extraFields.map((f) => f.name)]);
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

    // Only the validated core fields plus the declared extra fields reach the
    // server — never the raw state object, so stray keys cannot ride along.
    const fields: Record<string, string> = { ...parsed.data };
    for (const field of extraFields) {
      fields[field.name] = form[field.name] ?? '';
    }

    if (hooks?.onBeforeSubmit) {
      const proceed = await hooks.onBeforeSubmit(fields);
      if (!proceed) return;
    }

    // extraPayload goes first so the form's own values always win.
    const payload: Record<string, unknown> = { ...extraPayload, ...fields };

    setLoading(true);
    try {
      let res: Response;
      let data: unknown;
      try {
        res = await authPost(`${apiBasePath}/signup`, payload);
        data = await readJsonSafely(res);
      } catch {
        fail(networkAuthError(t.networkError));
        return;
      }

      if (!res.ok) {
        fail(readAuthError(res.status, data, t.registrationFailed));
        return;
      }
      // A 2xx whose body is not JSON (e.g. a proxy's HTML page) is not a confirmed signup.
      if (data === null) {
        fail(readAuthError(res.status, null, t.networkError));
        return;
      }

      // The consumer decides what happens next (since 0.8): a returned string is the
      // redirect target, a throw keeps the user on the form with the error shown.
      let target: unknown;
      try {
        target = await hooks?.onSuccess?.(readSuccessField(data, 'user'), { body: data });
      } catch (err) {
        fail(hookFailure(err, t.registrationFailed, res.status));
        return;
      }

      setSuccess(true);
      const next = pickRedirectTarget(target, redirectAfterSignup);
      if (next) {
        setTimeout(() => { window.location.href = safeRedirectTarget(next); }, 3000);
      }
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
          <label htmlFor="wiz-signup-name" className={cls('wiz-auth-label', classNames?.label)}>{t.nameLabel}</label>
          <input id="wiz-signup-name" type="text" autoComplete="name" placeholder={t.namePlaceholder} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={loading} className={cls('wiz-auth-input', classNames?.input)} {...fieldErrorA11y('wiz-signup-name', fieldErrors.name)} />
          {fieldErrors.name && <p id="wiz-signup-name-error" className={cls('wiz-auth-field-error', classNames?.fieldError)}>{fieldErrors.name}</p>}
        </div>

        <div className={cls('wiz-auth-field', classNames?.field)}>
          <label htmlFor="wiz-signup-email" className={cls('wiz-auth-label', classNames?.label)}>{t.emailLabel}</label>
          <input id="wiz-signup-email" type="email" autoComplete="email" placeholder={t.emailPlaceholder} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={loading} className={cls('wiz-auth-input', classNames?.input)} {...fieldErrorA11y('wiz-signup-email', fieldErrors.email)} />
          {fieldErrors.email && <p id="wiz-signup-email-error" className={cls('wiz-auth-field-error', classNames?.fieldError)}>{fieldErrors.email}</p>}
        </div>

        <div className={cls('wiz-auth-field', classNames?.field)}>
          <label htmlFor="wiz-signup-password" className={cls('wiz-auth-label', classNames?.label)}>{t.passwordLabel}</label>
          <input id="wiz-signup-password" type="password" autoComplete="new-password" placeholder={t.passwordPlaceholder} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} disabled={loading} className={cls('wiz-auth-input', classNames?.input)} {...fieldErrorA11y('wiz-signup-password', fieldErrors.password)} />
          {fieldErrors.password && <p id="wiz-signup-password-error" className={cls('wiz-auth-field-error', classNames?.fieldError)}>{fieldErrors.password}</p>}
        </div>

        {extraFields.map((field) => (
          <div key={field.name} className={cls('wiz-auth-field', classNames?.field)}>
            <label htmlFor={`wiz-signup-${field.name}`} className={cls('wiz-auth-label', classNames?.label)}>{field.label}</label>
            <input id={`wiz-signup-${field.name}`} type={field.type ?? 'text'} placeholder={field.placeholder} value={form[field.name] ?? ''} onChange={(e) => setForm({ ...form, [field.name]: e.target.value })} required={field.required} disabled={loading} className={cls('wiz-auth-input', classNames?.input)} {...fieldErrorA11y(`wiz-signup-${field.name}`, fieldErrors[field.name])} />
            {fieldErrors[field.name] && <p id={`wiz-signup-${field.name}-error`} className={cls('wiz-auth-field-error', classNames?.fieldError)}>{fieldErrors[field.name]}</p>}
          </div>
        ))}

        {error && <div role="alert" className={cls('wiz-auth-error', classNames?.error)}>{error}</div>}

        <button type="submit" disabled={loading} className={cls('wiz-auth-submit', classNames?.submitButton)}>
          {loading ? t.submitting : t.submitButton}
        </button>
      </form>

      {showLoginLink && (
        <p className={cls('wiz-auth-footer', classNames?.footer)}>
          {t.alreadyHaveAccount} <a href={loginUrl} className={cls('wiz-auth-link', classNames?.link)}>{t.signIn}</a>
        </p>
      )}

      {slots?.afterForm}
      {slots?.footer}
    </div>
  );
}
