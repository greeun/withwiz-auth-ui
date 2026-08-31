import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { AuthLayout } from '../../../src/components/AuthLayout';

const css = readFileSync(join(__dirname, '../../../src/styles/auth.css'), 'utf8');

describe('AuthLayout', () => {
  it('renders children', () => {
    render(<AuthLayout><p>Child content</p></AuthLayout>);
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('renders logo when provided', () => {
    render(<AuthLayout logo={<img alt="Logo" src="/logo.png" />}><div /></AuthLayout>);
    expect(screen.getByAltText('Logo')).toBeInTheDocument();
  });

  it('constrains the logo to the same content-width box the forms center themselves in', () => {
    const { container } = render(<AuthLayout logo={<img alt="Logo" src="/logo.png" />}><div /></AuthLayout>);
    const logoBox = container.querySelector('.wiz-auth-logo') as HTMLElement;
    expect(logoBox).toContainElement(screen.getByAltText('Logo'));
    // 로고와 폼은 같은 --wiz-auth-content-width 박스를 공유해야 한다. 다른 값을 쓰면
    // 로고가 컬럼 패딩 밖으로 밀리고 폼 좌측 모서리와의 간격이 뷰포트에 따라 달라진다.
    expect(css).toMatch(/\.wiz-auth-logo\s*\{[^}]*max-width:\s*var\(--wiz-auth-content-width\)/);
    expect(css).toMatch(/\.wiz-auth-logo\s*\{[^}]*margin:\s*0 auto 32px/);
    expect(css).toMatch(/\.wiz-auth-form\s*\{[^}]*max-width:\s*var\(--wiz-auth-content-width\)/);
  });

  it('keeps the logo out of the vertically centered stack', () => {
    const { container } = render(<AuthLayout logo={<img alt="Logo" src="/logo.png" />}><p>Child content</p></AuthLayout>);
    const column = container.querySelector('.wiz-auth-content') as HTMLElement;
    const logoBox = container.querySelector('.wiz-auth-logo') as HTMLElement;
    const body = container.querySelector('.wiz-auth-body') as HTMLElement;
    // 로고는 컬럼 상단에 고정되고, 중앙정렬은 그 아래 body만 담당한다. 로고를 중앙정렬
    // 스택 안에 두면 폼 높이(검증 문구, OAuth 버튼 수, 렌더 화면)에 따라 위아래로 흔들린다.
    expect(logoBox.parentElement).toBe(column);
    expect(body.parentElement).toBe(column);
    expect(column.children[0]).toBe(logoBox);
    expect(column.children[1]).toBe(body);
    expect(body).toContainElement(screen.getByText('Child content'));
    expect(css).toMatch(/\.wiz-auth-body\s*\{[^}]*flex:\s*1/);
    expect(css).toMatch(/\.wiz-auth-body\s*\{[^}]*justify-content:\s*center/);
    expect(css).not.toMatch(/\.wiz-auth-content\s*\{[^}]*justify-content/);
  });

  it('still centers content vertically when no logo is given', () => {
    const { container } = render(<AuthLayout><p>Child content</p></AuthLayout>);
    const column = container.querySelector('.wiz-auth-content') as HTMLElement;
    const body = container.querySelector('.wiz-auth-body') as HTMLElement;
    expect(container.querySelector('.wiz-auth-logo')).toBeNull();
    expect(column.firstElementChild).toBe(body);
    expect(body).toContainElement(screen.getByText('Child content'));
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
    expect(sidePanel.style.getPropertyValue('--wiz-auth-side-panel-background')).toBe('#ff0000');
  });
});
