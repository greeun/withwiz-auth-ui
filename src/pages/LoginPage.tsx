'use client';

import { AuthLayout } from '../components/AuthLayout';
import { LoginForm } from '../components/LoginForm';
import type { LoginPageProps } from '../types';

export function LoginPage({ logo, pattern, backgroundColor, leftPanel, className, ...formProps }: LoginPageProps) {
  return (
    <AuthLayout logo={logo} pattern={pattern} backgroundColor={backgroundColor} leftPanel={leftPanel} className={className}>
      <LoginForm {...formProps} />
    </AuthLayout>
  );
}
