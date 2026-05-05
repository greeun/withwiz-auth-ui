import { renderHook, act } from '@testing-library/react';
import { z } from 'zod';
import { useAuthForm } from '../../../src/hooks/useAuthForm';

describe('useAuthForm', () => {
  const schema = z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'Too short'),
  });

  it('should start with no errors and not loading', () => {
    const { result } = renderHook(() =>
      useAuthForm({ schema, onSubmit: async () => {} })
    );
    expect(result.current.errors).toEqual({});
    expect(result.current.loading).toBe(false);
    expect(result.current.serverError).toBeNull();
  });

  it('should validate and set field errors', async () => {
    const { result } = renderHook(() =>
      useAuthForm({ schema, onSubmit: async () => {} })
    );

    await act(async () => {
      await result.current.submit({ email: 'bad', password: '12' });
    });

    expect(result.current.errors.email).toBe('Invalid email');
    expect(result.current.errors.password).toBe('Too short');
  });

  it('should call onSubmit with valid data', async () => {
    const onSubmit = vi.fn();
    const { result } = renderHook(() =>
      useAuthForm({ schema, onSubmit })
    );

    await act(async () => {
      await result.current.submit({ email: 'test@test.com', password: 'password123' });
    });

    expect(onSubmit).toHaveBeenCalledWith({ email: 'test@test.com', password: 'password123' });
    expect(result.current.errors).toEqual({});
  });

  it('should set serverError on submit failure', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Server error'));
    const { result } = renderHook(() =>
      useAuthForm({ schema, onSubmit })
    );

    await act(async () => {
      await result.current.submit({ email: 'test@test.com', password: 'password123' });
    });

    expect(result.current.serverError).toBe('Server error');
  });
});
