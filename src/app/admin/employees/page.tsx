"use client";
import React, { useEffect, useState } from "react";
import EmployeeForm from "@/components/forms/EmployeeForm";
import EditEmployeeForm from "@/app/admin/employees/EditEmployeeForm";

type Employee = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  employeeNumber: string;
  department: { name: string } | null;
  role: { name: string } | null;
};

export default function EmployeePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [editing, setEditing] = useState<Employee | null>(null);

  useEffect(() => {
    fetch("/api/employees")
      .then((res) => res.json())
      .then((data) => setEmployees(data));
  }, []);

  const refreshEmployees = async () => {
    const res = await fetch("/api/employees");
    const data = await res.json();
    setEmployees(data);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Gestion des employés</h1>
      <EmployeeForm onSuccess={refreshEmployees} />

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Liste des employés</h2>
        <ul className="space-y-2">
          {employees.map((emp) => (
            <li key={emp.id} className="border p-4 rounded shadow">
              <strong>
                {emp.firstName} {emp.lastName}
              </strong>
              <br />
              Email: {emp.email}
              <br />
              Matricule: {emp.employeeNumber}
              <br />
              Département: {emp.department?.name || "N/A"}
              <br />
              Rôle: {emp.role?.name || "N/A"}
              <div className="flex gap-4 mt-2">
                <button
                  onClick={() => setEditing(emp)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Modifier
                </button>
                <button
                  onClick={async () => {
                    await fetch(`/api/employees/${emp.id}`, { method: "DELETE" });
                    refreshEmployees();
                  }}
                  className="text-sm text-red-600 hover:underline"
                >
                  Supprimer
                </button>
              </div>
              {editing?.id === emp.id && (
                <EditEmployeeForm
                  employee={editing}
                  onUpdated={() => {
                    setEditing(null);
                    refreshEmployees();
                  }}
                />
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}