'use client';

import { useState, useCallback } from 'react';
import { z } from 'zod';

export interface UseAuthFormOptions<T extends z.ZodType> {
  schema: T;
  onSubmit: (data: z.infer<T>) => Promise<void>;
}

export function useAuthForm<T extends z.ZodType>(options: UseAuthFormOptions<T>) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const validate = useCallback((data: unknown) => {
    const result = options.schema.safeParse(data);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join('.');
        if (path) fieldErrors[path] = issue.message;
      }
      setErrors(fieldErrors);
      return null;
    }
    setErrors({});
    return result.data;
  }, [options.schema]);

  const submit = useCallback(async (data: unknown) => {
    setServerError(null);
    const validated = validate(data);
    if (!validated) return;

    setLoading(true);
    try {
      await options.onSubmit(validated);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'An error occurred';
      setServerError(message);
    } finally {
      setLoading(false);
    }
  }, [validate, options]);

  return { errors, loading, serverError, setServerError, submit, validate };
}
