'use client';

import { AuthLayout } from '../components/AuthLayout';
import { ResetPasswordForm } from '../components/ResetPasswordForm';
import type { ResetPasswordPageProps } from '../types';

export function ResetPasswordPage({ logo, pattern, backgroundColor, leftPanel, className, ...formProps }: ResetPasswordPageProps) {
  return (
    <AuthLayout logo={logo} pattern={pattern} backgroundColor={backgroundColor} leftPanel={leftPanel} className={className}>
      <ResetPasswordForm {...formProps} />
    </AuthLayout>
  );
}
