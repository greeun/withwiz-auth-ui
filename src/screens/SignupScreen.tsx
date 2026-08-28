'use client';

import { AuthLayout } from '../components/AuthLayout';
import { SignupForm } from '../components/SignupForm';
import type { SignupPageProps } from '../types';

/**
 * Full signup screen: side panel + optional logo (from AuthLayout) wrapped
 * around the self-contained <SignupForm />.
 *
 * Visual props (logo, pattern, backgroundColor, leftPanel, layoutClassNames,
 * forceColorScheme) feed AuthLayout; everything else — including the form's
 * own `classNames` — forwards to SignupForm.
 */
export type SignupScreenProps = SignupPageProps;

export function SignupScreen({ logo, pattern, backgroundColor, leftPanel, className, fullHeight, layoutClassNames, forceColorScheme, ...formProps }: SignupScreenProps) {
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
      <SignupForm {...formProps} />
    </AuthLayout>
  );
}
