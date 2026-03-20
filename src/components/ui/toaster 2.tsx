'use client';

import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        duration: 4000,
        style: {
          fontFamily: 'var(--font-body)',
        },
      }}
    />
  );
}

// Re-export toast for convenience
export { toast } from 'sonner';
