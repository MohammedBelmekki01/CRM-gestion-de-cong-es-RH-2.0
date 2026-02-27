"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { Plus, Pencil, Trash2, Briefcase } from "lucide-react";

interface Department {
  id: number;
  name: string;
}

interface Position {
  id: number;
  name: string;
  description: string | null;
  department: { id: number; name: string };
  _count?: { employees: number };
}

export default function PositionsPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [posRes, deptRes] = await Promise.all([
        fetch("/api/positions"),
        fetch("/api/departments"),
      ]);
      const posData = await posRes.json();
      const deptData = await deptRes.json();
      setPositions(Array.isArray(posData) ? posData : []);
      setDepartments(Array.isArray(deptData) ? deptData : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setName("");
    setDepartmentId("");
    setDescription("");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);

    const res = await fetch("/api/positions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        departmentId: departmentId ? Number(departmentId) : undefined,
        description: description || null,
      }),
    });

    if (res.ok) {
      setModalOpen(false);
      fetchData();
    } else {
      const err = await res.json();
      alert(err.error || "Erreur");
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer ce poste ?")) return;
    const res = await fetch(`/api/positions?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchData();
    } else {
      const err = await res.json();
      alert(err.error || "Erreur lors de la suppression");
    }
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
          <h1 className="text-2xl font-bold text-foreground">Postes</h1>
          <p className="text-sm text-muted mt-1">{positions.length} poste(s)</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} className="mr-2" />
          Ajouter
        </Button>
      </div>

      {positions.length === 0 ? (
        <EmptyState
          title="Aucun poste"
          description="Creez votre premier poste pour commencer."
          action={
            <Button onClick={openCreate}>
              <Plus size={16} className="mr-2" /> Ajouter
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {positions.map((pos) => (
            <Card key={pos.id}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                    <Briefcase size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {pos.name}
                    </h3>
                    {pos.department && (
                      <Badge variant="muted">{pos.department.name}</Badge>
                    )}
                  </div>
                </div>
              </div>

              {pos.description && (
                <p className="text-sm text-muted mb-3">{pos.description}</p>
              )}

              {pos._count && (
                <p className="text-xs text-muted mb-3">
                  {pos._count.employees} employe(s)
                </p>
              )}

              <div className="flex gap-2 pt-3 border-t border-border">
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(pos.id)}
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
        title="Nouveau poste"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nom du poste"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Departement
            </label>
            <Select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
            >
              <option value="">Aucun</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </div>
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
              Creer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
