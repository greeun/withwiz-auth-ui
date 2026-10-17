import type { AuthErrorInfo } from '../types';

/**
 * Error thrown by `useAuth().login` when the server rejects the request.
 * `message` is the user-facing text (as before 0.7); `info` carries the structured failure.
 */
export class AuthError extends Error {
  readonly info: AuthErrorInfo;

  constructor(info: AuthErrorInfo) {
    super(info.text);
    this.name = 'AuthError';
    this.info = info;
  }
}
