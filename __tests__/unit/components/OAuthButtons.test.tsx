import { render, screen } from '@testing-library/react';
import { OAuthButtons } from '../../../src/components/OAuthButtons';

describe('OAuthButtons', () => {
  it('should render Google button when provider is included', () => {
    render(<OAuthButtons providers={['google']} />);
    expect(screen.getByTestId('oauth-google-btn')).toBeInTheDocument();
  });

  it('should render all three providers', () => {
    render(<OAuthButtons providers={['google', 'github', 'kakao']} />);
    expect(screen.getByTestId('oauth-google-btn')).toBeInTheDocument();
    expect(screen.getByTestId('oauth-github-btn')).toBeInTheDocument();
    expect(screen.getByTestId('oauth-kakao-btn')).toBeInTheDocument();
  });

  it('should not render providers not in list', () => {
    render(<OAuthButtons providers={['google']} />);
    expect(screen.queryByTestId('oauth-github-btn')).not.toBeInTheDocument();
  });
});
