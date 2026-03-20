'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-4xl font-bold text-red-600 mb-4">Errore</h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        Si è verificato un errore imprevisto. Riprova tra qualche istante.
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-3 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
      >
        Riprova
      </button>
    </div>
  );
}
