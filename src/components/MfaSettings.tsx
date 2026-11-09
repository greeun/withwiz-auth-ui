'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { getMessages } from '../i18n';
import { cx } from '../utils/class-names';
import {
  disableMfa, enableMfa, getMfaStatus, regenerateRecoveryCodes, setupMfa, type MfaResult,
} from '../utils/mfa-api';
import { toMfaProof, describeMfaError } from '../utils/mfa-input';
import { MfaCodeField } from './MfaCodeField';
import { MfaQrCode } from './MfaQrCode';
import type { AuthErrorInfo, MfaInputMode, MfaSettingsProps, MfaStatus } from '../types';

const FIELD_ID = 'wiz-mfa-settings-code';
/** 남은 복구 코드가 이 수 이하면 경고한다. */
const LOW_RECOVERY_CODES = 3;

type View =
  | { step: 'loading' }
  | { step: 'notConfigured' }
  | { step: 'unauthenticated' }
  | { step: 'loadError'; message: string }
  | { step: 'disabled' }
  | { step: 'setup'; secret: string; otpauthUri: string }
  | { step: 'recoveryCodes'; codes: string[] }
  | { step: 'enabled'; remaining: number }
  | { step: 'regenerate'; remaining: number }
  | { step: 'disable'; remaining: number };

type CodeStep = 'setup' | 'regenerate' | 'disable';

/** 계정 설정의 2단계 인증 관리: 상태 → 등록(QR) → 복구 코드 → 켜짐 → 재발급/끄기. 쿠키 인증만 지원한다. */
export function MfaSettings({
  apiBasePath = '/api/auth',
  issuerLabel,
  renderQr,
  recoveryCodesFileName = 'recovery-codes.txt',
  locale = 'ko',
  messages: messageOverrides,
  className,
  classNames,
  unstyled = false,
  forceColorScheme,
  slots,
  hooks,
}: MfaSettingsProps) {
  const t = { ...getMessages(locale).mfa, ...messageOverrides };
  const texts = { fallback: t.failed, network: t.networkError };
  const [view, setView] = useState<View>({ step: 'loading' });
  const [mode, setMode] = useState<MfaInputMode>('code');
  const [value, setValue] = useState('');
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState<'secret' | 'codes' | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  // 단계가 바뀌거나 코드가 틀렸을 때 첫 입력란(없으면 단계 제목)으로 포커스를 옮긴다. 첫 조회 때는 옮기지 않는다.
  const [focusTick, setFocusTick] = useState(0);
  useEffect(() => {
    if (focusTick > 0) (inputRef.current ?? headingRef.current)?.focus();
  }, [focusTick]);

  const cls = (base: string, slot?: string) => cx(unstyled ? undefined : base, slot);

  /** 단계를 바꾸고 단계별 입력·오류·잠금 상태를 비운다(복구 코드도 이전 view 와 함께 버려진다). */
  const go = (next: View, focus = true) => {
    setView(next);
    setMode('code');
    setValue('');
    setFieldError(undefined);
    setError(null);
    setLocked(false);
    setSaved(false);
    setCopied(null);
    if (focus) setFocusTick((n) => n + 1);
  };

  /** 미설정(404)·세션 없음(401)은 화면 자체를 바꾼다. 처리했으면 true. */
  const routeTerminal = (info: AuthErrorInfo): boolean => {
    if (info.key === 'MFA_NOT_CONFIGURED') {
      go({ step: 'notConfigured' }, false);
      return true;
    }
    // MFA_INVALID_CODE 도 401 이므로 MFA_ 키는 세션 만료로 보지 않는다.
    if (info.status === 401 && !info.key?.startsWith('MFA_')) {
      go({ step: 'unauthenticated' });
      hooks?.onUnauthenticated?.();
      return true;
    }
    return false;
  };

  /** 현재 단계 안에서 보이는 실패. 규칙은 MfaChallengeForm 과 같다. */
  const fail = (info: AuthErrorInfo) => {
    if (routeTerminal(info)) return;
    const text = describeMfaError(info, t);
    // 다른 탭·기기에서 이미 켜거나 끈 경우: 화면이 서버와 어긋났으므로 상태를 다시 조회한다.
    if (info.key === 'MFA_ALREADY_ENABLED' || info.key === 'MFA_NOT_ENABLED') {
      hooks?.onError?.(text, info);
      void reload();
      return;
    }
    if (info.key === 'MFA_INVALID_CODE') {
      setFieldError(text);
      setValue('');
      setFocusTick((n) => n + 1);
    } else {
      setError(text);
      if (info.key === 'MFA_LOCKED') setLocked(true);
    }
    hooks?.onError?.(text, info);
  };

  const applyStatus = (result: MfaResult<MfaStatus>, focus: boolean) => {
    if (result.ok) {
      const { enabled, recoveryCodesRemaining: remaining } = result.data;
      go(enabled ? { step: 'enabled', remaining } : { step: 'disabled' }, focus);
      return;
    }
    if (routeTerminal(result.error)) return;
    const text = describeMfaError(result.error, t);
    go({ step: 'loadError', message: text }, focus);
    hooks?.onError?.(text, result.error);
  };

  const applyStatusRef = useRef(applyStatus);
  useEffect(() => { applyStatusRef.current = applyStatus; });

  useEffect(() => {
    let cancelled = false;
    void getMfaStatus(apiBasePath, texts).then((result) => {
      if (!cancelled) applyStatusRef.current(result, false);
    });
    return () => { cancelled = true; };
    // texts 는 문구 객체라 매 렌더 새로 만들어진다. 다시 조회할 이유는 apiBasePath 뿐이다.
  }, [apiBasePath]);

  const reload = async () => {
    go({ step: 'loading' }, false);
    applyStatus(await getMfaStatus(apiBasePath, texts), true);
  };

  const withBusy = async (task: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      await task();
    } finally {
      setBusy(false);
    }
  };

  const startSetup = () => withBusy(async () => {
    setError(null);
    const result = await setupMfa(apiBasePath, texts);
    if (!result.ok) return fail(result.error);
    go({ step: 'setup', ...result.data });
  });

  const submitCode = (e: FormEvent) => {
    e.preventDefault();
    if (locked || busy) return;
    setError(null);
    setFieldError(undefined);
    // 등록·재발급은 인증 앱 코드만 받는다(복구 코드 전환 없음).
    const parsed = toMfaProof(view.step === 'disable' ? mode : 'code', value, t);
    if ('error' in parsed) {
      setFieldError(parsed.error);
      return;
    }
    const { proof } = parsed;
    const code = 'code' in proof ? proof.code : '';

    void withBusy(async () => {
      if (view.step === 'setup' || view.step === 'regenerate') {
        const result = view.step === 'setup'
          ? await enableMfa(apiBasePath, code, texts)
          : await regenerateRecoveryCodes(apiBasePath, code, texts);
        if (!result.ok) return fail(result.error);
        go({ step: 'recoveryCodes', codes: result.data.recoveryCodes });
        if (view.step === 'setup') hooks?.onEnabled?.();
        else hooks?.onRecoveryCodesRegenerated?.();
      } else if (view.step === 'disable') {
        const result = await disableMfa(apiBasePath, proof, texts);
        if (!result.ok) return fail(result.error);
        go({ step: 'disabled' });
        hooks?.onDisabled?.();
      }
    });
  };

  const changeMode = (next: MfaInputMode) => {
    setMode(next);
    setValue('');
    setFieldError(undefined);
    setFocusTick((n) => n + 1);
  };

  // 렌더 시점에 판정한다. 첫 렌더는 항상 loading 이라 SSR 과 어긋나지 않는다.
  const canCopy = typeof navigator !== 'undefined' && typeof navigator.clipboard?.writeText === 'function';
  const copy = (text: string, which: 'secret' | 'codes') => {
    navigator.clipboard.writeText(text).then(() => setCopied(which), () => {});
  };

  const download = (codes: string[]) => {
    const url = URL.createObjectURL(new Blob([codes.join('\n') + '\n'], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = recoveryCodesFileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // 클릭 직후 회수하면 일부 브라우저는 다운로드를 시작하기 전에 URL 을 잃는다. 한 틱 뒤에 회수한다.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  if (view.step === 'notConfigured') return slots?.notConfigured !== undefined ? <>{slots.notConfigured}</> : null;

  const heading = (text: string) => (
    <h2 ref={headingRef} tabIndex={-1} className={cls('wiz-auth-mfa-step-title')}>{text}</h2>
  );
  const paragraph = (text: string) => <p className={cls('wiz-auth-mfa-text', classNames?.subtitle)}>{text}</p>;
  const errorBanner = error && <div role="alert" className={cls('wiz-auth-error', classNames?.error)}>{error}</div>;
  const primaryClass = cls('wiz-auth-submit', classNames?.submitButton);
  const secondaryClass = cls('wiz-auth-secondary', classNames?.secondaryButton);
  const copyButton = (text: string, which: 'secret' | 'codes') => canCopy && (
    <button type="button" onClick={() => copy(text, which)} className={secondaryClass}>
      {copied === which ? t.copied : t.copy}
    </button>
  );

  const codeForm = (step: CodeStep, submitLabel: string, onCancel: () => void) => (
    <form onSubmit={submitCode} className={cls('wiz-auth-fields', classNames?.form)}>
      <MfaCodeField
        id={FIELD_ID}
        mode={step === 'disable' ? mode : 'code'}
        value={value}
        onChange={setValue}
        onModeChange={step === 'disable' ? changeMode : undefined}
        error={fieldError}
        disabled={busy || locked}
        inputRef={inputRef}
        t={t}
        cls={cls}
        classNames={classNames}
      />
      {errorBanner}
      <button type="submit" disabled={busy || locked} className={primaryClass}>
        {busy ? t.submitting : submitLabel}
      </button>
      <button type="button" onClick={onCancel} disabled={busy} className={secondaryClass}>{t.cancel}</button>
    </form>
  );

  const body = (() => {
    switch (view.step) {
      case 'loading':
        return <p role="status" className={cls('wiz-auth-mfa-text')}>{t.loading}</p>;
      case 'unauthenticated':
        return <p role="alert" className={cls('wiz-auth-error', classNames?.error)}>{t.unauthenticated}</p>;
      case 'loadError':
        return (
          <>
            <div role="alert" className={cls('wiz-auth-error', classNames?.error)}>{view.message}</div>
            <button type="button" onClick={() => void reload()} className={primaryClass}>{t.retry}</button>
          </>
        );
      case 'disabled':
        return (
          <>
            {heading(t.statusDisabled)}
            {errorBanner}
            <button type="button" onClick={() => void startSetup()} disabled={busy} className={primaryClass}>
              {t.enableButton}
            </button>
          </>
        );
      case 'enabled':
        return (
          <>
            {heading(t.statusEnabled)}
            {paragraph(t.recoveryCodesRemaining.replace('{count}', String(view.remaining)))}
            {view.remaining <= LOW_RECOVERY_CODES && (
              <p className={cls('wiz-auth-mfa-warning')}>{t.recoveryCodesLow}</p>
            )}
            <div className={cls('wiz-auth-mfa-buttons')}>
              <button type="button" onClick={() => go({ step: 'regenerate', remaining: view.remaining })} className={secondaryClass}>
                {t.regenerateButton}
              </button>
              <button type="button" onClick={() => go({ step: 'disable', remaining: view.remaining })} className={secondaryClass}>
                {t.disableButton}
              </button>
            </div>
          </>
        );
      case 'setup':
        return (
          <>
            {heading(t.enableButton)}
            {paragraph(t.setupInstructions)}
            <div className={cls('wiz-auth-mfa-qr-area')}>
              {renderQr ? renderQr(view.otpauthUri) : <MfaQrCode value={view.otpauthUri} label={t.qrLabel} />}
              {issuerLabel && <p className={cls('wiz-auth-mfa-text')}>{issuerLabel}</p>}
            </div>
            {paragraph(t.secretLabel)}
            <div className={cls('wiz-auth-mfa-buttons')}>
              <code className={cls('wiz-auth-mfa-secret')}>{view.secret}</code>
              {copyButton(view.secret, 'secret')}
            </div>
            {codeForm('setup', t.enableSubmit, () => go({ step: 'disabled' }))}
          </>
        );
      case 'regenerate':
        return (
          <>
            {heading(t.regenerateButton)}
            {paragraph(t.regenerateInstructions)}
            {codeForm('regenerate', t.regenerateSubmit, () => go({ step: 'enabled', remaining: view.remaining }))}
          </>
        );
      case 'disable':
        return (
          <>
            {heading(t.disableButton)}
            {paragraph(t.disableInstructions)}
            {codeForm('disable', t.disableSubmit, () => go({ step: 'enabled', remaining: view.remaining }))}
          </>
        );
      case 'recoveryCodes':
        return (
          <>
            {heading(t.recoveryCodesTitle)}
            {paragraph(t.recoveryCodesInstructions)}
            <ol className={cls('wiz-auth-mfa-codes')}>
              {view.codes.map((c) => <li key={c}><code>{c}</code></li>)}
            </ol>
            <div className={cls('wiz-auth-mfa-buttons')}>
              {copyButton(view.codes.join('\n'), 'codes')}
              <button type="button" onClick={() => download(view.codes)} className={secondaryClass}>{t.download}</button>
            </div>
            <label className={cls('wiz-auth-mfa-confirm', classNames?.label)}>
              <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} />
              {t.savedConfirm}
            </label>
            {/* [완료] 는 복구 코드를 상태에서 지운 뒤 상태를 다시 조회한다. */}
            <button type="button" onClick={() => void reload()} disabled={!saved} className={primaryClass}>{t.done}</button>
          </>
        );
    }
  })();

  return (
    <div className={cls('wiz-auth-form', cx(className, classNames?.root))} data-wiz-scheme={forceColorScheme}>
      {slots?.header !== undefined ? slots.header : (
        <div className={cls('wiz-auth-header', classNames?.header)}>
          <h1 className={cls('wiz-auth-title', classNames?.title)}>{t.settingsTitle}</h1>
        </div>
      )}
      <div className={cls('wiz-auth-mfa-step')}>{body}</div>
      {slots?.footer}
    </div>
  );
}
