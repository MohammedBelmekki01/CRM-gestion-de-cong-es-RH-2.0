"use client";
import { useEffect, useState } from "react";

export default function LeaveTypesPage() {
  const [leaveTypes, setLeaveTypes] = useState([]);

  useEffect(() => {
    fetch("/api/leave-types")
      .then(res => res.json())
      .then(data => setLeaveTypes(data));
  }, []);

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Types de congés</h1>
      <ul className="space-y-2">
        {leaveTypes.map((type: any) => (
          <li key={type.id} className="border px-4 py-2 rounded">
            {type.name}
          </li>
        ))}
      </ul>
    </div>
  );
}