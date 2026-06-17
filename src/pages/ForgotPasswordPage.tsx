'use client';

import { AuthLayout } from '../components/AuthLayout';
import { ForgotPasswordForm } from '../components/ForgotPasswordForm';
import type { ForgotPasswordPageProps } from '../types';

export function ForgotPasswordPage({ logo, pattern, backgroundColor, leftPanel, className, fullHeight, ...formProps }: ForgotPasswordPageProps) {
  return (
    <AuthLayout logo={logo} pattern={pattern} backgroundColor={backgroundColor} leftPanel={leftPanel} fullHeight={fullHeight} className={className}>
      <ForgotPasswordForm {...formProps} />
    </AuthLayout>
  );
}
