import { describe, it, expect } from 'vitest';
import type { AuthFormHooks, LoginFormProps } from '../../../src/types';

/**
 * 0.7 소비자의 onSuccess 핸들러(값을 반환하는 것 포함)가 0.8 타입에서도 컴파일되는지 확인한다.
 * vitest 는 타입을 검사하지 않고 tsconfig.json 은 __tests__ 를 제외하므로, 이 파일의 타입 검사는
 * `tsc -p tsconfig.tests.json` 으로 한다.
 */
describe('hooks.onSuccess keeps accepting 0.7-style handlers', () => {
  it('accepts handlers with arbitrary return types', () => {
    const toastLike: LoginFormProps['hooks'] = { onSuccess: () => (Math.random() > 2 ? 'id' : 1) };
    const pushLike: LoginFormProps['hooks'] = { onSuccess: () => Promise.resolve(true) };
    const returnsTrue: LoginFormProps['hooks'] = { onSuccess: () => true };
    const block: LoginFormProps['hooks'] = { onSuccess: (user) => { void user; } };
    const oneArg: AuthFormHooks<unknown> = { onSuccess: (user: unknown) => user };
    const asyncPath: AuthFormHooks<unknown> = { onSuccess: async () => '/next' };
    const withContext: AuthFormHooks<unknown> = { onSuccess: (_user, { body }) => body };

    expect([toastLike, pushLike, returnsTrue, block, oneArg, asyncPath, withContext]).toHaveLength(7);
  });
});
