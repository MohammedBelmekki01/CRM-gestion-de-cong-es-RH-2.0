"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  CalendarDays,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Calendar,
  RefreshCcw,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const holidaySchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  date: z.string().min(1, "La date est requise"),
  description: z.string().optional(),
  isRecurring: z.boolean(),
});

type HolidayFormValues = z.infer<typeof holidaySchema>;

interface PublicHoliday {
  id: number;
  name: string;
  date: string;
  description: string | null;
  isRecurring: boolean;
  createdAt: string;
}

export default function PublicHolidaysPage() {
  const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<PublicHoliday | null>(
    null
  );
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<HolidayFormValues>({
    resolver: zodResolver(holidaySchema),
    defaultValues: {
      name: "",
      date: "",
      description: "",
      isRecurring: false,
    },
  });

  const isRecurring = watch("isRecurring");

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/public-holidays?year=${selectedYear}`);
      if (response.ok) {
        const data = await response.json();
        setHolidays(data);
      }
    } catch (error) {
      console.error("Error fetching holidays:", error);
      toast.error("Erreur lors du chargement des jours fériés");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, [selectedYear]);

  const onSubmit = async (data: HolidayFormValues) => {
    try {
      const url = editingHoliday
        ? `/api/public-holidays/${editingHoliday.id}`
        : "/api/public-holidays";
      const method = editingHoliday ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error);
      }

      toast.success(
        editingHoliday
          ? "Jour férié mis à jour avec succès"
          : "Jour férié créé avec succès"
      );
      setDialogOpen(false);
      setEditingHoliday(null);
      reset();
      fetchHolidays();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Une erreur est survenue"
      );
    }
  };

  const handleEdit = (holiday: PublicHoliday) => {
    setEditingHoliday(holiday);
    setValue("name", holiday.name);
    setValue("date", holiday.date.split("T")[0]);
    setValue("description", holiday.description || "");
    setValue("isRecurring", holiday.isRecurring);
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/public-holidays/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error);
      }

      toast.success("Jour férié supprimé avec succès");
      fetchHolidays();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la suppression"
      );
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingHoliday(null);
    reset();
  };

  // Seed French public holidays
  const seedFrenchHolidays = async () => {
    const frenchHolidays = [
      {
        name: "Jour de l'An",
        date: `${selectedYear}-01-01`,
        isRecurring: true,
      },
      {
        name: "Fête du Travail",
        date: `${selectedYear}-05-01`,
        isRecurring: true,
      },
      {
        name: "Victoire 1945",
        date: `${selectedYear}-05-08`,
        isRecurring: true,
      },
      {
        name: "Fête Nationale",
        date: `${selectedYear}-07-14`,
        isRecurring: true,
      },
      { name: "Assomption", date: `${selectedYear}-08-15`, isRecurring: true },
      { name: "Toussaint", date: `${selectedYear}-11-01`, isRecurring: true },
      { name: "Armistice", date: `${selectedYear}-11-11`, isRecurring: true },
      { name: "Noël", date: `${selectedYear}-12-25`, isRecurring: true },
    ];

    try {
      for (const holiday of frenchHolidays) {
        await fetch("/api/public-holidays", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(holiday),
        });
      }
      toast.success("Jours fériés français ajoutés avec succès");
      fetchHolidays();
    } catch (error) {
      toast.error("Erreur lors de l'ajout des jours fériés");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Calendar className="h-8 w-8" />
              Jours Fériés
            </h1>
            <p className="text-muted-foreground">
              Gérez les jours fériés pour le calcul des congés
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {[...Array(5)].map((_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
            <Button variant="outline" onClick={seedFrenchHolidays}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Ajouter jours fériés FR
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingHoliday(null);
                    reset();
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau jour férié
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingHoliday
                      ? "Modifier le jour férié"
                      : "Nouveau jour férié"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingHoliday
                      ? "Modifiez les informations du jour férié"
                      : "Ajoutez un nouveau jour férié au calendrier"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom</Label>
                    <Input
                      id="name"
                      placeholder="Ex: Jour de l'An"
                      {...register("name")}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500">
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" type="date" {...register("date")} />
                    {errors.date && (
                      <p className="text-sm text-red-500">
                        {errors.date.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (optionnel)</Label>
                    <Input
                      id="description"
                      placeholder="Description du jour férié"
                      {...register("description")}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isRecurring"
                      checked={isRecurring}
                      onCheckedChange={(checked) =>
                        setValue("isRecurring", checked as boolean)
                      }
                    />
                    <Label htmlFor="isRecurring" className="cursor-pointer">
                      Récurrent chaque année
                    </Label>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleDialogClose}
                    >
                      Annuler
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {editingHoliday ? "Mettre à jour" : "Créer"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Liste des jours fériés - {selectedYear}
            </CardTitle>
            <CardDescription>
              {holidays.length} jour(s) férié(s) enregistré(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : holidays.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun jour férié enregistré pour {selectedYear}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Récurrent</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holidays.map((holiday) => (
                    <TableRow key={holiday.id}>
                      <TableCell className="font-medium">
                        {holiday.name}
                      </TableCell>
                      <TableCell>
                        {format(new Date(holiday.date), "dd MMMM yyyy", {
                          locale: fr,
                        })}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {holiday.description || "-"}
                      </TableCell>
                      <TableCell>
                        {holiday.isRecurring ? (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Oui
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-400">
                            Non
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(holiday)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Supprimer ce jour férié ?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cette action est irréversible. Le jour férié "
                                  {holiday.name}" sera définitivement supprimé.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(holiday.id)}
                                  className="bg-red-500 hover:bg-red-600"
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
    </DashboardLayout>
  );
}
