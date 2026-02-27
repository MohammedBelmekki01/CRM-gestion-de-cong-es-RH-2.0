"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginInput } from "@/lib/validations";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";
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
  const [forgotStatus, setForgotStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
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
        setForgotMessage(
          json.message || "Un e-mail de reinitialisation a ete envoye.",
        );
      } else {
        setForgotStatus("error");
        setForgotMessage(json.error || "Erreur lors de la reinitialisation.");
      }
    } catch {
      setForgotStatus("error");
      setForgotMessage("Erreur de connexion au serveur.");
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-8">
          {error && (
            <div
              role="alert"
              className="flex items-center gap-3 bg-[#dc2626]/10 border border-[#dc2626]/20 rounded-lg px-4 py-3"
            >
              <svg
                className="w-4 h-4 text-[#f87171] shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
              <p className="text-[13px] text-[#f87171]">{error}</p>
            </div>
          )}

          {/* Email */}
          <div className="space-y-2.5">
            <label
              htmlFor="email"
              className="block text-[13px] font-medium text-[#9ca3af]"
            >
              E-mail
            </label>
            <div
              className={`flex items-center gap-3 h-[48px] rounded-lg bg-[#1a1d23] px-3.5 border transition-all duration-150 ${
                errors.email
                  ? "border-[#dc2626] focus-within:ring-2 focus-within:ring-[#dc2626]/15"
                  : "border-[#2a2d35] focus-within:border-[#2563eb] focus-within:ring-2 focus-within:ring-[#2563eb]/15"
              }`}
            >
              <Mail size={16} className="text-[#4b5563] shrink-0" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="Entrez votre adresse e-mail"
                className="flex-1 bg-transparent text-[14px] text-white placeholder:text-[#4b5563] outline-none min-w-0"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-[#f87171] text-[12px]">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2.5">
            <label
              htmlFor="password"
              className="block text-[13px] font-medium text-[#9ca3af]"
            >
              Mot de passe
            </label>
            <div
              className={`flex items-center gap-3 h-[48px] rounded-lg bg-[#1a1d23] px-3.5 border transition-all duration-150 ${
                errors.password
                  ? "border-[#dc2626] focus-within:ring-2 focus-within:ring-[#dc2626]/15"
                  : "border-[#2a2d35] focus-within:border-[#2563eb] focus-within:ring-2 focus-within:ring-[#2563eb]/15"
              }`}
            >
              <Lock size={16} className="text-[#4b5563] shrink-0" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Entrez votre mot de passe"
                className="flex-1 bg-transparent text-[14px] text-white placeholder:text-[#4b5563] outline-none min-w-0"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[#4b5563] hover:text-[#9ca3af] transition-colors focus:outline-none shrink-0"
                tabIndex={-1}
                aria-label={
                  showPassword
                    ? "Masquer le mot de passe"
                    : "Afficher le mot de passe"
                }
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-[#f87171] text-[12px]">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-[16px] h-[16px] rounded border-[#2a2d35] bg-[#1a1d23] text-[#2563eb] focus:ring-[#2563eb]/20 focus:ring-offset-0 focus:ring-offset-[#0f1117]"
              />
              <span className="text-[13px] text-[#6b7280]">
                Se souvenir de moi
              </span>
            </label>
            <button
              type="button"
              onClick={() => {
                setForgotOpen(true);
                setForgotStatus("idle");
                setForgotMessage("");
              }}
              className="text-[13px] text-[#2563eb] hover:text-[#60a5fa] font-medium transition-colors focus:outline-none focus-visible:underline"
            >
              Mot de passe oublie ?
            </button>
          </div>

          {/* Submit */}
          <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-[48px] bg-[#2563eb] text-white rounded-lg text-[14px] font-semibold hover:bg-[#3b82f6] active:bg-[#1d4ed8] transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            Se connecter
          </button>
          </div>
        </div>
      </form>

      {/* Forgot-password modal */}
      <Modal
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        title="Reinitialiser le mot de passe"
      >
        {forgotStatus === "success" ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-[#ecfdf5] mx-auto mb-3 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-[#059669]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-[#059669] font-medium text-sm">
              {forgotMessage}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-[13px] text-[#64748b] leading-relaxed">
              Entrez votre adresse e-mail. Nous vous enverrons un mot de passe
              temporaire.
            </p>
            <div>
              <label
                htmlFor="forgot-email"
                className="block text-[13px] font-medium text-[#334155] mb-1.5"
              >
                Adresse e-mail
              </label>
              <input
                id="forgot-email"
                type="email"
                placeholder="Adresse e-mail"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="w-full h-[46px] rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-4 text-[14px] text-[#0f172a] placeholder:text-[#94a3b8] outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10 transition-all"
              />
            </div>
            {forgotStatus === "error" && (
              <p className="text-[#dc2626] text-[13px]">{forgotMessage}</p>
            )}
            <button
              onClick={handleForgotPassword}
              disabled={forgotStatus === "loading" || !forgotEmail}
              className="w-full h-[44px] bg-[#2563eb] text-white rounded-lg text-[14px] font-semibold hover:bg-[#3b82f6] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {forgotStatus === "loading" && (
                <Loader2 size={16} className="animate-spin" />
              )}
              Envoyer
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}
