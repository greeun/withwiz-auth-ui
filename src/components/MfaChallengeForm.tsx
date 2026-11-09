'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { getMessages } from '../i18n';
import { cx } from '../utils/class-names';
import { safeRedirectTarget, pickRedirectTarget } from '../utils/safe-redirect';
import { hookFailure } from '../utils/read-auth-error';
import { verifyMfa } from '../utils/mfa-api';
import { toMfaProof, describeMfaError } from '../utils/mfa-input';
import { MfaCodeField } from './MfaCodeField';
import type { AuthErrorInfo, MfaChallengeFormProps, MfaInputMode } from '../types';

const FIELD_ID = 'wiz-mfa-code';

/** 로그인 2단계: 인증 앱 코드 또는 복구 코드를 확인한다. */
export function MfaChallengeForm({
  mfaToken,
  apiBasePath = '/api/auth',
  redirectAfterLogin = '/',
  loginUrl = '/login',
  onRestart,
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
}: MfaChallengeFormProps) {
  const t = { ...getMessages(locale).mfa, ...messageOverrides };
  const [mode, setMode] = useState<MfaInputMode>('code');
  const [value, setValue] = useState('');
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // 값이 바뀔 때마다 입력란으로 포커스를 옮긴다(입력란이 비활성으로 바뀌며 포커스를 잃기 때문).
  const [focusTick, setFocusTick] = useState(0);
  useEffect(() => {
    if (focusTick > 0) inputRef.current?.focus();
  }, [focusTick]);
  const [blocked, setBlocked] = useState<'expired' | 'locked' | null>(null);

  const cls = (base: string, slot?: string) => cx(unstyled ? undefined : base, slot);

  const fail = (info: AuthErrorInfo) => {
    const text = describeMfaError(info, t);
    if (info.key === 'MFA_INVALID_CODE') {
      setFieldError(text);
      setValue('');
      setFocusTick((n) => n + 1);
    } else {
      setError(text);
      if (info.key === 'MFA_PENDING_EXPIRED') setBlocked('expired');
      else if (info.key === 'MFA_LOCKED') setBlocked('locked');
    }
    hooks?.onError?.(text, info);
  };

  const changeMode = (next: MfaInputMode) => {
    setMode(next);
    setValue('');
    setFieldError(undefined);
    setFocusTick((n) => n + 1);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (blocked || loading) return;
    setError(null);
    setFieldError(undefined);

    const parsed = toMfaProof(mode, value, t);
    if ('error' in parsed) {
      setFieldError(parsed.error);
      return;
    }

    if (hooks?.onBeforeSubmit) {
      const proceed = await hooks.onBeforeSubmit({ method: mode });
      if (!proceed) return;
    }

    setLoading(true);
    try {
      const result = await verifyMfa(apiBasePath, parsed.proof, { fallback: t.failed, network: t.networkError }, { mfaToken });
      if (!result.ok) {
        fail(result.error);
        return;
      }

      // 서버가 준 redirectTo 도 같은 출처 검사를 거친다. 통과 못 하면 redirectAfterLogin.
      const serverTarget = result.data.redirectTo
        ? safeRedirectTarget(result.data.redirectTo, redirectAfterLogin)
        : redirectAfterLogin;
      let target: unknown;
      try {
        target = await hooks?.onSuccess?.(result.data.user, { body: result.body });
      } catch (err) {
        fail(hookFailure(err, t.failed, result.status));
        return;
      }
      setValue('');
      window.location.href = safeRedirectTarget(pickRedirectTarget(target, serverTarget), redirectAfterLogin);
    } finally {
      setLoading(false);
    }
  };

  const restartClass = cls(blocked === 'expired' ? 'wiz-auth-submit' : 'wiz-auth-link', blocked === 'expired' ? classNames?.submitButton : classNames?.link);

  return (
    <div className={cls('wiz-auth-form', cx(className, classNames?.root))} data-wiz-scheme={forceColorScheme}>
      {slots?.header !== undefined ? slots.header : (
        <div className={cls('wiz-auth-header', classNames?.header)}>
          <h1 className={cls('wiz-auth-title', classNames?.title)}>{title ?? t.title}</h1>
          {(subtitle ?? t.subtitle) && (
            <p className={cls('wiz-auth-subtitle', classNames?.subtitle)}>{subtitle ?? t.subtitle}</p>
          )}
        </div>
      )}

      {slots?.beforeForm}

      <form onSubmit={handleSubmit} className={cls('wiz-auth-fields', classNames?.form)}>
        <MfaCodeField
          id={FIELD_ID}
          mode={mode}
          value={value}
          onChange={setValue}
          onModeChange={changeMode}
          error={fieldError}
          disabled={loading || blocked !== null}
          autoFocus
          inputRef={inputRef}
          t={t}
          cls={cls}
          classNames={classNames}
        />

        {error && <div role="alert" className={cls('wiz-auth-error', classNames?.error)}>{error}</div>}

        <button type="submit" disabled={loading || blocked !== null} className={cls('wiz-auth-submit', classNames?.submitButton)}>
          {loading ? t.submitting : t.submitButton}
        </button>
      </form>

      <div className={cls('wiz-auth-mfa-actions')}>
        {onRestart ? (
          <button type="button" onClick={onRestart} className={restartClass}>{t.restart}</button>
        ) : (
          <a href={safeRedirectTarget(loginUrl, '/login')} className={restartClass}>{t.restart}</a>
        )}
      </div>

      {slots?.afterForm}
      {slots?.footer}
    </div>
  );
}
