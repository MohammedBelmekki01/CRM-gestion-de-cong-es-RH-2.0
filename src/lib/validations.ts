import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export const createEmployeeSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Adresse e-mail invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  phone: z.string().optional(),
  gender: z.enum(["male", "female"]),
  dateOfBirth: z.string().optional(),
  hireDate: z.string(),
  departmentId: z.number().int().positive(),
  positionId: z.number().int().positive(),
  roleId: z.number().int().positive(),
  managerId: z.number().int().positive().optional().nullable(),
  salary: z.number().positive().optional().nullable(),
  address: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial().omit({ password: undefined }).extend({
  password: z.string().min(6).optional(),
});

export const createLeaveRequestSchema = z.object({
  leaveTypeId: z.number().int().positive("Le type de congé est requis"),
  startDate: z.string().min(1, "La date de début est requise"),
  endDate: z.string().min(1, "La date de fin est requise"),
  reason: z.string().optional(),
});

export const leaveActionSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  rejectionReason: z.string().optional(),
});

export const createDepartmentSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
});

export const createLeaveTypeSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  maxDaysPerYear: z.number().int().positive().optional().nullable(),
  maxDaysPerMonth: z.number().int().positive().optional().nullable(),
  maxTimesPerMonth: z.number().int().positive().optional().nullable(),
  genderRestriction: z.enum(["male", "female", "all"]).optional(),
  requiresMedicalCertificate: z.boolean().optional(),
  color: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const createPositionSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  departmentId: z.number().int().positive("Le département est requis"),
  description: z.string().optional(),
  salaryMin: z.number().positive().optional().nullable(),
  salaryMax: z.number().positive().optional().nullable(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type CreateLeaveRequestInput = z.infer<typeof createLeaveRequestSchema>;
export type LeaveActionInput = z.infer<typeof leaveActionSchema>;
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type CreateLeaveTypeInput = z.infer<typeof createLeaveTypeSchema>;
export type CreatePositionInput = z.infer<typeof createPositionSchema>;
