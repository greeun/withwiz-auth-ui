'use client';

import { AuthLayout } from '../components/AuthLayout';
import { MfaChallengeForm } from '../components/MfaChallengeForm';
import type { MfaChallengePageProps } from '../types';

/**
 * Full MFA challenge screen: side panel + optional logo (from AuthLayout) wrapped
 * around the self-contained <MfaChallengeForm />.
 *
 * Visual props (logo, pattern, backgroundColor, leftPanel, layoutClassNames,
 * forceColorScheme) feed AuthLayout; everything else — including the form's
 * own `classNames` — forwards to MfaChallengeForm.
 */
export type MfaChallengeScreenProps = MfaChallengePageProps;

export function MfaChallengeScreen({ logo, pattern, backgroundColor, leftPanel, className, fullHeight, layoutClassNames, forceColorScheme, ...formProps }: MfaChallengeScreenProps) {
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
      <MfaChallengeForm {...formProps} />
    </AuthLayout>
  );
}
