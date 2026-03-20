import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-6xl font-bold text-muted-foreground mb-4">404</h1>
      <h2 className="text-2xl font-display mb-4" style={{ fontFamily: 'var(--font-display)' }}>
        Pagina non trovata
      </h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        La pagina che cerchi non esiste o è stata rimossa.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
      >
        Torna alla Home
      </Link>
    </div>
  );
}
