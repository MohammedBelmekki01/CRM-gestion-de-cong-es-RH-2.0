"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardRedirect() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      if (user.role?.name === "RH" || user.role?.name === "Admin") {
        router.replace("/dashboard/hr");
      } else {
        router.replace("/dashboard/employee");
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-muted-foreground">Redirection...</div>
    </div>
  );
}
