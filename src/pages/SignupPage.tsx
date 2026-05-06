'use client';

import { AuthLayout } from '../components/AuthLayout';
import { SignupForm } from '../components/SignupForm';
import type { SignupPageProps } from '../types';

export function SignupPage({ logo, pattern, backgroundColor, leftPanel, className, ...formProps }: SignupPageProps) {
  return (
    <AuthLayout logo={logo} pattern={pattern} backgroundColor={backgroundColor} leftPanel={leftPanel} className={className}>
      <SignupForm {...formProps} />
    </AuthLayout>
  );
}
