// lib/schemas.ts

import { z } from "zod";
import { Role, RoomType, AttendeeLevel, ScheduleStatus } from "@prisma/client";

// ---------------------------------------------------
// 2. Zod Schemas for Validation
// ---------------------------------------------------

export const idSchema = z.object({ id: z.string() });

// --- Course & ActivityTemplate Schemas ---
const requiredPersonnelSchema = z.object({
  role: z.enum(Role),
  count: z.number().int().min(1),
});

const activityTemplateSchema = z.object({
  title: z.string().min(3),
  durationMinutes: z.number().int().positive(),
  attendeeLevel: z.enum(AttendeeLevel),
  requiredRoomType: z.enum(RoomType),
  requiredPersonnel: z.array(requiredPersonnelSchema).min(1),
});

export const createCourseSchema = z.object({
  code: z.string().min(3),
  title: z.string().min(3),
  activityTemplates: z.array(activityTemplateSchema).min(1),
});

export const updateCourseSchema = z.object({
  id: z.string(),
  code: z.string().min(3),
  title: z.string().min(3),
});

// --- User (Personnel) Schema ---
export const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  roles: z.array(z.enum(Role)).min(1),
});

export const updateUserSchema = userSchema.extend({
  id: z.string(),
});

// --- Room Schema ---
export const roomSchema = z.object({
  name: z.string().min(3),
  building: z.string().min(2),
  capacity: z.number().int().positive(),
  type: z.enum(RoomType),
});

export const updateRoomSchema = roomSchema.extend({
  id: z.string(),
});

// --- Attendee Structure Schemas ---
export const programSchema = z.object({ name: z.string().min(5) });
export const updateProgramSchema = programSchema.extend({ id: z.string() });

export const batchSchema = z.object({
  name: z.string().min(3),
  programId: z.string(),
});
export const updateBatchSchema = batchSchema.extend({ id: z.string() });

export const sectionSchema = z.object({
  name: z.string().min(1),
  batchId: z.string(),
});
export const updateSectionSchema = sectionSchema.extend({ id: z.string() });

export const groupSchema = z.object({
  name: z.string().min(1),
  sectionId: z.string(),
});
export const updateGroupSchema = groupSchema.extend({ id: z.string() });

// --- ScheduleInstance Schema ---
export const createScheduleInstanceSchema = z.object({
  name: z.string().min(5),
  startDate: z.date(),
  endDate: z.date(),
});

export const updateScheduleInstanceSchema = createScheduleInstanceSchema.extend(
  {
    id: z.string(),
  }
);

export const assignResourcesSchema = z.object({
  scheduleInstanceId: z.string(),
  courseIds: z.array(z.string()).optional(),
  sectionIds: z.array(z.string()).optional(),
  personnelIds: z.array(z.string()).optional(),
  roomIds: z.array(z.string()).optional(),
});

// --- PersonnelPreference Schema ---
export const preferencesSchema = z.object({
  personnelId: z.string(),
  scheduleInstanceId: z.string(),
  preferences: z.array(
    z.object({
      activityTemplateId: z.string(),
      rank: z.number().int().positive(),
    })
  ),
});
