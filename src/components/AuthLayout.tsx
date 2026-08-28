'use client';

import type { AuthLayoutProps } from '../types';

const CONTENT_MAX_WIDTH = '384px';

export function AuthLayout({
  children,
  logo,
  title,
  subtitle,
  pattern = 'triangle',
  backgroundColor,
  leftPanel,
  className,
  fullHeight = true,
}: AuthLayoutProps) {
  return (
    <div className={`wiz-auth-page ${className ?? ''}`} style={{ display: 'flex', minHeight: fullHeight ? '100vh' : '100%' }}>
      <div style={{ display: 'flex', width: '100%', flexDirection: 'column', padding: '48px 24px', maxWidth: '480px' }}>
        {logo && <div style={{ width: '100%', maxWidth: CONTENT_MAX_WIDTH, margin: '0 auto 32px' }}>{logo}</div>}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {title && <h1 style={{ fontSize: '24px', fontWeight: 700 }}>{title}</h1>}
          {subtitle && <p style={{ marginTop: '4px', fontSize: '14px', color: '#6b7280' }}>{subtitle}</p>}
          <div style={{ marginTop: '24px' }}>{children}</div>
        </div>
      </div>

      <div
        className="wiz-auth-side-panel"
        style={{
          display: 'none',
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: backgroundColor ?? '#f0f4ff',
        }}
      >
        {leftPanel ?? (
          <div style={{ position: 'absolute', inset: 0, opacity: 0.2 }}>
            {pattern !== 'none' && <PatternSVG pattern={pattern} />}
          </div>
        )}
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .wiz-auth-side-panel { display: flex !important; }
          .wiz-auth-page > div:first-child { width: 33.333%; }
        }
      `}</style>
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
