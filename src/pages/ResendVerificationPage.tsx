'use client';

import { AuthLayout } from '../components/AuthLayout';
import { ResendVerificationForm } from '../components/ResendVerificationForm';
import type { ResendVerificationPageProps } from '../types';

export function ResendVerificationPage({ logo, pattern, backgroundColor, leftPanel, className, fullHeight, layoutClassNames, forceColorScheme, ...formProps }: ResendVerificationPageProps) {
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
