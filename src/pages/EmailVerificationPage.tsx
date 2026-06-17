'use client';

import { AuthLayout } from '../components/AuthLayout';
import { EmailVerificationForm } from '../components/EmailVerificationForm';
import type { EmailVerificationPageProps } from '../types';

export function EmailVerificationPage({ logo, pattern, backgroundColor, leftPanel, className, fullHeight, ...formProps }: EmailVerificationPageProps) {
  return (
    <AuthLayout logo={logo} pattern={pattern} backgroundColor={backgroundColor} leftPanel={leftPanel} fullHeight={fullHeight} className={className}>
      <EmailVerificationForm {...formProps} />
    </AuthLayout>
  );
}
