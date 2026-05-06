import { getMessages, mergeMessages, ko, en, ja } from '../../../src/i18n';

const EMAIL_VERIFICATION_KEYS = [
  'title',
  'verifying',
  'successTitle',
  'successMessage',
  'errorTitle',
  'errorExpired',
  'errorInvalid',
  'networkError',
  'loginButton',
  'resendLink',
] as const;

describe('emailVerification i18n', () => {
  describe('all 10 keys exist in each locale', () => {
    it('Korean (ko) has all emailVerification keys', () => {
      EMAIL_VERIFICATION_KEYS.forEach((key) => {
        expect(ko.emailVerification[key]).toBeDefined();
        expect(typeof ko.emailVerification[key]).toBe('string');
        expect(ko.emailVerification[key].length).toBeGreaterThan(0);
      });
    });

    it('English (en) has all emailVerification keys', () => {
      EMAIL_VERIFICATION_KEYS.forEach((key) => {
        expect(en.emailVerification[key]).toBeDefined();
        expect(typeof en.emailVerification[key]).toBe('string');
        expect(en.emailVerification[key].length).toBeGreaterThan(0);
      });
    });

    it('Japanese (ja) has all emailVerification keys', () => {
      EMAIL_VERIFICATION_KEYS.forEach((key) => {
        expect(ja.emailVerification[key]).toBeDefined();
        expect(typeof ja.emailVerification[key]).toBe('string');
        expect(ja.emailVerification[key].length).toBeGreaterThan(0);
      });
    });
  });

  describe('mergeMessages correctly merges emailVerification overrides', () => {
    it('merges partial emailVerification overrides', () => {
      const messages = mergeMessages('ko', {
        emailVerification: { title: '커스텀 인증', verifying: '커스텀 진행중' } as any,
      });
      expect(messages.emailVerification.title).toBe('커스텀 인증');
      expect(messages.emailVerification.verifying).toBe('커스텀 진행중');
      // Remaining keys should be from base
      expect(messages.emailVerification.successTitle).toBe('인증 완료');
      expect(messages.emailVerification.loginButton).toBe('로그인');
    });

    it('does not affect other sections when emailVerification is overridden', () => {
      const messages = mergeMessages('en', {
        emailVerification: { title: 'Custom Title' } as any,
      });
      expect(messages.emailVerification.title).toBe('Custom Title');
      expect(messages.login.title).toBe('Sign In');
      expect(messages.register.title).toBe('Sign Up');
      expect(messages.resetPassword.title).toBe('Reset Password');
    });
  });

  describe('getMessages falls back to en for unknown locale', () => {
    it('returns English emailVerification for unknown locale "fr"', () => {
      const messages = getMessages('fr');
      expect(messages.emailVerification.title).toBe('Email Verification');
      expect(messages.emailVerification.successTitle).toBe('Verified');
      expect(messages.emailVerification.loginButton).toBe('Go to Login');
    });

    it('returns English emailVerification for unknown locale "zh"', () => {
      const messages = getMessages('zh');
      expect(messages.emailVerification.errorTitle).toBe('Verification Failed');
      expect(messages.emailVerification.resendLink).toBe('Resend verification email');
    });
  });
});
