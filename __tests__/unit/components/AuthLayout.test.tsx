import { render, screen } from '@testing-library/react';
import { AuthLayout } from '../../../src/components/AuthLayout';

describe('AuthLayout', () => {
  it('renders children', () => {
    render(<AuthLayout><p>Child content</p></AuthLayout>);
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('renders logo when provided', () => {
    render(<AuthLayout logo={<img alt="Logo" src="/logo.png" />}><div /></AuthLayout>);
    expect(screen.getByAltText('Logo')).toBeInTheDocument();
  });

  it('renders title as h1', () => {
    render(<AuthLayout title="Welcome"><div /></AuthLayout>);
    expect(screen.getByRole('heading', { level: 1, name: 'Welcome' })).toBeInTheDocument();
  });

  it('renders subtitle as paragraph', () => {
    render(<AuthLayout subtitle="Please sign in"><div /></AuthLayout>);
    expect(screen.getByText('Please sign in').tagName).toBe('P');
  });

  it('applies custom className alongside wiz-auth-page', () => {
    const { container } = render(<AuthLayout className="custom-layout"><div /></AuthLayout>);
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveClass('wiz-auth-page');
    expect(root).toHaveClass('custom-layout');
  });

  it('renders triangle pattern SVG by default', () => {
    const { container } = render(<AuthLayout><div /></AuthLayout>);
    const sidePanel = container.querySelector('.wiz-auth-side-panel');
    const svg = sidePanel?.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(sidePanel?.innerHTML).toContain('wiz-triangles');
  });

  it('renders hexagon pattern when specified', () => {
    const { container } = render(<AuthLayout pattern="hexagon"><div /></AuthLayout>);
    const sidePanel = container.querySelector('.wiz-auth-side-panel');
    expect(sidePanel?.innerHTML).toContain('wiz-hexagons');
  });

  it('renders dots pattern when specified', () => {
    const { container } = render(<AuthLayout pattern="dots"><div /></AuthLayout>);
    const sidePanel = container.querySelector('.wiz-auth-side-panel');
    expect(sidePanel?.innerHTML).toContain('wiz-dots');
  });

  it('does not render pattern SVG when pattern="none"', () => {
    const { container } = render(<AuthLayout pattern="none"><div /></AuthLayout>);
    const sidePanel = container.querySelector('.wiz-auth-side-panel');
    expect(sidePanel?.querySelector('svg')).toBeNull();
  });

  it('renders custom leftPanel instead of default pattern', () => {
    render(<AuthLayout leftPanel={<div data-testid="custom-panel">Custom</div>}><div /></AuthLayout>);
    expect(screen.getByTestId('custom-panel')).toBeInTheDocument();
    expect(screen.getByTestId('custom-panel')).toHaveTextContent('Custom');
  });

  it('applies custom backgroundColor to side panel', () => {
    const { container } = render(<AuthLayout backgroundColor="#ff0000"><div /></AuthLayout>);
    const sidePanel = container.querySelector('.wiz-auth-side-panel') as HTMLElement;
    expect(sidePanel.style.backgroundColor).toBe('rgb(255, 0, 0)');
  });
});
