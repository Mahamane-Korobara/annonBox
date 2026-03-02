export const metadata = {
  title: "Hors ligne | AnonBox",
  description: "Vous êtes hors ligne. Reconnectez-vous pour continuer.",
};

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-surface-light dark:bg-background-dark flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-2xl p-6 text-center space-y-3">
        <h1 className="text-2xl font-black">Vous êtes hors ligne</h1>
        <p className="text-sm text-text-muted-light">
          La connexion internet est indisponible. Réessayez quand votre réseau revient.
        </p>
      </div>
    </main>
  );
}
