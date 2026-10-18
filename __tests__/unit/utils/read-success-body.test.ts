import { readSuccessField } from '../../../src/utils/read-success-body';

describe('readSuccessField', () => {
  it('reads a top-level field', () => {
    expect(readSuccessField({ user: { id: '1' } }, 'user')).toEqual({ id: '1' });
  });

  it('falls back to the { success, data } envelope', () => {
    expect(readSuccessField({ success: true, data: { user: { id: '2' } } }, 'user')).toEqual({ id: '2' });
  });

  it('prefers the top-level field when both exist', () => {
    expect(readSuccessField({ loginUrl: 'https://a', data: { loginUrl: 'https://b' } }, 'loginUrl')).toBe('https://a');
  });

  it('returns undefined for non-objects and missing fields', () => {
    expect(readSuccessField(null, 'user')).toBeUndefined();
    expect(readSuccessField('text', 'user')).toBeUndefined();
    expect(readSuccessField([{ user: 1 }], 'user')).toBeUndefined();
    expect(readSuccessField({ success: true, data: null }, 'user')).toBeUndefined();
    expect(readSuccessField({ success: true }, 'user')).toBeUndefined();
  });
});
