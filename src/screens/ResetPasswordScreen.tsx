'use client';

import { AuthLayout } from '../components/AuthLayout';
import { ResetPasswordForm } from '../components/ResetPasswordForm';
import type { ResetPasswordPageProps } from '../types';

/**
 * Full reset-password screen: side panel + optional logo (from AuthLayout)
 * wrapped around the self-contained <ResetPasswordForm />.
 *
 * Visual props (logo, pattern, backgroundColor, leftPanel, layoutClassNames,
 * forceColorScheme) feed AuthLayout; everything else — including the form's
 * own `classNames` — forwards to ResetPasswordForm.
 */
export type ResetPasswordScreenProps = ResetPasswordPageProps;

export function ResetPasswordScreen({ logo, pattern, backgroundColor, leftPanel, className, fullHeight, layoutClassNames, forceColorScheme, ...formProps }: ResetPasswordScreenProps) {
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
      <ResetPasswordForm {...formProps} />
    </AuthLayout>
  );
}
