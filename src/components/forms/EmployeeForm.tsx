'use client';

import { useEffect, useState } from 'react';

export default function EmployeeForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    departmentId: '',
    roleId: '',
  });

  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const dep = await fetch('/api/departments').then(res => res.json());
      const rol = await fetch('/api/roles').then(res => res.json());
      setDepartments(dep);
      setRoles(rol);
    };
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/employees', {
      method: 'POST',
      body: JSON.stringify({
        ...form,
        departmentId: parseInt(form.departmentId),
        roleId: parseInt(form.roleId),
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    if (res.ok) {
      onSuccess();
      setForm({ firstName: '', lastName: '', email: '', password: '', departmentId: '', roleId: '' });
    } else {
      console.error('Erreur lors de la création');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded shadow">
      <h3 className="text-lg font-semibold">Créer un nouvel employé</h3>
      <input name="firstName" value={form.firstName} onChange={handleChange} placeholder="Prénom" className="border p-2 w-full" required />
      <input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Nom" className="border p-2 w-full" required />
      <input name="email" value={form.email} onChange={handleChange} placeholder="Email" type="email" className="border p-2 w-full" required />
      <input name="password" value={form.password} onChange={handleChange} placeholder="Mot de passe" type="password" className="border p-2 w-full" required />

      <select name="departmentId" value={form.departmentId} onChange={handleChange} className="border p-2 w-full" required>
        <option value="">-- Choisir un département --</option>
        {departments.map((dep: any) => (
          <option key={dep.id} value={dep.id}>{dep.name}</option>
        ))}
      </select>

      <select name="roleId" value={form.roleId} onChange={handleChange} className="border p-2 w-full" required>
        <option value="">-- Choisir un rôle --</option>
        {roles.map((role: any) => (
          <option key={role.id} value={role.id}>{role.name}</option>
        ))}
      </select>

      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Créer</button>
    </form>
  );
}
