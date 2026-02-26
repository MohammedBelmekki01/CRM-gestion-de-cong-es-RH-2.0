import LoginForm from "@/components/forms/LoginForm";

export default function Home() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-[#F0EFEB]">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg px-8 py-10">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-foreground text-white flex items-center justify-center font-bold text-lg">
              RH
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-foreground mb-1">
            Bon retour !
          </h1>
          <p className="text-center text-muted text-sm mb-8">
            Connectez-vous pour accéder à votre espace
          </p>
          <LoginForm />
        </div>
        <p className="text-center text-xs text-muted mt-6">
          &copy; {new Date().getFullYear()} GestionRH &mdash; Tous droits réservés
        </p>
      </div>
    </main>
  );
}
