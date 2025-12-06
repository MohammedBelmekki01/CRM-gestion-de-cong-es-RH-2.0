"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Briefcase,
  Users,
  DollarSign,
} from "lucide-react";

interface Department {
  id: number;
  name: string;
}

interface Position {
  id: number;
  name: string;
  departmentId: number;
  description: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  department: Department;
  _count: {
    employees: number;
  };
}

export default function PositionsPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [deletePosition, setDeletePosition] = useState<Position | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [description, setDescription] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPositions();
    fetchDepartments();
  }, []);

  const fetchPositions = async () => {
    try {
      const res = await fetch("/api/positions");
      const data = await res.json();
      setPositions(data);
    } catch (error) {
      toast.error("Erreur lors du chargement des postes");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/departments");
      const data = await res.json();
      setDepartments(data);
    } catch (error) {
      toast.error("Erreur lors du chargement des départements");
    }
  };

  const resetForm = () => {
    setName("");
    setDepartmentId("");
    setDescription("");
    setSalaryMin("");
    setSalaryMax("");
    setEditingPosition(null);
  };

  const openSheet = (position?: Position) => {
    if (position) {
      setEditingPosition(position);
      setName(position.name);
      setDepartmentId(position.departmentId.toString());
      setDescription(position.description || "");
      setSalaryMin(position.salaryMin?.toString() || "");
      setSalaryMax(position.salaryMax?.toString() || "");
    } else {
      resetForm();
    }
    setIsSheetOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !departmentId) {
      toast.error("Veuillez remplir les champs obligatoires");
      return;
    }

    // Validate salary range
    if (
      salaryMin &&
      salaryMax &&
      parseFloat(salaryMin) > parseFloat(salaryMax)
    ) {
      toast.error(
        "Le salaire minimum ne peut pas être supérieur au salaire maximum"
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        departmentId: parseInt(departmentId),
        description: description.trim() || null,
        salaryMin: salaryMin ? parseFloat(salaryMin) : null,
        salaryMax: salaryMax ? parseFloat(salaryMax) : null,
      };

      const res = editingPosition
        ? await fetch(`/api/positions/${editingPosition.id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
            headers: { "Content-Type": "application/json" },
          })
        : await fetch("/api/positions", {
            method: "POST",
            body: JSON.stringify(payload),
            headers: { "Content-Type": "application/json" },
          });

      if (res.ok) {
        toast.success(
          editingPosition
            ? "Poste modifié avec succès"
            : "Poste créé avec succès"
        );
        setIsSheetOpen(false);
        resetForm();
        fetchPositions();
      } else {
        const error = await res.json();
        toast.error(error.error || "Erreur lors de l'enregistrement");
      }
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletePosition) return;

    try {
      const res = await fetch(`/api/positions/${deletePosition.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Poste supprimé avec succès");
        fetchPositions();
      } else {
        const error = await res.json();
        toast.error(error.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeletePosition(null);
    }
  };

  const formatSalary = (amount: number | null) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate statistics
  const totalPositions = positions.length;
  const totalEmployees = positions.reduce(
    (acc, pos) => acc + pos._count.employees,
    0
  );
  const avgSalary = positions
    .filter((p) => p.salaryMin && p.salaryMax)
    .reduce((acc, p, _, arr) => {
      const avg = ((p.salaryMin || 0) + (p.salaryMax || 0)) / 2;
      return acc + avg / arr.length;
    }, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Postes</h1>
          <p className="text-muted-foreground">
            Gérez les postes de votre organisation
          </p>
        </div>
        <Button onClick={() => openSheet()}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau poste
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Postes</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPositions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Employés Assignés
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Salaire Moyen</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatSalary(avgSalary)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Positions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des postes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">Chargement...</div>
          ) : positions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun poste trouvé. Créez votre premier poste.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Département</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Salaire Min</TableHead>
                  <TableHead>Salaire Max</TableHead>
                  <TableHead>Employés</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((position) => (
                  <TableRow key={position.id}>
                    <TableCell className="font-medium">
                      {position.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {position.department.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {position.description || "-"}
                    </TableCell>
                    <TableCell>{formatSalary(position.salaryMin)}</TableCell>
                    <TableCell>{formatSalary(position.salaryMax)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {position._count.employees}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openSheet(position)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => setDeletePosition(position)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {editingPosition ? "Modifier le poste" : "Nouveau poste"}
            </SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du poste *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Développeur Full Stack"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Département *</Label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un département" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez les responsabilités du poste..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salaryMin">Salaire Min (€)</Label>
                <Input
                  id="salaryMin"
                  type="number"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                  placeholder="30000"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salaryMax">Salaire Max (€)</Label>
                <Input
                  id="salaryMax"
                  type="number"
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(e.target.value)}
                  placeholder="50000"
                  min="0"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSheetOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Enregistrement..."
                  : editingPosition
                  ? "Modifier"
                  : "Créer"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletePosition}
        onOpenChange={() => setDeletePosition(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera définitivement le poste &quot;
              {deletePosition?.name}&quot;.
              {deletePosition?._count.employees ? (
                <span className="block mt-2 text-destructive font-medium">
                  Attention: {deletePosition._count.employees} employé(s) sont
                  assignés à ce poste.
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
