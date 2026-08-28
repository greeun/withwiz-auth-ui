'use client';

import { AuthLayout } from '../components/AuthLayout';
import { EmailVerificationForm } from '../components/EmailVerificationForm';
import type { EmailVerificationPageProps } from '../types';

export function EmailVerificationPage({ logo, pattern, backgroundColor, leftPanel, className, fullHeight, layoutClassNames, forceColorScheme, ...formProps }: EmailVerificationPageProps) {
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
