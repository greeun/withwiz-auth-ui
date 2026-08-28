'use client';

import { cx } from '../utils/class-names';
import type { AuthLayoutProps } from '../types';

export function AuthLayout({
  children,
  logo,
  title,
  subtitle,
  pattern = 'triangle',
  backgroundColor,
  leftPanel,
  className,
  classNames,
  fullHeight = true,
  forceColorScheme,
}: AuthLayoutProps) {
  return (
    <div
      className={cx('wiz-auth-page', className, classNames?.root)}
      data-full-height={fullHeight ? undefined : 'false'}
      data-wiz-scheme={forceColorScheme}
    >
      <div className={cx('wiz-auth-content', classNames?.content)}>
        {logo && <div className={cx('wiz-auth-logo', classNames?.logo)}>{logo}</div>}
        <div className={cx('wiz-auth-body', classNames?.body)}>
          {title && <h1 className={cx('wiz-auth-title', classNames?.title)}>{title}</h1>}
          {subtitle && <p className={cx('wiz-auth-subtitle', classNames?.subtitle)}>{subtitle}</p>}
          <div className="wiz-auth-slot">{children}</div>
        </div>
      </div>

      <div
        className={cx('wiz-auth-side-panel', classNames?.sidePanel)}
        style={backgroundColor ? ({ '--wiz-auth-side-panel-background': backgroundColor } as React.CSSProperties) : undefined}
      >
        {leftPanel ?? (
          <div className="wiz-auth-pattern">
            {pattern !== 'none' && <PatternSVG pattern={pattern} />}
          </div>
        )}
      </div>
    </div>
  );
}

function PatternSVG({ pattern }: { pattern: 'triangle' | 'hexagon' | 'dots' }) {
  if (pattern === 'triangle') {
    return (
      <svg width="100%" height="100%">
        <defs>
          <pattern id="wiz-triangles" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">
            <polygon points="30,0 60,52 0,52" fill="#6366f1" fillOpacity="0.3" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#wiz-triangles)" />
      </svg>
    );
  }
  if (pattern === 'hexagon') {
    return (
      <svg width="100%" height="100%">
        <defs>
          <pattern id="wiz-hexagons" x="0" y="0" width="80" height="70" patternUnits="userSpaceOnUse">
            <polygon points="40,0 80,20 80,50 40,70 0,50 0,20" fill="#10b981" fillOpacity="0.3" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#wiz-hexagons)" />
      </svg>
    );
  }
  return (
    <svg width="100%" height="100%">
      <defs>
        <pattern id="wiz-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="2" fill="#6b7280" fillOpacity="0.3" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#wiz-dots)" />
    </svg>
  );
}
