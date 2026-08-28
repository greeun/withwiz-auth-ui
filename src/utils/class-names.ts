/**
 * Joins class name parts, dropping empty ones.
 *
 * Returns `undefined` (not '') when nothing remains so React omits the
 * `class` attribute entirely.
 *
 * No tailwind-merge here on purpose: package styles live inside
 * `@layer wiz-auth`, so any consumer class — layered or not — already wins
 * regardless of source order. Keeping this dependency-free keeps the
 * package's only runtime dependency at `zod`.
 */
export function cx(...parts: Array<string | undefined | false | null>): string | undefined {
  const joined = parts.filter(Boolean).join(' ').trim();
  return joined === '' ? undefined : joined;
}
