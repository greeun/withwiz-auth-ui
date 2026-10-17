'use client';

import { useEffect, useRef, useState } from 'react';
import { getMessages } from '../i18n';
import { authPost } from '../utils/api-client';
import { emailFromLink } from '../utils/link-email';
import { cx } from '../utils/class-names';
import { readAuthError, networkAuthError, readJsonSafely } from '../utils/read-auth-error';
import type { AuthErrorInfo, EmailVerificationFormProps } from '../types';

export function EmailVerificationForm({
  token,
  email,
  locale = 'ko',
  messages: messageOverrides,
  apiBasePath = '/api/auth',
  className,
  loginUrl = '/login',
  resendUrl = '/resend-verification',
  classNames,
  forceColorScheme,
  unstyled = false,
  hooks,
}: EmailVerificationFormProps) {
  const t = { ...getMessages(locale).emailVerification, ...messageOverrides };
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  // Verification runs once per token; reading hooks through a ref keeps a new hooks
  // object on every render from re-sending the request.
  const hooksRef = useRef(hooks);
  // Declared before the verification effect, so it runs first on every commit.
  useEffect(() => { hooksRef.current = hooks; });

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      // Only the request runs inside the try; hooks are called afterwards so an exception
      // thrown by the consumer's hook is never reported as a network error.
      let failure: AuthErrorInfo | null = null;
      try {
        // The endpoint matches token **and** email; sending the token alone is rejected
        // as malformed before the token is ever checked.
        const account = email ?? emailFromLink();
        const res = await authPost(`${apiBasePath}/verify-email`, account ? { email: account, token } : { token });
        const data = await readJsonSafely(res);

        if (!res.ok) failure = readAuthError(res.status, data, t.errorInvalid);
      } catch {
        failure = networkAuthError(t.networkError);
      }
      if (cancelled) return;
      if (failure) {
        setStatus('error');
        setErrorMessage(failure.text);
        hooksRef.current?.onError?.(failure.text, failure);
      } else {
        setStatus('success');
        hooksRef.current?.onSuccess?.();
      }
    }

    verify();
    return () => { cancelled = true; };
  }, [token, email, apiBasePath]);

  const cls = (base: string, slot?: string) => cx(unstyled ? undefined : base, slot);

  if (status === 'loading') {
    return (
      <div className={cls('wiz-auth-status', cx(className, classNames?.root))} data-wiz-scheme={forceColorScheme}>
        <svg width="40" height="40" viewBox="0 0 40 40" className={cls('wiz-auth-status-icon wiz-auth-spinner', classNames?.icon)}>
          <circle cx="20" cy="20" r="16" fill="none" stroke="var(--wiz-auth-border)" strokeWidth="4" />
          <circle cx="20" cy="20" r="16" fill="none" stroke="var(--wiz-auth-primary)" strokeWidth="4" strokeDasharray="80" strokeDashoffset="60" strokeLinecap="round" />
        </svg>
        <p className={cls('wiz-auth-status-message', classNames?.message)}>{t.verifying}</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className={cls('wiz-auth-status', cx(className, classNames?.root))} data-wiz-scheme={forceColorScheme}>
        <svg width="48" height="48" viewBox="0 0 48 48" className={cls('wiz-auth-status-icon', classNames?.icon)}>
          <circle cx="24" cy="24" r="22" fill="var(--wiz-auth-success-background)" stroke="var(--wiz-auth-success)" strokeWidth="2" />
          <path d="M15 24l6 6 12-12" fill="none" stroke="var(--wiz-auth-success)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h2 className={cls('wiz-auth-status-title', classNames?.title)} data-state="success">{t.successTitle}</h2>
        <p className={cls('wiz-auth-status-message', classNames?.message)}>{t.successMessage}</p>
        <a href={loginUrl} className={cls('wiz-auth-status-primary', classNames?.primaryAction)}>{t.loginButton}</a>
      </div>
    );
  }

  return (
    <div className={cls('wiz-auth-status', cx(className, classNames?.root))} data-wiz-scheme={forceColorScheme}>
      <svg width="48" height="48" viewBox="0 0 48 48" className={cls('wiz-auth-status-icon', classNames?.icon)}>
        <circle cx="24" cy="24" r="22" fill="var(--wiz-auth-error-background)" stroke="var(--wiz-auth-error)" strokeWidth="2" />
        <path d="M17 17l14 14M31 17l-14 14" fill="none" stroke="var(--wiz-auth-error)" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <h2 className={cls('wiz-auth-status-title', classNames?.title)} data-state="error">{t.errorTitle}</h2>
      <p className={cls('wiz-auth-status-message', classNames?.message)}>{errorMessage}</p>
      <div className={cls('wiz-auth-status-actions', classNames?.actions)}>
        <a href={resendUrl} className={cls('wiz-auth-status-link', classNames?.secondaryLink)}>{t.resendLink}</a>
        <a href={loginUrl} className={cls('wiz-auth-status-primary', classNames?.primaryAction)}>{t.loginButton}</a>
      </div>
    </div>
  );
}
