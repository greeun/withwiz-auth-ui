'use client';

import { AuthLayout } from '../components/AuthLayout';
import { ForgotPasswordForm } from '../components/ForgotPasswordForm';
import type { ForgotPasswordPageProps } from '../types';

/**
 * Full forgot-password screen: triangle side panel + optional logo (from
 * AuthLayout) wrapped around the self-contained <ForgotPasswordForm />.
 */
export type ForgotPasswordScreenProps = ForgotPasswordPageProps;

export function ForgotPasswordScreen({ logo, pattern, backgroundColor, leftPanel, className, fullHeight, ...formProps }: ForgotPasswordScreenProps) {
  return (
    <AuthLayout logo={logo} pattern={pattern} backgroundColor={backgroundColor} leftPanel={leftPanel} fullHeight={fullHeight} className={className}>
      <ForgotPasswordForm {...formProps} />
    </AuthLayout>
  );
}
