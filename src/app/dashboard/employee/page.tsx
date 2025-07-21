"use client";
import React, { useEffect, useState } from "react";

export default function EmployeeDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leave-requests")
      .then(res => res.json())
      .then(data => setRequests(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Mon tableau de bord</h1>
      <h2 className="text-lg font-semibold mb-2">Mes demandes de congés</h2>
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th>Type</th>
            <th>Période</th>
            <th>Jours</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r: any) => (
            <tr key={r.id}>
              <td>{r.leaveType?.name}</td>
              <td>
                {new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()}
              </td>
              <td>{r.daysRequested}</td>
              <td>
                <span className={
                  r.status === "approved" ? "text-green-600" :
                  r.status === "rejected" ? "text-red-600" :
                  "text-yellow-600"
                }>
                  {r.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}