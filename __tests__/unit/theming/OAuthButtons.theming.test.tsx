import { render, screen } from '@testing-library/react';
import { OAuthButtons } from '../../../src/components/OAuthButtons';

describe('OAuthButtons theming', () => {
  it('routes classNames slots to group and buttons', () => {
    const { container } = render(
      <OAuthButtons providers={['google', 'kakao']} classNames={{ root: 'slot-root', button: 'slot-btn' }} />
    );
    expect(container.querySelector('.wiz-oauth-buttons.slot-root')).toBeTruthy();
    expect(container.querySelectorAll('.wiz-oauth-btn.slot-btn')).toHaveLength(2);
  });

  it('marks the provider so brand colours can be styled from CSS', () => {
    render(<OAuthButtons providers={['kakao']} />);
    expect(screen.getByTestId('oauth-kakao-btn').getAttribute('data-provider')).toBe('kakao');
  });

  it('carries no inline style', () => {
    render(<OAuthButtons providers={['google']} />);
    expect(screen.getByTestId('oauth-google-btn').getAttribute('style')).toBeNull();
  });

  it('keeps the legacy className prop on the group', () => {
    const { container } = render(<OAuthButtons providers={['google']} className="legacy" />);
    expect(container.querySelector('.wiz-oauth-buttons.legacy')).toBeTruthy();
  });
});
