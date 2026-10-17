import type { AuthErrorInfo } from '../types';

/**
 * Server field errors limited to the inputs the form actually renders.
 * Keys the form has no input for are dropped — they cannot be shown next to anything.
 */
export function pickFieldErrors(info: AuthErrorInfo, fields: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const name of fields) {
    if (info.fieldErrors[name]) out[name] = info.fieldErrors[name];
  }
  return out;
}

/**
 * Form-level text to show, or null when a field error already says the same thing —
 * the same sentence should not appear twice.
 */
export function formLevelText(info: AuthErrorInfo, shownFieldErrors: Record<string, string>): string | null {
  return Object.values(shownFieldErrors).includes(info.text) ? null : info.text;
}

/** aria wiring for an input that may carry a field error. */
export function fieldErrorA11y(inputId: string, error: string | undefined) {
  return error
    ? { 'aria-invalid': true as const, 'aria-describedby': `${inputId}-error` }
    : {};
}
