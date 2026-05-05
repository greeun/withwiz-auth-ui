'use client';

import { AuthLayout } from '../components/AuthLayout';
import { EmailVerificationForm } from '../components/EmailVerificationForm';
import type { EmailVerificationPageProps } from '../types';

export function EmailVerificationPage({ logo, pattern, backgroundColor, leftPanel, className, ...formProps }: EmailVerificationPageProps) {
  return (
    <AuthLayout logo={logo} pattern={pattern} backgroundColor={backgroundColor} leftPanel={leftPanel} className={className}>
      <EmailVerificationForm {...formProps} />
    </AuthLayout>
  );
}
