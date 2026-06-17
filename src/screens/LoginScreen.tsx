'use client';

import { AuthLayout } from '../components/AuthLayout';
import { LoginForm } from '../components/LoginForm';
import type { LoginPageProps } from '../types';

/**
 * Full login screen: triangle side panel + optional logo (from AuthLayout)
 * wrapped around the self-contained <LoginForm />.
 *
 * Visual props (logo, pattern, backgroundColor, leftPanel) feed AuthLayout;
 * everything else forwards to LoginForm. `pattern` defaults to 'triangle';
 * `logo` is optional and renders nothing when omitted.
 */
export type LoginScreenProps = LoginPageProps;

export function LoginScreen({ logo, pattern, backgroundColor, leftPanel, className, fullHeight, ...formProps }: LoginScreenProps) {
  return (
    <AuthLayout logo={logo} pattern={pattern} backgroundColor={backgroundColor} leftPanel={leftPanel} fullHeight={fullHeight} className={className}>
      <LoginForm {...formProps} />
    </AuthLayout>
  );
}
