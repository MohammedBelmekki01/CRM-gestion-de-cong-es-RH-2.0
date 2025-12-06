"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, differenceInBusinessDays } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  CalendarIcon,
  ArrowLeft,
  AlertCircle,
  FileText,
  Upload,
  X,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import Link from "next/link";

interface LeaveType {
  id: number;
  name: string;
  description: string | null;
  maxDaysPerYear: number | null;
  maxDaysPerMonth: number | null;
  genderRestriction: string;
  requiresMedicalCertificate: boolean;
  color: string;
}

interface LeaveBalance {
  id: number;
  leaveTypeId: number;
  remainingDays: number;
  allocatedDays: number;
  leaveType: {
    id: number;
    name: string;
  };
}

const formSchema = z
  .object({
    leaveTypeId: z.string().min(1, "Veuillez sélectionner un type de congé"),
    startDate: z.date({ required_error: "La date de début est requise" }),
    endDate: z.date({ required_error: "La date de fin est requise" }),
    isHalfDay: z.boolean(),
    halfDayPeriod: z.enum(["morning", "afternoon"]).optional().nullable(),
    reason: z.string().optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "La date de fin doit être après la date de début",
    path: ["endDate"],
  })
  .refine((data) => !data.isHalfDay || data.halfDayPeriod, {
    message: "Veuillez sélectionner la période (matin ou après-midi)",
    path: ["halfDayPeriod"],
  });

type FormValues = z.infer<typeof formSchema>;

export default function NewLeaveRequestPage() {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [selectedType, setSelectedType] = useState<LeaveType | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      leaveTypeId: "",
      reason: "",
      isHalfDay: false,
      halfDayPeriod: null,
    },
  });

  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");
  const isHalfDay = form.watch("isHalfDay");

  const daysRequested =
    startDate && endDate
      ? isHalfDay
        ? 0.5
        : differenceInBusinessDays(endDate, startDate) + 1
      : 0;

  useEffect(() => {
    async function fetchData() {
      try {
        const [typesRes, balancesRes] = await Promise.all([
          fetch("/api/leave-types"),
          fetch("/api/leave-balances"),
        ]);

        if (typesRes.ok) {
          const typesData = await typesRes.json();
          // Filter by gender restriction
          const filteredTypes = typesData.filter((type: LeaveType) => {
            if (type.genderRestriction === "all") return true;
            return type.genderRestriction === user?.gender;
          });
          setLeaveTypes(filteredTypes);
        }

        if (balancesRes.ok) {
          const balancesData = await balancesRes.json();
          setBalances(balancesData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchData();
    }
  }, [user]);

  const getBalance = (leaveTypeId: number) => {
    return balances.find((b) => b.leaveTypeId === leaveTypeId);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      const validTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
      ];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name}: Type de fichier non autorisé`);
        return false;
      }
      if (file.size > maxSize) {
        toast.error(`${file.name}: Fichier trop volumineux (max 5MB)`);
        return false;
      }
      return true;
    });

    setSelectedFiles((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (leaveRequestId: number) => {
    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("leaveRequestId", leaveRequestId.toString());

      await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
    }
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);

    try {
      const balance = getBalance(parseInt(values.leaveTypeId));

      if (balance && daysRequested > balance.remainingDays) {
        toast.error("Solde insuffisant pour cette demande");
        setSubmitting(false);
        return;
      }

      // Check if medical certificate is required
      if (
        selectedType?.requiresMedicalCertificate &&
        selectedFiles.length === 0
      ) {
        toast.error("Un certificat médical est requis pour ce type de congé");
        setSubmitting(false);
        return;
      }

      const response = await fetch("/api/leave-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaveTypeId: parseInt(values.leaveTypeId),
          startDate: values.startDate.toISOString(),
          endDate: values.isHalfDay
            ? values.startDate.toISOString()
            : values.endDate.toISOString(),
          daysRequested,
          isHalfDay: values.isHalfDay,
          halfDayPeriod: values.halfDayPeriod || null,
          reason: values.reason || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de la création");
      }

      const leaveRequest = await response.json();

      // Upload files if any
      if (selectedFiles.length > 0) {
        await uploadFiles(leaveRequest.id);
      }

      toast.success("Demande de congé créée avec succès");
      router.push("/dashboard/employee");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erreur lors de la création de la demande";
      toast.error(message);
    } finally {
      setSubmitting(false);
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/employee">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Nouvelle demande de congé
          </h1>
          <p className="text-muted-foreground">
            Remplissez le formulaire pour soumettre votre demande
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Informations de la demande</CardTitle>
            <CardDescription>
              Sélectionnez le type de congé et les dates souhaitées
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="leaveTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de congé</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          const type = leaveTypes.find(
                            (t) => t.id === parseInt(value)
                          );
                          setSelectedType(type || null);
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un type de congé" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {leaveTypes.map((type) => {
                            const balance = getBalance(type.id);
                            return (
                              <SelectItem
                                key={type.id}
                                value={type.id.toString()}
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: type.color }}
                                  />
                                  {type.name}
                                  {balance && (
                                    <span className="text-xs text-muted-foreground">
                                      ({balance.remainingDays} jours restants)
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date de début</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: fr })
                                ) : (
                                  <span>Sélectionnez une date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date() ||
                                date.getDay() === 0 ||
                                date.getDay() === 6
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date de fin</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: fr })
                                ) : (
                                  <span>Sélectionnez une date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < (startDate || new Date()) ||
                                date.getDay() === 0 ||
                                date.getDay() === 6
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Half-day option */}
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  <FormField
                    control={form.control}
                    name="isHalfDay"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between space-y-0">
                        <div className="space-y-0.5">
                          <FormLabel>Demi-journée</FormLabel>
                          <FormDescription>
                            Demander seulement une demi-journée de congé
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              if (checked && startDate) {
                                form.setValue("endDate", startDate);
                              }
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {isHalfDay && (
                    <FormField
                      control={form.control}
                      name="halfDayPeriod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Période</FormLabel>
                          <Select
                            value={field.value || undefined}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez la période" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="morning">
                                Matin (8h - 12h)
                              </SelectItem>
                              <SelectItem value="afternoon">
                                Après-midi (14h - 18h)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motif (optionnel)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Décrivez le motif de votre demande..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Ajoutez des informations supplémentaires si nécessaire
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* File Upload Section */}
                <div className="space-y-3">
                  <Label>Pièces jointes (optionnel)</Label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Ajouter des fichiers
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      PDF, Images, Documents (max 5MB par fichier)
                    </span>
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className="space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-muted rounded-md"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{file.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Pour les congés maladie, veuillez joindre un certificat
                    médical.
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Envoi en cours..." : "Soumettre la demande"}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href="/dashboard/employee">Annuler</Link>
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Sidebar with info */}
        <div className="space-y-4">
          {/* Days Summary */}
          {daysRequested > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Résumé</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{daysRequested}</div>
                <p className="text-xs text-muted-foreground">
                  jour(s) ouvrable(s) demandé(s)
                </p>
              </CardContent>
            </Card>
          )}

          {/* Selected Leave Type Info */}
          {selectedType && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: selectedType.color }}
                  />
                  {selectedType.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedType.description && (
                  <p className="text-sm text-muted-foreground">
                    {selectedType.description}
                  </p>
                )}

                {selectedType.maxDaysPerYear && (
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline">
                      Max: {selectedType.maxDaysPerYear} jours/an
                    </Badge>
                  </div>
                )}

                {selectedType.requiresMedicalCertificate && (
                  <div className="flex items-center gap-2 text-sm text-amber-600">
                    <FileText className="h-4 w-4" />
                    Certificat médical requis
                  </div>
                )}

                {(() => {
                  const balance = getBalance(selectedType.id);
                  if (balance) {
                    const insufficient = daysRequested > balance.remainingDays;
                    return (
                      <div
                        className={cn(
                          "rounded-lg p-3 text-sm",
                          insufficient
                            ? "bg-red-50 text-red-700"
                            : "bg-green-50 text-green-700"
                        )}
                      >
                        {insufficient ? (
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            Solde insuffisant ({balance.remainingDays} jours
                            restants)
                          </div>
                        ) : (
                          <div>
                            Solde disponible: {balance.remainingDays} jours
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
