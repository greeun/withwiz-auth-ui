'use client';

import { AuthLayout } from '../components/AuthLayout';
import { EmailVerificationForm } from '../components/EmailVerificationForm';
import type { EmailVerificationPageProps } from '../types';

/**
 * Full email-verification screen: side panel + optional logo (from
 * AuthLayout) wrapped around the self-contained <EmailVerificationForm />.
 *
 * Visual props (logo, pattern, backgroundColor, leftPanel, layoutClassNames,
 * forceColorScheme) feed AuthLayout; everything else — including the form's
 * own `classNames` — forwards to EmailVerificationForm.
 */
export type EmailVerificationScreenProps = EmailVerificationPageProps;

export function EmailVerificationScreen({ logo, pattern, backgroundColor, leftPanel, className, fullHeight, layoutClassNames, forceColorScheme, ...formProps }: EmailVerificationScreenProps) {
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
      <EmailVerificationForm {...formProps} />
    </AuthLayout>
  );
}
