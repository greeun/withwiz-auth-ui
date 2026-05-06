import type {
  ResetPasswordFormProps,
  EmailVerificationFormProps,
  LoginPageProps,
  SignupPageProps,
  ForgotPasswordPageProps,
  ResetPasswordPageProps,
  EmailVerificationPageProps,
  AuthMessages,
} from '../../../src/types';

describe('Type definitions exist', () => {
  it('ResetPasswordFormProps includes token', () => {
    const props: ResetPasswordFormProps = {
      token: 'abc',
    };
    expect(props.token).toBe('abc');
  });

  it('EmailVerificationFormProps exists with required token', () => {
    const props: EmailVerificationFormProps = {
      token: 'xyz',
    };
    expect(props.token).toBe('xyz');
  });

  it('LoginPageProps exists', () => {
    const props: LoginPageProps = {};
    expect(props).toBeDefined();
  });

  it('SignupPageProps exists', () => {
    const props: SignupPageProps = {};
    expect(props).toBeDefined();
  });

  it('ForgotPasswordPageProps exists', () => {
    const props: ForgotPasswordPageProps = {};
    expect(props).toBeDefined();
  });

  it('ResetPasswordPageProps exists with required token', () => {
    const props: ResetPasswordPageProps = { token: 'abc' };
    expect(props.token).toBe('abc');
  });

  it('EmailVerificationPageProps exists with required token', () => {
    const props: EmailVerificationPageProps = { token: 'abc' };
    expect(props.token).toBe('abc');
  });

  it('AuthMessages includes emailVerification key in its type', () => {
    // Verify at the type level that emailVerification is a required key of AuthMessages
    type HasEmailVerification = AuthMessages['emailVerification'];
    // At runtime, verify the key name is assignable
    const key: keyof AuthMessages = 'emailVerification';
    expect(key).toBe('emailVerification');
  });
});
