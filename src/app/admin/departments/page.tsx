"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";

interface Department {
  id: number;
  name: string;
  description: string | null;
  _count?: { employees: number; positions: number };
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch("/api/departments");
      const data = await res.json();
      setDepartments(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setModalOpen(true);
  };

  const openEdit = (dept: Department) => {
    setEditing(dept);
    setName(dept.name);
    setDescription(dept.description || "");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);

    const url = editing ? `/api/departments/${editing.id}` : "/api/departments";
    const method = editing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: description || null }),
    });

    if (res.ok) {
      setModalOpen(false);
      fetchDepartments();
    } else {
      const err = await res.json();
      alert(err.error || "Erreur");
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer ce departement ?")) return;
    await fetch(`/api/departments/${id}`, { method: "DELETE" });
    fetchDepartments();
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Departements</h1>
          <p className="text-sm text-muted mt-1">
            {departments.length} departement(s)
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} className="mr-2" />
          Ajouter
        </Button>
      </div>

      {departments.length === 0 ? (
        <EmptyState
          title="Aucun departement"
          description="Creez votre premier departement pour commencer."
          action={
            <Button onClick={openCreate}>
              <Plus size={16} className="mr-2" /> Ajouter
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept) => (
            <Card key={dept.id}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary-light text-primary">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {dept.name}
                    </h3>
                    {dept._count && (
                      <p className="text-xs text-muted">
                        {dept._count.employees} employe(s) ·{" "}
                        {dept._count.positions} poste(s)
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {dept.description && (
                <p className="text-sm text-muted mb-3">{dept.description}</p>
              )}

              <div className="flex gap-2 pt-3 border-t border-border">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEdit(dept)}
                >
                  <Pencil size={14} className="mr-1" /> Modifier
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(dept.id)}
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
        title={editing ? "Modifier le departement" : "Nouveau departement"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Description (optionnel)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={saving}>
              {editing ? "Enregistrer" : "Creer"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
