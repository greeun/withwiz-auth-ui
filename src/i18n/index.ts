import type { AuthMessages } from '../types';
import { ko } from './ko';
import { en } from './en';
import { ja } from './ja';

const messages: Record<string, AuthMessages> = { ko, en, ja };

export function getMessages(locale: string): AuthMessages {
  return messages[locale] ?? messages.en;
}

export function mergeMessages(locale: string, overrides?: Partial<AuthMessages>): AuthMessages {
  const base = getMessages(locale);
  if (!overrides) return base;
  return {
    login: { ...base.login, ...overrides.login },
    register: { ...base.register, ...overrides.register },
    forgotPassword: { ...base.forgotPassword, ...overrides.forgotPassword },
    resetPassword: { ...base.resetPassword, ...overrides.resetPassword },
  };
}

export { ko, en, ja };
