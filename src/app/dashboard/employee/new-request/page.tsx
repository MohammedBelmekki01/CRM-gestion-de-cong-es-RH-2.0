"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

interface LeaveType {
  id: number;
  name: string;
  maxDaysPerYear: number | null;
  genderRestriction: string;
}

export default function NewRequestPage() {
  const router = useRouter();
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [form, setForm] = useState({
    leaveTypeId: "",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/leave-types")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setLeaveTypes(data);
      });
  }, []);

  const days =
    form.startDate && form.endDate
      ? Math.max(
          0,
          Math.ceil(
            (new Date(form.endDate).getTime() -
              new Date(form.startDate).getTime()) /
              (1000 * 60 * 60 * 24),
          ) + 1,
        )
      : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const res = await fetch("/api/leave-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leaveTypeId: Number(form.leaveTypeId),
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason,
      }),
    });

    if (res.ok) {
      router.push("/dashboard/employee");
    } else {
      const data = await res.json();
      setError(data.error || "Erreur lors de la creation");
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">
          Nouvelle demande de conge
        </h1>
        <p className="text-sm text-muted mt-1">
          Remplissez les informations ci-dessous
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="px-3 py-2 text-sm text-danger bg-danger-light rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Type de conge
              </label>
              <Select
                value={form.leaveTypeId}
                onChange={(e) =>
                  setForm({ ...form, leaveTypeId: e.target.value })
                }
                required
              >
                <option value="">Selectionnez un type</option>
                {leaveTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                    {t.maxDaysPerYear ? ` (max ${t.maxDaysPerYear}j/an)` : ""}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Date de debut"
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
                required
              />
              <Input
                label="Date de fin"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                min={form.startDate}
                required
              />
            </div>

            {days > 0 && (
              <p className="text-sm text-muted">
                Duree:{" "}
                <span className="font-medium text-foreground">
                  {days} jour(s)
                </span>
              </p>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Raison
              </label>
              <textarea
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                rows={3}
                required
                className="w-full px-3 py-2.5 border border-border rounded-[10px] bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                placeholder="Motif de votre demande"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Envoi..." : "Soumettre"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
