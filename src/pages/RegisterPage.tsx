'use client';

import { AuthLayout } from '../components/AuthLayout';
import { RegisterForm } from '../components/RegisterForm';
import type { RegisterPageProps } from '../types';

export function RegisterPage({ logo, pattern, backgroundColor, leftPanel, className, ...formProps }: RegisterPageProps) {
  return (
    <AuthLayout logo={logo} pattern={pattern} backgroundColor={backgroundColor} leftPanel={leftPanel} className={className}>
      <RegisterForm {...formProps} />
    </AuthLayout>
  );
}
