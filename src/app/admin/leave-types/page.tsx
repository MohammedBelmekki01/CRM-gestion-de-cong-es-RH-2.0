"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface LeaveType {
  id: number;
  name: string;
  description: string | null;
  maxDaysPerYear: number | null;
  maxDaysPerMonth: number | null;
  maxTimesPerMonth: number | null;
  genderRestriction: string;
  requiresMedicalCertificate: boolean;
  color: string;
  isActive: boolean;
}

const defaultForm = {
  name: "",
  description: "",
  maxDaysPerYear: "",
  maxDaysPerMonth: "",
  maxTimesPerMonth: "",
  genderRestriction: "all",
  requiresMedicalCertificate: false,
  color: "#3B82F6",
  isActive: true,
};

export default function LeaveTypesPage() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LeaveType | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const fetchLeaveTypes = useCallback(async () => {
    try {
      const res = await fetch("/api/leave-types");
      const data = await res.json();
      setLeaveTypes(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaveTypes();
  }, [fetchLeaveTypes]);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setModalOpen(true);
  };

  const openEdit = (lt: LeaveType) => {
    setEditing(lt);
    setForm({
      name: lt.name,
      description: lt.description || "",
      maxDaysPerYear: lt.maxDaysPerYear ? String(lt.maxDaysPerYear) : "",
      maxDaysPerMonth: lt.maxDaysPerMonth ? String(lt.maxDaysPerMonth) : "",
      maxTimesPerMonth: lt.maxTimesPerMonth ? String(lt.maxTimesPerMonth) : "",
      genderRestriction: lt.genderRestriction,
      requiresMedicalCertificate: lt.requiresMedicalCertificate,
      color: lt.color,
      isActive: lt.isActive,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      name: form.name,
      description: form.description || null,
      maxDaysPerYear: form.maxDaysPerYear
        ? parseInt(form.maxDaysPerYear)
        : null,
      maxDaysPerMonth: form.maxDaysPerMonth
        ? parseInt(form.maxDaysPerMonth)
        : null,
      maxTimesPerMonth: form.maxTimesPerMonth
        ? parseInt(form.maxTimesPerMonth)
        : null,
      genderRestriction: form.genderRestriction,
      requiresMedicalCertificate: form.requiresMedicalCertificate,
      color: form.color,
      isActive: form.isActive,
    };

    const url = editing ? `/api/leave-types/${editing.id}` : "/api/leave-types";
    const method = editing ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    setModalOpen(false);
    fetchLeaveTypes();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer ce type de congé ?")) return;
    await fetch(`/api/leave-types/${id}`, { method: "DELETE" });
    fetchLeaveTypes();
  };

  const genderLabel = (g: string) => {
    if (g === "male") return "Hommes";
    if (g === "female") return "Femmes";
    return "Tous";
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Types de congés
          </h1>
          <p className="text-sm text-muted mt-1">
            {leaveTypes.length} type(s) configuré(s)
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} className="mr-2" />
          Ajouter
        </Button>
      </div>

      {leaveTypes.length === 0 ? (
        <EmptyState
          title="Aucun type de congé"
          description="Créez votre premier type de congé pour commencer."
          action={
            <Button onClick={openCreate}>
              <Plus size={16} className="mr-2" /> Ajouter
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {leaveTypes.map((lt) => (
            <Card key={lt.id} className="relative">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: lt.color }}
                  />
                  <h3 className="font-semibold text-foreground">{lt.name}</h3>
                </div>
                <Badge variant={lt.isActive ? "success" : "default"}>
                  {lt.isActive ? "Actif" : "Inactif"}
                </Badge>
              </div>

              {lt.description && (
                <p className="text-sm text-muted mb-3">{lt.description}</p>
              )}

              <div className="space-y-1 text-sm text-muted">
                {lt.maxDaysPerYear && <p>Max/an : {lt.maxDaysPerYear} jours</p>}
                {lt.maxDaysPerMonth && (
                  <p>Max/mois : {lt.maxDaysPerMonth} jours</p>
                )}
                <p>Genre : {genderLabel(lt.genderRestriction)}</p>
                {lt.requiresMedicalCertificate && (
                  <p className="text-warning">Certificat médical requis</p>
                )}
              </div>

              <div className="flex gap-2 mt-4 pt-3 border-t border-border">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEdit(lt)}
                >
                  <Pencil size={14} className="mr-1" /> Modifier
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(lt.id)}
                >
                  <Trash2 size={14} className="mr-1" /> Supprimer
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Modifier le type" : "Nouveau type de congé"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nom"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Max jours/an"
              type="number"
              value={form.maxDaysPerYear}
              onChange={(e) =>
                setForm({ ...form, maxDaysPerYear: e.target.value })
              }
            />
            <Input
              label="Max jours/mois"
              type="number"
              value={form.maxDaysPerMonth}
              onChange={(e) =>
                setForm({ ...form, maxDaysPerMonth: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Genre
              </label>
              <select
                className="w-full h-10 px-3 border border-border rounded-[10px] bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                value={form.genderRestriction}
                onChange={(e) =>
                  setForm({ ...form, genderRestriction: e.target.value })
                }
              >
                <option value="all">Tous</option>
                <option value="male">Hommes</option>
                <option value="female">Femmes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Couleur
              </label>
              <input
                type="color"
                className="w-full h-10 rounded-lg cursor-pointer"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.requiresMedicalCertificate}
              onChange={(e) =>
                setForm({
                  ...form,
                  requiresMedicalCertificate: e.target.checked,
                })
              }
              className="w-4 h-4 rounded border-border accent-primary"
            />
            <span className="text-sm">Certificat médical requis</span>
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={saving}>
              {editing ? "Enregistrer" : "Créer"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
