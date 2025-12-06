"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  Building2,
  Briefcase,
  Calendar,
  Shield,
  Edit,
  Save,
  X,
} from "lucide-react";

const profileSchema = z.object({
  phone: z.string().optional(),
  address: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface EmployeeProfile {
  id: number;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  gender: string;
  dateOfBirth: string | null;
  hireDate: string;
  address: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  department: { name: string };
  position: { name: string };
  role: { name: string };
}

export default function EmployeeProfilePage() {
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      phone: "",
      address: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
    },
  });

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setProfile(data.user);
          form.reset({
            phone: data.user.phone || "",
            address: data.user.address || "",
            emergencyContactName: data.user.emergencyContactName || "",
            emergencyContactPhone: data.user.emergencyContactPhone || "",
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Erreur lors du chargement du profil");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [form]);

  const onSubmit = async (values: ProfileFormValues) => {
    if (!profile) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/employees/${profile.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        toast.success("Profil mis à jour");
        setEditing(false);
        refreshUser();
        // Refresh profile data
        const updatedRes = await fetch("/api/auth/me");
        if (updatedRes.ok) {
          const data = await updatedRes.json();
          setProfile(data.user);
        }
      } else {
        toast.error("Erreur lors de la mise à jour");
      }
    } catch {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-[300px] md:col-span-1" />
          <Skeleton className="h-[300px] md:col-span-2" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return <div>Erreur lors du chargement du profil</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mon profil</h1>
        <p className="text-muted-foreground">
          Consultez et modifiez vos informations personnelles
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-2xl">
                  {profile.firstName[0]}
                  {profile.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <h2 className="mt-4 text-xl font-semibold">
                {profile.firstName} {profile.lastName}
              </h2>
              <p className="text-sm text-muted-foreground">
                {profile.employeeNumber}
              </p>
              <Badge className="mt-2" variant="secondary">
                <Shield className="mr-1 h-3 w-3" />
                {profile.role.name}
              </Badge>

              <Separator className="my-4" />

              <div className="w-full space-y-3 text-left">
                <div className="flex items-center gap-3 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.department.name}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.position.name}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Embauché le {formatDate(profile.hireDate)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Informations personnelles</CardTitle>
                <CardDescription>
                  Vos coordonnées et informations de contact
                </CardDescription>
              </div>
              {!editing ? (
                <Button variant="outline" onClick={() => setEditing(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </Button>
              ) : (
                <Button variant="ghost" onClick={() => setEditing(false)}>
                  <X className="mr-2 h-4 w-4" />
                  Annuler
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Prénom</label>
                    <Input value={profile.firstName} disabled />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nom</label>
                    <Input value={profile.lastName} disabled />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input value={profile.email} disabled />
                  </div>
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Téléphone</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={!editing}
                            placeholder="Votre numéro de téléphone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={!editing}
                          placeholder="Votre adresse"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <div>
                  <h3 className="text-sm font-medium mb-4">
                    Contact d&apos;urgence
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="emergencyContactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom du contact</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={!editing}
                              placeholder="Nom complet"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="emergencyContactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Téléphone du contact</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={!editing}
                              placeholder="Numéro de téléphone"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {editing && (
                  <div className="flex justify-end">
                    <Button type="submit" disabled={saving}>
                      <Save className="mr-2 h-4 w-4" />
                      {saving ? "Enregistrement..." : "Enregistrer"}
                    </Button>
                  </div>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
