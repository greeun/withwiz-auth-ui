'use client';

import { useEffect, useRef } from 'react';
import { cx } from '../utils/class-names';
import { fieldErrorA11y } from '../utils/form-errors';
import type { AuthFormClassNames, AuthMessages, MfaInputMode } from '../types';

export interface MfaCodeFieldProps {
  id: string;
  mode: MfaInputMode;
  value: string;
  onChange: (value: string) => void;
  /** 없으면 인증 앱 코드 / 복구 코드 전환 버튼을 그리지 않는다. */
  onModeChange?: (mode: MfaInputMode) => void;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  t: AuthMessages['mfa'];
  cls: (base: string, slot?: string) => string | undefined;
  classNames?: AuthFormClassNames;
}

/** 인증 앱 6자리 코드 또는 복구 코드 입력란(내부용, 공개 export 아님). */
export function MfaCodeField({
  id, mode, value, onChange, onModeChange, error, disabled, autoFocus, t, cls, classNames,
}: MfaCodeFieldProps) {
  const isCode = mode === 'code';
  const inputRef = useRef<HTMLInputElement>(null);
  const refocus = useRef(false);

  // 전환 버튼을 누른 뒤에는 새 입력란으로 포커스를 옮긴다(버튼 포커스는 사라지지 않지만 입력이 다음 동작이다).
  useEffect(() => {
    if (refocus.current) {
      refocus.current = false;
      inputRef.current?.focus();
    }
  }, [mode]);

  return (
    <div className={cls('wiz-auth-field', classNames?.field)}>
      <label htmlFor={id} className={cls('wiz-auth-label', classNames?.label)}>
        {isCode ? t.codeLabel : t.recoveryCodeLabel}
      </label>
      <input
        ref={inputRef}
        id={id}
        key={mode}
        type="text"
        inputMode={isCode ? 'numeric' : undefined}
        autoComplete={isCode ? 'one-time-code' : 'off'}
        maxLength={isCode ? 7 : 32}
        autoFocus={autoFocus}
        placeholder={isCode ? t.codePlaceholder : t.recoveryCodePlaceholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cls('wiz-auth-input', classNames?.input)}
        {...fieldErrorA11y(id, error)}
      />
      {error && <p id={`${id}-error`} className={cls('wiz-auth-field-error', classNames?.fieldError)}>{error}</p>}
      {onModeChange && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            refocus.current = true;
            onModeChange(isCode ? 'recoveryCode' : 'code');
          }}
          className={cls('wiz-auth-mfa-toggle', cx(classNames?.link))}
        >
          {isCode ? t.useRecoveryCode : t.useAuthenticatorCode}
        </button>
      )}
    </div>
  );
}
