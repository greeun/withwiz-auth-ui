'use client';

import { AuthLayout } from '../components/AuthLayout';
import { ResendVerificationForm } from '../components/ResendVerificationForm';
import type { ResendVerificationPageProps } from '../types';

/**
 * Full verification-email resend screen: side panel + optional logo (from AuthLayout)
 * wrapped around the self-contained <ResendVerificationForm />.
 *
 * Visual props (logo, pattern, backgroundColor, leftPanel, layoutClassNames,
 * forceColorScheme) feed AuthLayout; everything else — including the form's
 * own `classNames` — forwards to ResendVerificationForm.
 */
export type ResendVerificationScreenProps = ResendVerificationPageProps;

export function ResendVerificationScreen({ logo, pattern, backgroundColor, leftPanel, className, fullHeight, layoutClassNames, forceColorScheme, ...formProps }: ResendVerificationScreenProps) {
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
      <ResendVerificationForm {...formProps} />
    </AuthLayout>
  );
}
