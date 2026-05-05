import { getMessages, mergeMessages } from '../../../src/i18n';

describe('i18n', () => {
  describe('getMessages', () => {
    it("returns Korean messages with login.title = '로그인'", () => {
      const messages = getMessages('ko');
      expect(messages.login.title).toBe('로그인');
    });

    it("returns English messages with login.title = 'Sign In'", () => {
      const messages = getMessages('en');
      expect(messages.login.title).toBe('Sign In');
    });

    it('returns Japanese messages', () => {
      const messages = getMessages('ja');
      expect(messages.login.title).toBe('ログイン');
      expect(messages.register.title).toBe('新規登録');
    });

    it('falls back to English for unknown locale', () => {
      const messages = getMessages('fr');
      expect(messages.login.title).toBe('Sign In');
      expect(messages.register.title).toBe('Sign Up');
    });
  });

  describe('mergeMessages', () => {
    it('returns base messages when no overrides provided', () => {
      const messages = mergeMessages('ko');
      expect(messages.login.title).toBe('로그인');
      expect(messages.register.title).toBe('회원가입');
    });

    it('merges login overrides with base', () => {
      const messages = mergeMessages('ko', {
        login: { title: '커스텀 로그인' } as any,
      });
      expect(messages.login.title).toBe('커스텀 로그인');
      expect(messages.login.emailLabel).toBe('이메일');
    });

    it('preserves unaffected sections when only one section overridden', () => {
      const messages = mergeMessages('en', {
        login: { title: 'Custom Login' } as any,
      });
      expect(messages.login.title).toBe('Custom Login');
      expect(messages.register.title).toBe('Sign Up');
      expect(messages.forgotPassword.title).toBe('Forgot Password');
      expect(messages.resetPassword.title).toBe('Reset Password');
    });
  });
});
