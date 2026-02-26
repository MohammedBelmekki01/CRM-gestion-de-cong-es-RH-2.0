"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Loader2 } from "lucide-react";

interface Department { id: number; name: string; }
interface Role { id: number; name: string; }
interface Position { id: number; name: string; departmentId: number; }

interface EmployeeFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

export default function EmployeeForm({ onSuccess, onCancel }: EmployeeFormProps) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    gender: "male",
    hireDate: new Date().toISOString().split("T")[0],
    departmentId: "",
    positionId: "",
    roleId: "",
  });

  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const [depRes, rolRes, posRes] = await Promise.all([
        fetch("/api/departments"),
        fetch("/api/roles"),
        fetch("/api/positions"),
      ]);
      setDepartments(await depRes.json());
      setRoles(await rolRes.json());
      setPositions(await posRes.json());
    };
    fetchData();
  }, []);

  const filteredPositions = form.departmentId
    ? positions.filter((p) => p.departmentId === parseInt(form.departmentId))
    : positions;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "departmentId") next.positionId = "";
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          departmentId: parseInt(form.departmentId),
          positionId: parseInt(form.positionId),
          roleId: parseInt(form.roleId),
        }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const json = await res.json();
        setError(json.error || "Erreur lors de la création");
      }
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input label="Prénom" name="firstName" value={form.firstName} onChange={handleChange} required />
        <Input label="Nom" name="lastName" value={form.lastName} onChange={handleChange} required />
      </div>

      <Input label="E-mail" name="email" type="email" value={form.email} onChange={handleChange} required />
      <Input label="Mot de passe" name="password" type="password" value={form.password} onChange={handleChange} required />

      <div className="grid grid-cols-2 gap-4">
        <Input label="Téléphone" name="phone" value={form.phone} onChange={handleChange} />
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Genre</label>
          <Select name="gender" value={form.gender} onChange={handleChange}>
            <option value="male">Homme</option>
            <option value="female">Femme</option>
          </Select>
        </div>
      </div>

      <Input label="Date d'embauche" name="hireDate" type="date" value={form.hireDate} onChange={handleChange} required />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Département</label>
          <Select name="departmentId" value={form.departmentId} onChange={handleChange} required>
            <option value="">Choisir...</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Poste</label>
          <Select name="positionId" value={form.positionId} onChange={handleChange} required>
            <option value="">Choisir...</option>
            {filteredPositions.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Rôle</label>
        <Select name="roleId" value={form.roleId} onChange={handleChange} required>
          <option value="">Choisir...</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </Select>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 size={16} className="animate-spin mr-2" />}
          Créer l&apos;employé
        </Button>
      </div>
    </form>
  );
}
