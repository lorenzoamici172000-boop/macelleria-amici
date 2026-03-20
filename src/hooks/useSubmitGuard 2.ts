'use client';

import { useState, useCallback, useRef } from 'react';

/**
 * Hook to prevent double form submissions.
 * Wraps an async handler and disables it while executing.
 */
export function useSubmitGuard() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lockRef = useRef(false);

  const guard = useCallback(
    <T,>(handler: () => Promise<T>): Promise<T | undefined> => {
      if (lockRef.current) return Promise.resolve(undefined);

      lockRef.current = true;
      setIsSubmitting(true);

      return handler()
        .finally(() => {
          lockRef.current = false;
          setIsSubmitting(false);
        });
    },
    []
  );

  return { isSubmitting, guard };
}
