'use client';

import { AuthLayout } from '../components/AuthLayout';
import { MfaChallengeForm } from '../components/MfaChallengeForm';
import type { MfaChallengePageProps } from '../types';

export function MfaChallengePage({ logo, pattern, backgroundColor, leftPanel, className, fullHeight, layoutClassNames, forceColorScheme, ...formProps }: MfaChallengePageProps) {
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
