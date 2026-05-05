import type {
  ResetPasswordFormProps,
  EmailVerificationFormProps,
  LoginPageProps,
  RegisterPageProps,
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

  it('RegisterPageProps exists', () => {
    const props: RegisterPageProps = {};
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

  it('AuthMessages includes emailVerification', () => {
    const msgs = {} as AuthMessages;
    expect(msgs.emailVerification).toBeDefined;
  });
});
