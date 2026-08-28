import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const css = readFileSync(join(__dirname, '../../../src/styles/auth.css'), 'utf8');

const TOKENS = [
  'primary', 'primary-hover', 'primary-foreground',
  'background', 'foreground', 'muted-foreground', 'oauth-foreground',
  'border', 'input', 'input-background', 'divider',
  'error', 'error-background', 'field-error',
  'success', 'success-background',
  'radius', 'field-height', 'content-width', 'field-gap',
  'font', 'side-panel-background', 'oauth-height', 'color-scheme',
];

describe('auth.css contract', () => {
  it('wraps every rule in the wiz-auth cascade layer', () => {
    expect(css).toMatch(/@layer\s+wiz-auth\s*\{/);
  });

  it('declares all 24 tokens with their light defaults', () => {
    for (const token of TOKENS) {
      expect(css).toContain(`--wiz-auth-${token}:`);
    }
  });

  it('keeps the published light defaults byte-identical', () => {
    expect(css).toContain('--wiz-auth-primary: #4f46e5;');
    expect(css).toContain('--wiz-auth-primary-hover: #4338ca;');
    expect(css).toContain('--wiz-auth-error: #dc2626;');
    expect(css).toContain('--wiz-auth-border: #d1d5db;');
    expect(css).toContain('--wiz-auth-radius: 6px;');
    expect(css).toContain('--wiz-auth-content-width: 384px;');
  });

  it('supports all three color scheme states', () => {
    expect(css).toContain('@media (prefers-color-scheme: dark)');
    expect(css).toContain('[data-theme="dark"]');
    expect(css).toContain('[data-wiz-scheme="dark"]');
    expect(css).toContain('[data-wiz-scheme="light"]');
  });

  it('neutralises the specificity of automatic schemes with :where()', () => {
    // Without :where(), `:root[data-theme="dark"]` (0,2,0) outranks
    // `[data-wiz-scheme]` (0,1,0) and forceColorScheme silently stops working.
    expect(css).toMatch(/:where\(:root\[data-theme="dark"\]/);
    expect(css).toMatch(/@media \(prefers-color-scheme: dark\)\s*\{\s*:where\(/);
  });

  it('keeps [data-wiz-scheme] rules OUTSIDE :where(), so forceColorScheme keeps winning', () => {
    // The automatic states above ((1) prefers-color-scheme, (2) [data-theme]/.dark)
    // are deliberately wrapped in :where() to sit at specificity (0,0,0), so a
    // consumer's own `:root[data-theme="dark"]` rule can outrank them.
    // [data-wiz-scheme] is the opposite: it is the forceColorScheme escape hatch and
    // MUST keep its natural attribute-selector specificity (0,1,0) so it outranks
    // the :where()-wrapped automatic states. If a future edit "simplifies" this by
    // wrapping [data-wiz-scheme] in :where() too, its specificity drops to (0,0,0),
    // the app-level [data-theme]/.dark toggle above starts outranking it again, and
    // forceColorScheme silently stops working — with every other test in this file
    // still green, since none of them look at [data-wiz-scheme] specificity.
    expect(css).not.toMatch(/:where\([^)]*\[data-wiz-scheme=/);
  });

  it('no longer pins color-scheme to light', () => {
    // Negative lookbehind excludes the `--wiz-auth-color-scheme: light;`
    // custom property (part of the token contract) so this only catches a
    // literal `color-scheme: light;` declaration, which is what the test
    // name actually means to forbid.
    expect(css).not.toMatch(/(?<!-)color-scheme:\s*light;/);
  });
});
