'use client';

import { AuthLayout } from '../components/AuthLayout';
import { ResetPasswordForm } from '../components/ResetPasswordForm';
import type { ResetPasswordPageProps } from '../types';

export function ResetPasswordPage({ logo, pattern, backgroundColor, leftPanel, className, fullHeight, ...formProps }: ResetPasswordPageProps) {
  return (
    <AuthLayout logo={logo} pattern={pattern} backgroundColor={backgroundColor} leftPanel={leftPanel} fullHeight={fullHeight} className={className}>
      <ResetPasswordForm {...formProps} />
    </AuthLayout>
  );
}
