"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CardSkeleton } from "@/components/ui/Skeleton";

interface Profile {
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
  manager: { firstName: string; lastName: string } | null;
  leaveBalances: {
    id: number;
    allocatedDays: number;
    usedDays: number;
    remainingDays: number;
    leaveType: { name: string; color: string };
  }[];
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    fetch("/api/employees/me")
      .then((res) => res.json())
      .then((data) => {
        setProfile(data);
        setPhone(data.phone || "");
        setAddress(data.address || "");
        setEmergencyName(data.emergencyContactName || "");
        setEmergencyPhone(data.emergencyContactPhone || "");
      })
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("fr-FR") : "-";

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/employees/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          address,
          emergencyContactName: emergencyName,
          emergencyContactPhone: emergencyPhone,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur");
      }
      setSuccess("Informations mises a jour avec succes");
      setEditing(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    if (newPassword.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caracteres");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/employees/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur");
      }
      setSuccess("Mot de passe modifie avec succes");
      setChangingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-foreground">Mon profil</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Mon profil</h1>
          <p className="text-sm text-muted mt-1">
            Vos informations personnelles
          </p>
        </div>
      </div>

      {(success || error) && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${success ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}
        >
          {success || error}
        </div>
      )}

      {/* Header card with avatar */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-semibold">
              {profile.firstName[0]}
              {profile.lastName[0]}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {profile.firstName} {profile.lastName}
              </h2>
              <p className="text-sm text-muted">
                {profile.position.name} — {profile.department.name}
              </p>
              <p className="text-xs text-muted mt-0.5">
                Matricule: {profile.employeeNumber} · {profile.role.name}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal information */}
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-foreground">
              Informations personnelles
            </h2>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Email</dt>
                <dd className="text-foreground">{profile.email}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Genre</dt>
                <dd className="text-foreground">
                  {profile.gender === "male" ? "Homme" : "Femme"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Date de naissance</dt>
                <dd className="text-foreground">
                  {formatDate(profile.dateOfBirth)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Date d&apos;embauche</dt>
                <dd className="text-foreground">
                  {formatDate(profile.hireDate)}
                </dd>
              </div>
              {profile.manager && (
                <div className="flex justify-between">
                  <dt className="text-muted">Responsable</dt>
                  <dd className="text-foreground">
                    {profile.manager.firstName} {profile.manager.lastName}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Contact info - editable */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Contact</h2>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs text-primary hover:underline"
                >
                  Modifier
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {editing ? (
              <div className="space-y-3">
                <Input
                  label="Telephone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <Input
                  label="Adresse"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
                <Input
                  label="Contact d'urgence - Nom"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                />
                <Input
                  label="Contact d'urgence - Tel"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                />
                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditing(false)}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Telephone</dt>
                  <dd className="text-foreground">{profile.phone || "-"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Adresse</dt>
                  <dd className="text-foreground max-w-[200px] text-right">
                    {profile.address || "-"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Urgence - Nom</dt>
                  <dd className="text-foreground">
                    {profile.emergencyContactName || "-"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Urgence - Tel</dt>
                  <dd className="text-foreground">
                    {profile.emergencyContactPhone || "-"}
                  </dd>
                </div>
              </dl>
            )}
          </CardContent>
        </Card>

        {/* Leave balances */}
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-foreground">
              Solde de conges {new Date().getFullYear()}
            </h2>
          </CardHeader>
          <CardContent>
            {profile.leaveBalances.length === 0 ? (
              <p className="text-sm text-muted">
                Aucun solde configure pour cette annee
              </p>
            ) : (
              <div className="space-y-3">
                {profile.leaveBalances.map((b) => {
                  const pct =
                    b.allocatedDays > 0
                      ? (b.usedDays / b.allocatedDays) * 100
                      : 0;
                  return (
                    <div key={b.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-foreground">
                          {b.leaveType.name}
                        </span>
                        <span className="text-muted">
                          {b.usedDays}/{b.allocatedDays}j
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(pct, 100)}%`,
                            backgroundColor: b.leaveType.color,
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted mt-0.5">
                        {b.remainingDays}j restants
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Password change */}
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-foreground">Securite</h2>
          </CardHeader>
          <CardContent>
            {changingPassword ? (
              <div className="space-y-3">
                <Input
                  label="Mot de passe actuel"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <Input
                  label="Nouveau mot de passe"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Input
                  label="Confirmer"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={handlePasswordChange}
                    disabled={saving}
                  >
                    {saving ? "Modification..." : "Modifier"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setChangingPassword(false);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-muted mb-3">
                  Vous pouvez modifier votre mot de passe ici.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setChangingPassword(true)}
                >
                  Changer le mot de passe
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
