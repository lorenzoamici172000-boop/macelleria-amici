export const metadata = { title: 'Cookie Policy' };

export default function CookiePolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-display mb-8" style={{ fontFamily: 'var(--font-display)' }}>
        Cookie Policy
      </h1>
      <div className="font-body text-sm text-foreground/80 space-y-4">
        <h2 className="text-lg font-semibold">Cosa sono i cookie</h2>
        <p>I cookie sono piccoli file di testo salvati sul dispositivo dell&apos;utente durante la navigazione.</p>
        <h2 className="text-lg font-semibold mt-6">Cookie utilizzati</h2>
        <p><strong>Cookie tecnici (necessari):</strong> cookie di sessione per l&apos;autenticazione, cookie di preferenza lingua. Questi cookie sono strettamente necessari al funzionamento del sito.</p>
        <p><strong>Cookie statistici first-party:</strong> utilizziamo un sistema di statistiche proprietario che non condivide dati con terze parti. Questi dati sono aggregati e anonimi.</p>
        <h2 className="text-lg font-semibold mt-6">Gestione dei cookie</h2>
        <p>L&apos;utente può gestire le preferenze relative ai cookie direttamente dal proprio browser.</p>
        <p className="text-xs text-muted-foreground mt-8">
          Questa è un&apos;informativa predefinita. Deve essere personalizzata dal titolare del trattamento.
        </p>
      </div>
    </div>
  );
}
