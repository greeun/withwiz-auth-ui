import { cx } from '../utils/class-names';

/**
 * Visible `*` after a required field's label (since 0.8.4).
 *
 * `aria-hidden` because the input already carries `aria-required`/`required`;
 * screen readers would otherwise announce "star". The mark exists so the
 * requirement is not conveyed by colour alone (WCAG 1.4.1).
 */
export function RequiredMark({ show, unstyled, className }: { show: boolean; unstyled: boolean; className?: string }) {
  if (!show) return null;
  return (
    <span aria-hidden="true" className={cx(unstyled ? undefined : 'wiz-auth-required', className)}>
      {' *'}
    </span>
  );
}
