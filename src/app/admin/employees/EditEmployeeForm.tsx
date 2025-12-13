'use client';

import { useState, useEffect } from 'react';

export default function EditEmployeeForm({ employee, onUpdated }: { employee: any, onUpdated: () => void }) {
  const [form, setForm] = useState(employee);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const deps = await fetch('/api/departments').then(res => res.json());
      const rols = await fetch('/api/roles').then(res => res.json());
      setDepartments(deps);
      setRoles(rols);
    };
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev: typeof employee) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/employees/${employee.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...form,
        departmentId: parseInt(form.departmentId),
        roleId: parseInt(form.roleId),
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    if (res.ok) {
      onUpdated();
    } else {
      console.error('Erreur lors de la mise à jour');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2 border p-4 rounded shadow bg-white mt-4">
      <h3 className="font-semibold">Modifier Employé : {employee.firstName}</h3>
      <input name="firstName" value={form.firstName} onChange={handleChange} className="border p-2 w-full" />
      <input name="lastName" value={form.lastName} onChange={handleChange} className="border p-2 w-full" />
      <input name="email" value={form.email} onChange={handleChange} className="border p-2 w-full" />
      <input name="password" value={form.password || ''} onChange={handleChange} className="border p-2 w-full" placeholder="Laisser vide pour ne pas changer" />

      <select name="departmentId" value={form.departmentId} onChange={handleChange} className="border p-2 w-full">
        {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
      </select>

      <select name="roleId" value={form.roleId} onChange={handleChange} className="border p-2 w-full">
        {roles.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
      </select>

      <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Enregistrer</button>
    </form>
  );
}
