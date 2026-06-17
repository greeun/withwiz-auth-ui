'use client';

import { AuthLayout } from '../components/AuthLayout';
import { EmailVerificationForm } from '../components/EmailVerificationForm';
import type { EmailVerificationPageProps } from '../types';

/**
 * Full email-verification screen: triangle side panel + optional logo (from
 * AuthLayout) wrapped around the self-contained <EmailVerificationForm />.
 */
export type EmailVerificationScreenProps = EmailVerificationPageProps;

export function EmailVerificationScreen({ logo, pattern, backgroundColor, leftPanel, className, fullHeight, ...formProps }: EmailVerificationScreenProps) {
  return (
    <AuthLayout logo={logo} pattern={pattern} backgroundColor={backgroundColor} leftPanel={leftPanel} fullHeight={fullHeight} className={className}>
      <EmailVerificationForm {...formProps} />
    </AuthLayout>
  );
}
