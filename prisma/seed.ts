import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// Get credentials from environment variables (with defaults for backward compatibility)
const DEMO_ADMIN_EMAIL = process.env.DEMO_ADMIN_EMAIL || "admin@entreprise.com";
const DEMO_ADMIN_PASSWORD = process.env.DEMO_ADMIN_PASSWORD || "admin123";
const DEMO_EMPLOYEE1_EMAIL =
  process.env.DEMO_EMPLOYEE1_EMAIL || "jean.dupont@entreprise.com";
const DEMO_EMPLOYEE2_EMAIL =
  process.env.DEMO_EMPLOYEE2_EMAIL || "marie.martin@entreprise.com";

async function main() {
  console.log("🌱 Début du seeding...");

  // Nettoyage des données existantes
  await prisma.leaveBalance.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.userSession.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.position.deleteMany();
  await prisma.department.deleteMany();
  await prisma.role.deleteMany();
  await prisma.leaveType.deleteMany();

  // Création des départements
  const departments = await Promise.all([
    prisma.department.create({
      data: {
        name: "Ressources Humaines",
        description: "Gestion du personnel, recrutement et formation",
      },
    }),
    prisma.department.create({
      data: {
        name: "Développement",
        description: "Développement logiciel et applications",
      },
    }),
    prisma.department.create({
      data: {
        name: "Marketing",
        description: "Promotion, communication et relations publiques",
      },
    }),
    prisma.department.create({
      data: {
        name: "Finance",
        description: "Gestion financière et comptabilité",
      },
    }),
    prisma.department.create({
      data: {
        name: "Support Client",
        description: "Assistance et support technique aux clients",
      },
    }),
  ]);

  console.log("✅ Départements créés");

  // Création des postes
  const positions = await Promise.all([
    // RH
    prisma.position.create({
      data: {
        name: "Directeur RH",
        departmentId: departments[0].id,
        description: "Direction des ressources humaines",
        salaryMin: 60000,
        salaryMax: 80000,
      },
    }),
    prisma.position.create({
      data: {
        name: "Responsable Recrutement",
        departmentId: departments[0].id,
        description: "Gestion des recrutements",
        salaryMin: 40000,
        salaryMax: 55000,
      },
    }),
    // Développement
    prisma.position.create({
      data: {
        name: "Développeur Senior",
        departmentId: departments[1].id,
        description: "Développement et architecture logicielle",
        salaryMin: 50000,
        salaryMax: 70000,
      },
    }),
    prisma.position.create({
      data: {
        name: "Développeur Junior",
        departmentId: departments[1].id,
        description: "Développement sous supervision",
        salaryMin: 30000,
        salaryMax: 45000,
      },
    }),
    prisma.position.create({
      data: {
        name: "Chef de Projet",
        departmentId: departments[1].id,
        description: "Gestion et coordination des projets",
        salaryMin: 45000,
        salaryMax: 65000,
      },
    }),
    // Marketing
    prisma.position.create({
      data: {
        name: "Responsable Marketing",
        departmentId: departments[2].id,
        description: "Stratégie marketing et communication",
        salaryMin: 45000,
        salaryMax: 60000,
      },
    }),
    // Finance
    prisma.position.create({
      data: {
        name: "Comptable",
        departmentId: departments[3].id,
        description: "Gestion comptable et financière",
        salaryMin: 35000,
        salaryMax: 50000,
      },
    }),
    // Support
    prisma.position.create({
      data: {
        name: "Technicien Support",
        departmentId: departments[4].id,
        description: "Support technique niveau 1",
        salaryMin: 25000,
        salaryMax: 35000,
      },
    }),
  ]);

  console.log("✅ Postes créés");

  // Création des rôles
  const roles = await Promise.all([
    prisma.role.create({
      data: {
        name: "Admin",
        description: "Administrateur système avec tous les droits",
        permissions: JSON.stringify({ all: true }),
      },
    }),
    prisma.role.create({
      data: {
        name: "RH",
        description: "Ressources Humaines - Gestion des employés et congés",
        permissions: JSON.stringify({
          manage_employees: true,
          manage_leaves: true,
          view_all_leaves: true,
          manage_departments: true,
          manage_positions: true,
          manage_leave_types: true,
        }),
      },
    }),
    prisma.role.create({
      data: {
        name: "Manager",
        description: "Manager d'équipe - Validation des congés de son équipe",
        permissions: JSON.stringify({
          view_team_leaves: true,
          approve_team_leaves: true,
          view_own_profile: true,
          manage_team: true,
        }),
      },
    }),
    prisma.role.create({
      data: {
        name: "Employee",
        description: "Employé standard - Gestion de ses propres congés",
        permissions: JSON.stringify({
          create_leave_request: true,
          view_own_leaves: true,
          view_own_profile: true,
          edit_own_profile: true,
        }),
      },
    }),
  ]);

  console.log("✅ Rôles créés");

  // Création des types de congés
  const leaveTypes = await Promise.all([
    prisma.leaveType.create({
      data: {
        name: "Congé Annuel",
        description: "Congés payés annuels",
        maxDaysPerYear: 18,
        genderRestriction: "all",
        requiresMedicalCertificate: false,
        color: "#10B981",
      },
    }),
    prisma.leaveType.create({
      data: {
        name: "Congé Maladie",
        description: "Arrêt maladie",
        genderRestriction: "all",
        requiresMedicalCertificate: true,
        color: "#EF4444",
      },
    }),
    prisma.leaveType.create({
      data: {
        name: "Congé Récupération",
        description: "Récupération d'heures supplémentaires",
        maxDaysPerMonth: 2,
        maxTimesPerMonth: 1,
        genderRestriction: "all",
        requiresMedicalCertificate: false,
        color: "#F59E0B",
      },
    }),
    prisma.leaveType.create({
      data: {
        name: "Congé Paternité",
        description: "Congé de paternité",
        maxDaysPerYear: 3,
        genderRestriction: "male",
        requiresMedicalCertificate: false,
        color: "#3B82F6",
      },
    }),
    prisma.leaveType.create({
      data: {
        name: "Congé Maternité",
        description: "Congé de maternité",
        maxDaysPerYear: 120,
        genderRestriction: "female",
        requiresMedicalCertificate: true,
        color: "#EC4899",
      },
    }),
    prisma.leaveType.create({
      data: {
        name: "Événements Familiaux",
        description: "Congés pour événements familiaux",
        maxDaysPerYear: 4,
        genderRestriction: "all",
        requiresMedicalCertificate: false,
        color: "#8B5CF6",
      },
    }),
  ]);

  console.log("✅ Types de congés créés");

  // Création des employés
  const hashedPassword = await bcrypt.hash(DEMO_ADMIN_PASSWORD, 10);

  const employees = await Promise.all([
    // Admin RH
    prisma.employee.create({
      data: {
        employeeNumber: "EMP001",
        firstName: "Admin",
        lastName: "RH",
        email: DEMO_ADMIN_EMAIL,
        password: hashedPassword,
        gender: "male",
        hireDate: new Date("2023-01-01"),
        departmentId: departments[0].id,
        positionId: positions[0].id,
        roleId: roles[1].id, // RH
        salary: 65000,
      },
    }),
    // Employé standard
    prisma.employee.create({
      data: {
        employeeNumber: "EMP002",
        firstName: "Jean",
        lastName: "Dupont",
        email: DEMO_EMPLOYEE1_EMAIL,
        password: hashedPassword,
        gender: "male",
        hireDate: new Date("2023-06-15"),
        departmentId: departments[1].id,
        positionId: positions[2].id,
        roleId: roles[3].id, // Employee
        salary: 55000,
      },
    }),
    // Employée femme pour tester la maternité
    prisma.employee.create({
      data: {
        employeeNumber: "EMP003",
        firstName: "Marie",
        lastName: "Martin",
        email: DEMO_EMPLOYEE2_EMAIL,
        password: hashedPassword,
        gender: "female",
        hireDate: new Date("2023-03-10"),
        departmentId: departments[2].id,
        positionId: positions[5].id,
        roleId: roles[3].id, // Employee
        salary: 48000,
      },
    }),
  ]);

  console.log("✅ Employés créés");

  // Création des soldes de congés pour 2024
  const currentYear = new Date().getFullYear();

  for (const employee of employees) {
    for (const leaveType of leaveTypes) {
      // Vérifier les restrictions de genre
      if (
        leaveType.genderRestriction !== "all" &&
        leaveType.genderRestriction !== employee.gender
      ) {
        continue;
      }

      let allocatedDays = 0;

      if (leaveType.maxDaysPerYear) {
        allocatedDays = leaveType.maxDaysPerYear;
      } else if (leaveType.maxDaysPerMonth) {
        allocatedDays = leaveType.maxDaysPerMonth * 12;
      } else {
        // Pour les congés illimités comme la maladie, on met 0
        allocatedDays = 0;
      }

      if (allocatedDays > 0) {
        await prisma.leaveBalance.create({
          data: {
            employeeId: employee.id,
            leaveTypeId: leaveType.id,
            year: currentYear,
            allocatedDays: allocatedDays,
            usedDays: 0,
            remainingDays: allocatedDays,
          },
        });
      }
    }
  }

  console.log("✅ Soldes de congés créés");

  console.log("🎉 Seeding terminé avec succès !");
  console.log("📧 Comptes de test créés :");
  console.log("   - admin@entreprise.com (RH)");
  console.log("   - jean.dupont@entreprise.com (Employé)");
  console.log("   - marie.martin@entreprise.com (Employé)");
  console.log("   - Mot de passe pour tous : admin123");
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
