'use client';

import { useMemo } from 'react';
import { encode } from 'uqr';
import { cx } from '../utils/class-names';

const QUIET_ZONE = 4;

export interface MfaQrCodeProps {
  value: string;
  label: string;
  size?: number;
  className?: string;
}

/** otpauth URI 를 인라인 SVG QR 로 그린다. 색은 CSS 로 고정(배경 흰색, 모듈 검정). 내부 전용. */
export function MfaQrCode({ value, label, size = 192, className }: MfaQrCodeProps) {
  const { dim, d } = useMemo(() => {
    const { data, size: n } = encode(value, { ecc: 'M', border: 0 });
    let path = '';
    data.forEach((row, y) => row.forEach((dark, x) => {
      if (dark) path += `M${x + QUIET_ZONE} ${y + QUIET_ZONE}h1v1h-1z`;
    }));
    return { dim: n + QUIET_ZONE * 2, d: path };
  }, [value]);

  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${dim} ${dim}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className={cx('wiz-auth-mfa-qr', className)}
    >
      <rect width={dim} height={dim} />
      <path d={d} />
    </svg>
  );
}
