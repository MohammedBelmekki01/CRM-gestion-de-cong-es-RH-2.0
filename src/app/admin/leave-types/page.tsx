"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, Plus, Pencil, Trash2, FileText } from "lucide-react";

interface LeaveType {
  id: number;
  name: string;
  description: string | null;
  maxDaysPerYear: number | null;
  maxDaysPerMonth: number | null;
  maxTimesPerMonth: number | null;
  genderRestriction: string;
  requiresMedicalCertificate: boolean;
  color: string;
  isActive: boolean;
}

const COLORS = [
  { value: "#10B981", label: "Vert" },
  { value: "#3B82F6", label: "Bleu" },
  { value: "#EF4444", label: "Rouge" },
  { value: "#F59E0B", label: "Orange" },
  { value: "#8B5CF6", label: "Violet" },
  { value: "#EC4899", label: "Rose" },
  { value: "#6B7280", label: "Gris" },
];

export default function LeaveTypesPage() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LeaveType | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    maxDaysPerYear: "",
    maxDaysPerMonth: "",
    genderRestriction: "all",
    requiresMedicalCertificate: false,
    color: "#3B82F6",
    isActive: true,
  });

  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  const fetchLeaveTypes = async () => {
    try {
      const res = await fetch("/api/leave-types");
      const data = await res.json();
      setLeaveTypes(data);
    } catch (error) {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (type?: LeaveType) => {
    if (type) {
      setEditing(type);
      setForm({
        name: type.name,
        description: type.description || "",
        maxDaysPerYear: type.maxDaysPerYear?.toString() || "",
        maxDaysPerMonth: type.maxDaysPerMonth?.toString() || "",
        genderRestriction: type.genderRestriction,
        requiresMedicalCertificate: type.requiresMedicalCertificate,
        color: type.color,
        isActive: type.isActive,
      });
    } else {
      setEditing(null);
      setForm({
        name: "",
        description: "",
        maxDaysPerYear: "",
        maxDaysPerMonth: "",
        genderRestriction: "all",
        requiresMedicalCertificate: false,
        color: "#3B82F6",
        isActive: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Le nom est requis");
      return;
    }

    setSaving(true);
    try {
      const url = editing
        ? `/api/leave-types/${editing.id}`
        : "/api/leave-types";
      const method = editing ? "PUT" : "POST";

      const payload = {
        name: form.name,
        description: form.description || null,
        maxDaysPerYear: form.maxDaysPerYear
          ? parseInt(form.maxDaysPerYear)
          : null,
        maxDaysPerMonth: form.maxDaysPerMonth
          ? parseInt(form.maxDaysPerMonth)
          : null,
        genderRestriction: form.genderRestriction,
        requiresMedicalCertificate: form.requiresMedicalCertificate,
        color: form.color,
        isActive: form.isActive,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editing ? "Type de congé modifié" : "Type de congé créé");
        setDialogOpen(false);
        fetchLeaveTypes();
      } else {
        const error = await res.json();
        toast.error(error.error || "Erreur lors de l'opération");
      }
    } catch (error) {
      toast.error("Erreur lors de l'opération");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/leave-types/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Type de congé supprimé");
        fetchLeaveTypes();
      } else {
        const error = await res.json();
        toast.error(error.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const getGenderLabel = (gender: string) => {
    switch (gender) {
      case "male":
        return "Hommes uniquement";
      case "female":
        return "Femmes uniquement";
      default:
        return "Tous";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Types de congés</h1>
          <p className="text-muted-foreground">
            Configurez les différents types de congés disponibles
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau type
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editing
                  ? "Modifier le type de congé"
                  : "Nouveau type de congé"}
              </DialogTitle>
              <DialogDescription>
                Configurez les paramètres du type de congé
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nom *</label>
                <Input
                  placeholder="Ex: Congé annuel"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Description du type de congé"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max jours/an</label>
                  <Input
                    type="number"
                    placeholder="Ex: 18"
                    value={form.maxDaysPerYear}
                    onChange={(e) =>
                      setForm({ ...form, maxDaysPerYear: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max jours/mois</label>
                  <Input
                    type="number"
                    placeholder="Ex: 2"
                    value={form.maxDaysPerMonth}
                    onChange={(e) =>
                      setForm({ ...form, maxDaysPerMonth: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Restriction genre</label>
                <Select
                  value={form.genderRestriction}
                  onValueChange={(value) =>
                    setForm({ ...form, genderRestriction: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="male">Hommes uniquement</SelectItem>
                    <SelectItem value="female">Femmes uniquement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Couleur</label>
                <Select
                  value={form.color}
                  onValueChange={(value) => setForm({ ...form, color: value })}
                >
                  <SelectTrigger>
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-4 w-4 rounded"
                          style={{ backgroundColor: form.color }}
                        />
                        {COLORS.find((c) => c.value === form.color)?.label}
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {COLORS.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-4 w-4 rounded"
                            style={{ backgroundColor: color.value }}
                          />
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">
                    Certificat médical requis
                  </label>
                  <p className="text-xs text-muted-foreground">
                    L&apos;employé devra fournir un justificatif
                  </p>
                </div>
                <Switch
                  checked={form.requiresMedicalCertificate}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, requiresMedicalCertificate: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Actif</label>
                  <p className="text-xs text-muted-foreground">
                    Les employés peuvent demander ce type de congé
                  </p>
                </div>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, isActive: checked })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? "Enregistrement..." : editing ? "Modifier" : "Créer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Liste des types de congés
          </CardTitle>
          <CardDescription>
            {leaveTypes.length} type(s) de congé
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leaveTypes.length === 0 ? (
            <div className="text-center py-8">
              <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2 text-muted-foreground">
                Aucun type de congé configuré
              </p>
              <Button className="mt-4" onClick={() => openDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Créer un type
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Max/an</TableHead>
                  <TableHead>Restriction</TableHead>
                  <TableHead>Certificat</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: type.color }}
                        />
                        <span className="font-medium">{type.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {type.maxDaysPerYear
                        ? `${type.maxDaysPerYear} jours`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getGenderLabel(type.genderRestriction)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {type.requiresMedicalCertificate ? (
                        <FileText className="h-4 w-4 text-amber-500" />
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={type.isActive ? "default" : "secondary"}>
                        {type.isActive ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDialog(type)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Supprimer ce type de congé?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Cette action est irréversible. Cela peut
                                affecter les demandes existantes.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(type.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
