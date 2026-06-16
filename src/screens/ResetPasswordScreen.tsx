'use client';

import { AuthLayout } from '../components/AuthLayout';
import { ResetPasswordForm } from '../components/ResetPasswordForm';
import type { ResetPasswordPageProps } from '../types';

/**
 * Full reset-password screen: triangle side panel + optional logo (from
 * AuthLayout) wrapped around the self-contained <ResetPasswordForm />.
 */
export type ResetPasswordScreenProps = ResetPasswordPageProps;

export function ResetPasswordScreen({ logo, pattern, backgroundColor, leftPanel, className, ...formProps }: ResetPasswordScreenProps) {
  return (
    <AuthLayout logo={logo} pattern={pattern} backgroundColor={backgroundColor} leftPanel={leftPanel} className={className}>
      <ResetPasswordForm {...formProps} />
    </AuthLayout>
  );
}
