"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface Position {
  id: number;
  name: string;
}

export default function PositionsPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [newPosition, setNewPosition] = useState("");

  useEffect(() => {
    fetchPositions();
  }, []);

  const fetchPositions = async () => {
    const res = await fetch("/api/positions");
    const data = await res.json();
    setPositions(data);
  };

  const createPosition = async () => {
    if (!newPosition.trim()) return;
    const res = await fetch("/api/positions", {
      method: "POST",
      body: JSON.stringify({ name: newPosition }),
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      setNewPosition("");
      fetchPositions();
    } else {
      const error = await res.json();
      alert(error.error || "Erreur lors de la création");
    }
  };

  const deletePosition = async (id: number) => {
    const res = await fetch(`/api/positions?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchPositions();
    } else {
      const error = await res.json();
      alert(error.error || "Erreur lors de la suppression");
    }
  };

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Postes</h1>

      <div className="flex gap-2 mb-6">
        <Input
          placeholder="Nom du poste"
          value={newPosition}
          onChange={(e) => setNewPosition(e.target.value)}
        />
        <Button onClick={createPosition}>Ajouter</Button>
      </div>

      <ul className="space-y-2">
        {positions.map((pos) => (
          <li key={pos.id} className="flex justify-between items-center border px-4 py-2 rounded">
            <span>{pos.name}</span>
            <Button className="bg-red-600 hover:bg-red-700" onClick={() => deletePosition(pos.id)}>
              Supprimer
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
