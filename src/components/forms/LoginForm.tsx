"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginInput } from "@/lib/validations";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

export default function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStatus, setForgotStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [forgotMessage, setForgotMessage] = useState("");
  const router = useRouter();

  const onSubmit = async (data: LoginInput) => {
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        router.push("/dashboard");
      } else {
        const json = await res.json();
        setError(json.error || "Identifiants incorrects");
      }
    } catch {
      setError("Erreur de connexion au serveur");
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) return;
    setForgotStatus("loading");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const json = await res.json();
      if (res.ok) {
        setForgotStatus("success");
        setForgotMessage(json.message || "Un e-mail de réinitialisation a été envoyé.");
      } else {
        setForgotStatus("error");
        setForgotMessage(json.error || "Erreur lors de la réinitialisation.");
      }
    } catch {
      setForgotStatus("error");
      setForgotMessage("Erreur de connexion au serveur.");
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {error && (
          <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
            Adresse e-mail
          </label>
          <input
            id="email"
            type="email"
            placeholder="nom@entreprise.com"
            className="w-full bg-transparent border-b-2 border-slate-300 px-0 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-foreground transition-colors"
            {...register("email")}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
            Mot de passe
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="w-full bg-transparent border-b-2 border-slate-300 px-0 py-2 pr-10 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-foreground transition-colors"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-foreground focus:ring-foreground"
            />
            <span className="text-sm text-muted">Se souvenir 30 jours</span>
          </label>
          <button
            type="button"
            onClick={() => { setForgotOpen(true); setForgotStatus("idle"); setForgotMessage(""); }}
            className="text-sm text-muted hover:text-foreground transition-colors underline"
          >
            Mot de passe oublié ?
          </button>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-foreground text-white rounded-full py-2.5 text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          Se connecter
        </button>
      </form>

      <Modal open={forgotOpen} onClose={() => setForgotOpen(false)} title="Mot de passe oublié">
        {forgotStatus === "success" ? (
          <div className="text-center py-4">
            <p className="text-success font-medium">{forgotMessage}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Entrez votre adresse e-mail et nous vous enverrons un mot de passe temporaire.
            </p>
            <input
              type="email"
              placeholder="nom@entreprise.com"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            {forgotStatus === "error" && (
              <p className="text-red-500 text-sm">{forgotMessage}</p>
            )}
            <button
              onClick={handleForgotPassword}
              disabled={forgotStatus === "loading" || !forgotEmail}
              className="w-full bg-foreground text-white rounded-full py-2.5 text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {forgotStatus === "loading" && <Loader2 size={16} className="animate-spin" />}
              Réinitialiser
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}
