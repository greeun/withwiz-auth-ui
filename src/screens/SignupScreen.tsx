'use client';

import { AuthLayout } from '../components/AuthLayout';
import { SignupForm } from '../components/SignupForm';
import type { SignupPageProps } from '../types';

/**
 * Full signup screen: triangle side panel + optional logo (from AuthLayout)
 * wrapped around the self-contained <SignupForm />.
 */
export type SignupScreenProps = SignupPageProps;

export function SignupScreen({ logo, pattern, backgroundColor, leftPanel, className, ...formProps }: SignupScreenProps) {
  return (
    <AuthLayout logo={logo} pattern={pattern} backgroundColor={backgroundColor} leftPanel={leftPanel} className={className}>
      <SignupForm {...formProps} />
    </AuthLayout>
  );
}
