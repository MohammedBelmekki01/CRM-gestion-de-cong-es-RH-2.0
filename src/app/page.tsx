import LoginForm from "@/components/forms/LoginForm";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen">
      {/* ── Left: dark panel with form ── */}
      <div className="w-full lg:w-1/2 bg-[#0f1117] flex flex-col min-h-screen">
        {/* Logo top-left */}
        <div className="px-8 pt-8 sm:px-12 sm:pt-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#2563eb] flex items-center justify-center">
              <span className="text-white font-bold text-xs tracking-tight">
                RH
              </span>
            </div>
            <span className="text-white/90 font-semibold text-[15px]">
              GestionRH
            </span>
          </div>
        </div>

        {/* Centered form area */}
        <div className="flex-1 flex items-center justify-center px-8 sm:px-12 lg:px-16">
          <div className="w-full max-w-[380px]">
            {/* Heading */}
            <div className="mb-10">
              <h1 className="text-[26px] font-bold text-white tracking-tight leading-tight">
                Bon retour !
              </h1>
              <p className="text-[#6b7280] text-[14px] mt-2">
                Connectez-vous pour acceder a votre espace RH.
              </p>
            </div>

            <LoginForm />
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 pb-6 sm:px-12">
          <p className="text-[#3f3f46] text-[11px]">
            &copy; {new Date().getFullYear()} GestionRH &mdash; Tous droits
            reserves
          </p>
        </div>
      </div>

      {/* ── Right: image panel ── */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <Image
          src="/rh-hero.jpg"
          alt="Ressources Humaines"
          fill
          className="object-cover"
          priority
        />
        {/* Subtle dark overlay */}
        <div className="absolute inset-0 bg-black/20" />
        {/* Bottom-right text */}
        <div className="absolute bottom-8 right-8 left-8 text-right">
          <p className="text-white/80 text-sm font-medium">
            Gestion des Conges
          </p>
          <p className="text-white/50 text-xs mt-1">
            Plateforme de gestion des ressources humaines
          </p>
        </div>
      </div>
    </div>
  );
}
