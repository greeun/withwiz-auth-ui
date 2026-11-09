import { describe, it, expect } from 'vitest';
import { ko, en, ja, mergeMessages } from '../../../src/i18n';

describe('mfa i18n', () => {
  it('ko·en·ja 키가 같고 빈 문자열이 없다', () => {
    const keys = Object.keys(ko.mfa).sort();
    expect(Object.keys(en.mfa).sort()).toEqual(keys);
    expect(Object.keys(ja.mfa).sort()).toEqual(keys);
    for (const m of [ko.mfa, en.mfa, ja.mfa]) {
      for (const v of Object.values(m)) expect(v).not.toBe('');
    }
  });
  it('mergeMessages 가 mfa 를 키 단위로 덮어쓴다', () => {
    const m = mergeMessages('ko', { mfa: { title: 'X' } });
    expect(m.mfa.title).toBe('X');
    expect(m.mfa.subtitle).toBe(ko.mfa.subtitle);
  });
  it('자리표시자', () => {
    for (const m of [ko.mfa, en.mfa, ja.mfa]) {
      expect(m.locked).toContain('{minutes}');
      expect(m.recoveryCodesRemaining).toContain('{count}');
    }
  });
});
