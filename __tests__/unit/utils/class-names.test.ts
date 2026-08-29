import { cx } from '../../../src/utils/class-names';

describe('cx', () => {
  it('joins truthy parts with a single space', () => {
    expect(cx('a', 'b')).toBe('a b');
  });

  it('drops undefined, null and false', () => {
    expect(cx('a', undefined, null, false, 'b')).toBe('a b');
  });

  it('returns undefined when nothing remains, so no empty class attribute is rendered', () => {
    expect(cx(undefined, false)).toBeUndefined();
    expect(cx()).toBeUndefined();
  });

  it('preserves consumer order so their classes come last', () => {
    expect(cx('wiz-auth-input', 'rounded-xl')).toBe('wiz-auth-input rounded-xl');
  });
});
