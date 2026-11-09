import { render, screen } from '@testing-library/react';
import { encode } from 'uqr';
import { MfaQrCode } from '../../../src/components/MfaQrCode';

const URI = 'otpauth://totp/Acme:a@b.c?secret=JBSWY3DPEHPK3PXP&issuer=Acme';

describe('MfaQrCode', () => {
  it('role=img, aria-label, path 한 개를 그린다', () => {
    const { container } = render(<MfaQrCode value={URI} label="QR 코드" />);
    const svg = screen.getByRole('img', { name: 'QR 코드' });
    expect(svg.tagName.toLowerCase()).toBe('svg');
    expect(svg.getAttribute('shape-rendering')).toBe('crispEdges');
    expect(svg.getAttribute('width')).toBe('192');
    expect(svg.getAttribute('height')).toBe('192');
    expect(container.querySelectorAll('rect')).toHaveLength(1);
    expect(container.querySelectorAll('path')).toHaveLength(1);
  });

  it('size 와 className 을 반영한다', () => {
    render(<MfaQrCode value={URI} label="QR" size={120} className="x" />);
    const svg = screen.getByRole('img');
    expect(svg.getAttribute('width')).toBe('120');
    expect(svg.getAttribute('class')).toBe('wiz-auth-mfa-qr x');
  });

  it('viewBox 는 행렬 크기 + 8 이다', () => {
    const n = encode(URI, { ecc: 'M', border: 0 }).size + 8;
    render(<MfaQrCode value={URI} label="QR" />);
    expect(screen.getByRole('img').getAttribute('viewBox')).toBe(`0 0 ${n} ${n}`);
  });

  it('같은 값이면 같은 path d 를 만든다, 값이 다르면 다르다', () => {
    const d = (v: string) => {
      const { container, unmount } = render(<MfaQrCode value={v} label="QR" />);
      const out = container.querySelector('path')!.getAttribute('d');
      unmount();
      return out;
    };
    expect(d(URI)).toBe(d(URI));
    expect(d(URI)).not.toBe(d(URI + 'x'));
  });

  it('인라인 style 이 없다', () => {
    const { container } = render(<MfaQrCode value={URI} label="QR" />);
    expect(container.querySelector('[style]')).toBeNull();
  });
});
