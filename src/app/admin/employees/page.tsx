"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Search,
  Mail,
  Phone,
  Calendar,
  Building,
  Briefcase,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Department {
  id: number;
  name: string;
}

interface Position {
  id: number;
  name: string;
  departmentId: number;
}

interface Role {
  id: number;
  name: string;
}

interface Employee {
  id: number;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  gender: "male" | "female";
  dateOfBirth: string | null;
  hireDate: string;
  departmentId: number;
  positionId: number;
  roleId: number;
  managerId: number | null;
  salary: number | null;
  address: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  isActive: boolean;
  department: Department | null;
  position: Position | null;
  role: Role | null;
  manager: { id: number; firstName: string; lastName: string } | null;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deleteEmployee, setDeleteEmployee] = useState<Employee | null>(null);
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null);

  // Form state
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    gender: "male" as "male" | "female",
    dateOfBirth: "",
    hireDate: new Date().toISOString().split("T")[0],
    departmentId: "",
    positionId: "",
    roleId: "",
    managerId: "",
    salary: "",
    address: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
    fetchPositions();
    fetchRoles();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees");
      const data = await res.json();
      setEmployees(data);
    } catch (error) {
      toast.error("Erreur lors du chargement des employés");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    const res = await fetch("/api/departments");
    const data = await res.json();
    setDepartments(data);
  };

  const fetchPositions = async () => {
    const res = await fetch("/api/positions");
    const data = await res.json();
    setPositions(data);
  };

  const fetchRoles = async () => {
    const res = await fetch("/api/roles");
    const data = await res.json();
    setRoles(data);
  };

  const filteredPositions = form.departmentId
    ? positions.filter((p) => p.departmentId === parseInt(form.departmentId))
    : positions;

  const potentialManagers = employees.filter(
    (e) =>
      e.id !== editingEmployee?.id &&
      (e.role?.name === "RH" ||
        e.role?.name === "Manager" ||
        e.role?.name === "Admin")
  );

  const resetForm = () => {
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      phone: "",
      gender: "male",
      dateOfBirth: "",
      hireDate: new Date().toISOString().split("T")[0],
      departmentId: "",
      positionId: "",
      roleId: "",
      managerId: "",
      salary: "",
      address: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      isActive: true,
    });
    setEditingEmployee(null);
  };

  const openSheet = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      setForm({
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        password: "",
        phone: employee.phone || "",
        gender: employee.gender,
        dateOfBirth: employee.dateOfBirth
          ? new Date(employee.dateOfBirth).toISOString().split("T")[0]
          : "",
        hireDate: new Date(employee.hireDate).toISOString().split("T")[0],
        departmentId: employee.departmentId.toString(),
        positionId: employee.positionId.toString(),
        roleId: employee.roleId.toString(),
        managerId: employee.managerId?.toString() || "",
        salary: employee.salary?.toString() || "",
        address: employee.address || "",
        emergencyContactName: employee.emergencyContactName || "",
        emergencyContactPhone: employee.emergencyContactPhone || "",
        isActive: employee.isActive,
      });
    } else {
      resetForm();
    }
    setIsSheetOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !form.firstName ||
      !form.lastName ||
      !form.email ||
      !form.departmentId ||
      !form.positionId ||
      !form.roleId
    ) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (!editingEmployee && !form.password) {
      toast.error("Le mot de passe est requis pour un nouvel employé");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password || undefined,
        phone: form.phone || null,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth || null,
        hireDate: form.hireDate,
        departmentId: parseInt(form.departmentId),
        positionId: parseInt(form.positionId),
        roleId: parseInt(form.roleId),
        managerId: form.managerId ? parseInt(form.managerId) : null,
        salary: form.salary ? parseFloat(form.salary) : null,
        address: form.address || null,
        emergencyContactName: form.emergencyContactName || null,
        emergencyContactPhone: form.emergencyContactPhone || null,
        isActive: form.isActive,
      };

      const res = editingEmployee
        ? await fetch(`/api/employees/${editingEmployee.id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
            headers: { "Content-Type": "application/json" },
          })
        : await fetch("/api/employees", {
            method: "POST",
            body: JSON.stringify(payload),
            headers: { "Content-Type": "application/json" },
          });

      if (res.ok) {
        toast.success(
          editingEmployee
            ? "Employé modifié avec succès"
            : "Employé créé avec succès"
        );
        setIsSheetOpen(false);
        resetForm();
        fetchEmployees();
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
    if (!deleteEmployee) return;

    try {
      const res = await fetch(`/api/employees/${deleteEmployee.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Employé supprimé avec succès");
        fetchEmployees();
      } else {
        const error = await res.json();
        toast.error(error.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteEmployee(null);
    }
  };

  // Filter employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment =
      filterDepartment === "all" ||
      emp.departmentId.toString() === filterDepartment;
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && emp.isActive) ||
      (filterStatus === "inactive" && !emp.isActive);

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  // Statistics
  const activeCount = employees.filter((e) => e.isActive).length;
  const inactiveCount = employees.filter((e) => !e.isActive).length;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Employés</h1>
          <p className="text-muted-foreground">
            Gérez les employés de votre organisation
          </p>
        </div>
        <Button onClick={() => openSheet()}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel employé
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Employés
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Actifs</CardTitle>
            <Badge variant="default" className="bg-green-500">
              {activeCount}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Inactifs</CardTitle>
            <Badge variant="secondary">{inactiveCount}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {inactiveCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, email ou matricule..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={filterDepartment}
              onValueChange={setFilterDepartment}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Département" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les départements</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="inactive">Inactifs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des employés ({filteredEmployees.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">Chargement...</div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun employé trouvé.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employé</TableHead>
                  <TableHead>Matricule</TableHead>
                  <TableHead>Département</TableHead>
                  <TableHead>Poste</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {getInitials(employee.firstName, employee.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {employee.firstName} {employee.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {employee.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{employee.employeeNumber}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {employee.department?.name || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell>{employee.position?.name || "-"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          employee.role?.name === "Admin"
                            ? "destructive"
                            : employee.role?.name === "RH"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {employee.role?.name || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={employee.isActive ? "default" : "secondary"}
                      >
                        {employee.isActive ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setViewEmployee(employee)}
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openSheet(employee)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => setDeleteEmployee(employee)}
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
        <SheetContent className="w-[500px] sm:max-w-[500px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editingEmployee ? "Modifier l'employé" : "Nouvel employé"}
            </SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            {/* Personal Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground">
                Informations personnelles
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input
                    id="firstName"
                    value={form.firstName}
                    onChange={(e) =>
                      setForm({ ...form, firstName: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input
                    id="lastName"
                    value={form.lastName}
                    onChange={(e) =>
                      setForm({ ...form, lastName: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">
                    Mot de passe {!editingEmployee && "*"}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    placeholder={
                      editingEmployee ? "Laisser vide pour ne pas changer" : ""
                    }
                    required={!editingEmployee}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gender">Genre *</Label>
                  <Select
                    value={form.gender}
                    onValueChange={(value: "male" | "female") =>
                      setForm({ ...form, gender: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Homme</SelectItem>
                      <SelectItem value="female">Femme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date de naissance</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) =>
                      setForm({ ...form, dateOfBirth: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hireDate">Date d&apos;embauche *</Label>
                  <Input
                    id="hireDate"
                    type="date"
                    value={form.hireDate}
                    onChange={(e) =>
                      setForm({ ...form, hireDate: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Textarea
                  id="address"
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  rows={2}
                />
              </div>
            </div>

            {/* Work Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground">
                Informations professionnelles
              </h3>

              <div className="space-y-2">
                <Label htmlFor="departmentId">Département *</Label>
                <Select
                  value={form.departmentId}
                  onValueChange={(value) =>
                    setForm({ ...form, departmentId: value, positionId: "" })
                  }
                >
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
                <Label htmlFor="positionId">Poste *</Label>
                <Select
                  value={form.positionId}
                  onValueChange={(value) =>
                    setForm({ ...form, positionId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un poste" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredPositions.map((pos) => (
                      <SelectItem key={pos.id} value={pos.id.toString()}>
                        {pos.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="roleId">Rôle *</Label>
                  <Select
                    value={form.roleId}
                    onValueChange={(value) =>
                      setForm({ ...form, roleId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary">Salaire (€)</Label>
                  <Input
                    id="salary"
                    type="number"
                    value={form.salary}
                    onChange={(e) =>
                      setForm({ ...form, salary: e.target.value })
                    }
                    min="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="managerId">Manager</Label>
                <Select
                  value={form.managerId}
                  onValueChange={(value) =>
                    setForm({ ...form, managerId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un manager (optionnel)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucun</SelectItem>
                    {potentialManagers.map((mgr) => (
                      <SelectItem key={mgr.id} value={mgr.id.toString()}>
                        {mgr.firstName} {mgr.lastName} ({mgr.role?.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={form.isActive}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, isActive: checked })
                  }
                />
                <Label htmlFor="isActive">Employé actif</Label>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground">
                Contact d&apos;urgence
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactName">Nom</Label>
                  <Input
                    id="emergencyContactName"
                    value={form.emergencyContactName}
                    onChange={(e) =>
                      setForm({ ...form, emergencyContactName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactPhone">Téléphone</Label>
                  <Input
                    id="emergencyContactPhone"
                    value={form.emergencyContactPhone}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        emergencyContactPhone: e.target.value,
                      })
                    }
                  />
                </div>
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
                  : editingEmployee
                  ? "Modifier"
                  : "Créer"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* View Employee Dialog */}
      <AlertDialog
        open={!!viewEmployee}
        onOpenChange={() => setViewEmployee(null)}
      >
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="text-lg">
                  {viewEmployee &&
                    getInitials(viewEmployee.firstName, viewEmployee.lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div>
                  {viewEmployee?.firstName} {viewEmployee?.lastName}
                </div>
                <div className="text-sm font-normal text-muted-foreground">
                  {viewEmployee?.employeeNumber}
                </div>
              </div>
            </AlertDialogTitle>
          </AlertDialogHeader>

          {viewEmployee && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{viewEmployee.email}</span>
                </div>
                {viewEmployee.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{viewEmployee.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Embauché le{" "}
                    {format(new Date(viewEmployee.hireDate), "d MMMM yyyy", {
                      locale: fr,
                    })}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span>{viewEmployee.department?.name || "-"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span>{viewEmployee.position?.name || "-"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Badge
                    variant={viewEmployee.isActive ? "default" : "secondary"}
                  >
                    {viewEmployee.isActive ? "Actif" : "Inactif"}
                  </Badge>
                  <Badge>{viewEmployee.role?.name}</Badge>
                </div>
              </div>
              {viewEmployee.address && (
                <div className="col-span-2 text-sm">
                  <span className="text-muted-foreground">Adresse:</span>{" "}
                  {viewEmployee.address}
                </div>
              )}
              {(viewEmployee.emergencyContactName ||
                viewEmployee.emergencyContactPhone) && (
                <div className="col-span-2 text-sm">
                  <span className="text-muted-foreground">
                    Contact d&apos;urgence:
                  </span>{" "}
                  {viewEmployee.emergencyContactName}{" "}
                  {viewEmployee.emergencyContactPhone &&
                    `- ${viewEmployee.emergencyContactPhone}`}
                </div>
              )}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Fermer</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setViewEmployee(null);
                openSheet(viewEmployee!);
              }}
            >
              Modifier
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteEmployee}
        onOpenChange={() => setDeleteEmployee(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera définitivement l&apos;employé{" "}
              <strong>
                {deleteEmployee?.firstName} {deleteEmployee?.lastName}
              </strong>
              . Cette action est irréversible.
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
