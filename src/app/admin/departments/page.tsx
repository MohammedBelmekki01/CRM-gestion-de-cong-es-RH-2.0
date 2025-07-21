"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface Department {
  id: number;
  name: string;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [newDept, setNewDept] = useState("");

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    const res = await fetch("/api/departments");
    const data = await res.json();
    setDepartments(data);
  };

  const createDepartment = async () => {
    const res = await fetch("/api/departments", {
      method: "POST",
      body: JSON.stringify({ name: newDept }),
    });
    if (res.ok) {
      setNewDept("");
      fetchDepartments();
    }
  };

  const deleteDepartment = async (id: number) => {
    await fetch(`/api/departments/${id}`, { method: "DELETE" });
    fetchDepartments();
  };

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Départements</h1>

      <div className="flex gap-2 mb-6">
        <Input
          placeholder="Nom du département"
          value={newDept}
          onChange={(e) => setNewDept(e.target.value)}
        />
        <Button onClick={createDepartment}>Ajouter</Button>
      </div>

      <ul className="space-y-2">
        {departments.map((dept) => (
          <li key={dept.id} className="flex justify-between items-center border px-4 py-2 rounded">
            <span>{dept.name}</span>
            <Button className="bg-red-600 hover:bg-red-700" onClick={() => deleteDepartment(dept.id)}>
              Supprimer
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
