import { render } from '@testing-library/react';
import { AuthLayout } from '../../../src/components/AuthLayout';

describe('AuthLayout theming', () => {
  it('routes every classNames slot to its element', () => {
    const { container } = render(
      <AuthLayout
        logo={<span>logo</span>}
        title="T"
        subtitle="S"
        classNames={{
          root: 'slot-root',
          content: 'slot-content',
          logo: 'slot-logo',
          title: 'slot-title',
          subtitle: 'slot-subtitle',
          body: 'slot-body',
          sidePanel: 'slot-side',
        }}
      >
        <div>child</div>
      </AuthLayout>
    );

    expect(container.querySelector('.wiz-auth-page.slot-root')).toBeTruthy();
    expect(container.querySelector('.wiz-auth-content.slot-content')).toBeTruthy();
    expect(container.querySelector('.wiz-auth-logo.slot-logo')).toBeTruthy();
    expect(container.querySelector('.slot-title')).toBeTruthy();
    expect(container.querySelector('.slot-subtitle')).toBeTruthy();
    expect(container.querySelector('.wiz-auth-body.slot-body')).toBeTruthy();
    expect(container.querySelector('.wiz-auth-side-panel.slot-side')).toBeTruthy();
  });

  it('keeps the legacy className prop working alongside slots', () => {
    const { container } = render(<AuthLayout className="legacy"><div /></AuthLayout>);
    expect(container.querySelector('.wiz-auth-page.legacy')).toBeTruthy();
  });

  it('exposes forceColorScheme as data-wiz-scheme', () => {
    const { container } = render(<AuthLayout forceColorScheme="light"><div /></AuthLayout>);
    expect(container.querySelector('[data-wiz-scheme="light"]')).toBeTruthy();
  });

  it('omits data-wiz-scheme when the prop is not given', () => {
    const { container } = render(<AuthLayout><div /></AuthLayout>);
    expect(container.querySelector('[data-wiz-scheme]')).toBeNull();
  });

  it('passes backgroundColor through as a CSS variable, not a hard-coded colour', () => {
    const { container } = render(<AuthLayout backgroundColor="rgb(255, 0, 0)"><div /></AuthLayout>);
    const panel = container.querySelector('.wiz-auth-side-panel') as HTMLElement;
    expect(panel.style.getPropertyValue('--wiz-auth-side-panel-background')).toBe('rgb(255, 0, 0)');
    expect(panel.style.backgroundColor).toBe('');
  });

  it('signals fullHeight={false} with a data attribute instead of inline style', () => {
    const { container } = render(<AuthLayout fullHeight={false}><div /></AuthLayout>);
    const page = container.querySelector('.wiz-auth-page') as HTMLElement;
    expect(page.getAttribute('data-full-height')).toBe('false');
    expect(page.style.minHeight).toBe('');
  });
});
