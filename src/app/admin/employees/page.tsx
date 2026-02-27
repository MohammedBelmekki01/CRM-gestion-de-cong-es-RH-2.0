"use client";
import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import EmployeeForm from "@/components/forms/EmployeeForm";
import EditEmployeeForm from "@/app/admin/employees/EditEmployeeForm";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

type Employee = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  employeeNumber: string;
  phone: string | null;
  isActive: boolean;
  department: { name: string } | null;
  position: { name: string } | null;
  role: { name: string } | null;
};

export default function EmployeePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees");
      const data = await res.json();
      setEmployees(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cet employe ?")) return;
    await fetch(`/api/employees/${id}`, { method: "DELETE" });
    fetchEmployees();
  };

  const filtered = employees.filter((e) => {
    const q = search.toLowerCase();
    return (
      e.firstName.toLowerCase().includes(q) ||
      e.lastName.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      e.employeeNumber.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employes</h1>
          <p className="text-sm text-muted mt-1">
            {employees.length} employe(s) au total
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} className="mr-2" />
          Ajouter
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          type="text"
          placeholder="Rechercher un employe..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-9 pr-3 border border-border rounded-[10px] bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
      </div>

      {/* Table */}
      <Card>
        {filtered.length === 0 ? (
          <EmptyState
            title="Aucun employe trouve"
            description={
              search
                ? "Essayez un autre terme de recherche."
                : "Ajoutez votre premier employe."
            }
          />
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-6 font-medium text-muted">
                    Employe
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted">
                    Matricule
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted">
                    Departement
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted">
                    Poste
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted">
                    Role
                  </th>
                  <th className="text-right py-3 px-6 font-medium text-muted">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => (
                  <tr
                    key={emp.id}
                    className="border-b border-border last:border-0 hover:bg-background/60 transition-colors"
                  >
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium shrink-0">
                          {emp.firstName[0]}
                          {emp.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {emp.firstName} {emp.lastName}
                          </p>
                          <p className="text-xs text-muted">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted font-mono text-xs">
                      {emp.employeeNumber}
                    </td>
                    <td className="py-3 px-4 text-foreground">
                      {emp.department?.name || "—"}
                    </td>
                    <td className="py-3 px-4 text-foreground">
                      {emp.position?.name || "—"}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={emp.role?.name === "RH" ? "default" : "muted"}
                      >
                        {emp.role?.name || "—"}
                      </Badge>
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditing(emp)}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-danger hover:bg-danger-light"
                          onClick={() => handleDelete(emp.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Nouvel employe"
      >
        <EmployeeForm
          onSuccess={() => {
            setShowCreate(false);
            fetchEmployees();
          }}
        />
      </Modal>

      {/* Edit modal */}
      {editing && (
        <Modal
          open={!!editing}
          onClose={() => setEditing(null)}
          title="Modifier l'employe"
        >
          <EditEmployeeForm
            employee={editing}
            onUpdated={() => {
              setEditing(null);
              fetchEmployees();
            }}
          />
        </Modal>
      )}
    </div>
  );
}
