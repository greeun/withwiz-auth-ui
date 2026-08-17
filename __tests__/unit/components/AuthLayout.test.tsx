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

  it('constrains the logo to the same 384px box the forms center themselves in', () => {
    const { container } = render(<AuthLayout logo={<img alt="Logo" src="/logo.png" />}><div /></AuthLayout>);
    const logoBox = container.querySelector('.wiz-auth-page > div')?.firstElementChild as HTMLElement;
    expect(logoBox).toContainElement(screen.getByAltText('Logo'));
    expect(logoBox.style.maxWidth).toBe('384px');
    expect(logoBox.style.margin).toBe('0px auto 32px');
  });

  it('keeps the logo out of the vertically centered stack', () => {
    const { container } = render(<AuthLayout logo={<img alt="Logo" src="/logo.png" />}><p>Child content</p></AuthLayout>);
    const column = container.querySelector('.wiz-auth-page > div') as HTMLElement;
    // 컬럼 자체는 더 이상 중앙정렬하지 않는다 — 로고 아래 영역만 중앙정렬한다.
    expect(column.style.justifyContent).toBe('');
    const centered = column.children[1] as HTMLElement;
    expect(centered.style.justifyContent).toBe('center');
    expect(centered.style.flex).toContain('1');
    expect(centered).toContainElement(screen.getByText('Child content'));
  });

  it('still centers content vertically when no logo is given', () => {
    const { container } = render(<AuthLayout><p>Child content</p></AuthLayout>);
    const column = container.querySelector('.wiz-auth-page > div') as HTMLElement;
    const centered = column.firstElementChild as HTMLElement;
    expect(centered.style.justifyContent).toBe('center');
    expect(centered).toContainElement(screen.getByText('Child content'));
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
