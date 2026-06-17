'use client';

import { AuthLayout } from '../components/AuthLayout';
import { SignupForm } from '../components/SignupForm';
import type { SignupPageProps } from '../types';

export function SignupPage({ logo, pattern, backgroundColor, leftPanel, className, fullHeight, ...formProps }: SignupPageProps) {
  return (
    <AuthLayout logo={logo} pattern={pattern} backgroundColor={backgroundColor} leftPanel={leftPanel} fullHeight={fullHeight} className={className}>
      <SignupForm {...formProps} />
    </AuthLayout>
  );
}
