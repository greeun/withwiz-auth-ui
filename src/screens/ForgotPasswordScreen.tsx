'use client';

import { AuthLayout } from '../components/AuthLayout';
import { ForgotPasswordForm } from '../components/ForgotPasswordForm';
import type { ForgotPasswordPageProps } from '../types';

/**
 * Full forgot-password screen: side panel + optional logo (from AuthLayout)
 * wrapped around the self-contained <ForgotPasswordForm />.
 *
 * Visual props (logo, pattern, backgroundColor, leftPanel, layoutClassNames,
 * forceColorScheme) feed AuthLayout; everything else — including the form's
 * own `classNames` — forwards to ForgotPasswordForm.
 */
export type ForgotPasswordScreenProps = ForgotPasswordPageProps;

export function ForgotPasswordScreen({ logo, pattern, backgroundColor, leftPanel, className, fullHeight, layoutClassNames, forceColorScheme, ...formProps }: ForgotPasswordScreenProps) {
  return (
    <AuthLayout
      logo={logo}
      pattern={pattern}
      backgroundColor={backgroundColor}
      leftPanel={leftPanel}
      fullHeight={fullHeight}
      className={className}
      classNames={layoutClassNames}
      forceColorScheme={forceColorScheme}
    >
      <ForgotPasswordForm {...formProps} />
    </AuthLayout>
  );
}
