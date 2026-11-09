import type { AuthErrorInfo } from '../types';

/**
 * Error thrown by `useAuth().login` when the server rejects the request.
 * `message` is the user-facing text (as before 0.7); `info` carries the structured failure.
 */
export class AuthError extends Error {
  readonly info: AuthErrorInfo;
  /**
   * Token for the MFA second step; only present in bearer mode (since 0.10).
   * Non-enumerable so error reporters that serialize the error do not pick it up.
   */
  declare readonly mfaToken?: string;

  constructor(info: AuthErrorInfo, extra?: { mfaToken?: string }) {
    super(info.text);
    this.name = 'AuthError';
    this.info = info;
    if (extra?.mfaToken !== undefined) {
      Object.defineProperty(this, 'mfaToken', { value: extra.mfaToken, enumerable: false });
    }
  }
}
