"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Appelle l'API pour savoir qui est connecté
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(data => {
        if (data.user?.role?.name === "RH") {
          router.replace("/dashboard/hr");
        } else {
          router.replace("/dashboard/employee");
        }
      });
  }, [router]);

  return <div>Redirection...</div>;
}