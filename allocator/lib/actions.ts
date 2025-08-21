// lib/actions.ts
"use server";

import { z } from "zod";
import { prisma } from "@/prisma/client";
import { revalidatePath } from "next/cache";
import {
  assignResourcesSchema,
  batchSchema,
  createCourseSchema,
  createScheduleInstanceSchema,
  groupSchema,
  idSchema,
  preferencesSchema,
  programSchema,
  roomSchema,
  sectionSchema,
  updateCourseSchema,
  updateRoomSchema,
  updateUserSchema,
  userSchema,
} from "./schemas";

// ---------------------------------------------------
// 1. Reusable Action Response Type
// ---------------------------------------------------

// A generic type to structure the return value of our server actions.
// This makes it easy to handle success, error, and validation states in our components.
type ActionResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  validationErrors?: Record<string, string[]>;
};

// ---------------------------------------------------
// 3. Server Actions
// ---------------------------------------------------

// --- Course Management Actions ---

/**
 * Creates a new Course along with its nested ActivityTemplates.
 */
export async function createCourse(
  input: z.infer<typeof createCourseSchema>
): Promise<ActionResponse<any>> {
  const validation = createCourseSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      message: "Invalid input",
      validationErrors: validation.error.flatten().fieldErrors,
    };
  }

  try {
    const newCourse = await prisma.course.create({
      data: {
        ...validation.data,
        activityTemplates: {
          create: validation.data.activityTemplates,
        },
      },
    });
    revalidatePath("/admin/courses"); // Invalidate cache for course list page
    return {
      success: true,
      message: "Course created successfully.",
      data: newCourse,
    };
  } catch (e: any) {
    if (e.code === "P2002") {
      return {
        success: false,
        message: `Course with code '${validation.data.code}' already exists.`,
      };
    }
    return { success: false, message: "Failed to create course." };
  }
}

/**
 * Updates an existing Course's top-level details.
 * Note: This does not update nested activity templates.
 */
export async function updateCourse(
  input: z.infer<typeof updateCourseSchema>
): Promise<ActionResponse<any>> {
  const validation = updateCourseSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      message: "Invalid input",
      validationErrors: validation.error.flatten().fieldErrors,
    };
  }
  const { id, ...data } = validation.data;
  try {
    const updatedCourse = await prisma.course.update({ where: { id }, data });
    revalidatePath("/admin/courses");
    revalidatePath(`/admin/courses/${id}`);
    return {
      success: true,
      message: "Course updated successfully.",
      data: updatedCourse,
    };
  } catch (e: any) {
    if (e.code === "P2002") {
      return {
        success: false,
        message: `Course with code '${validation.data.code}' already exists.`,
      };
    }
    return { success: false, message: "Failed to update course." };
  }
}

/**
 * Deletes a Course.
 */
export async function deleteCourse(
  input: z.infer<typeof idSchema>
): Promise<ActionResponse<any>> {
  try {
    await prisma.course.delete({ where: { id: input.id } });
    revalidatePath("/admin/courses");
    return { success: true, message: "Course deleted successfully." };
  } catch (e) {
    return { success: false, message: "Failed to delete course." };
  }
}

/**
 * Fetches a single course by its ID.
 */
export async function getCourseById(id: string) {
  return prisma.course.findUnique({
    where: { id },
    include: { activityTemplates: true },
  });
}

/**
 * Fetches all courses with their templates.
 */
export async function getAllCourses() {
  return prisma.course.findMany({ include: { activityTemplates: true } });
}

// --- Resource Management Actions (Users & Rooms) ---

/**
 * Creates a new User (Personnel).
 */
export async function createUser(
  input: z.infer<typeof userSchema>
): Promise<ActionResponse<any>> {
  const validation = userSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      message: "Invalid input",
      validationErrors: validation.error.flatten().fieldErrors,
    };
  }

  try {
    const newUser = await prisma.user.create({ data: validation.data });
    revalidatePath("/admin/personnel");
    return {
      success: true,
      message: "User created successfully.",
      data: newUser,
    };
  } catch (e: any) {
    if (e.code === "P2002") {
      return {
        success: false,
        message: `User with email '${validation.data.email}' already exists.`,
      };
    }
    return { success: false, message: "Failed to create user." };
  }
}

/**
 * Updates a User (Personnel).
 */
export async function updateUser(
  input: z.infer<typeof updateUserSchema>
): Promise<ActionResponse<any>> {
  const validation = updateUserSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      message: "Invalid input",
      validationErrors: validation.error.flatten().fieldErrors,
    };
  }
  const { id, ...data } = validation.data;
  try {
    const updatedUser = await prisma.user.update({ where: { id }, data });
    revalidatePath("/admin/personnel");
    revalidatePath(`/admin/personnel/${id}`);
    return {
      success: true,
      message: "User updated successfully.",
      data: updatedUser,
    };
  } catch (e: any) {
    if (e.code === "P2002") {
      return {
        success: false,
        message: `User with email '${validation.data.email}' already exists.`,
      };
    }
    return { success: false, message: "Failed to update user." };
  }
}

/**
 * Deletes a User.
 */
export async function deleteUser(
  input: z.infer<typeof idSchema>
): Promise<ActionResponse<any>> {
  try {
    await prisma.user.delete({ where: { id: input.id } });
    revalidatePath("/admin/personnel");
    return { success: true, message: "User deleted successfully." };
  } catch (e) {
    return { success: false, message: "Failed to delete user." };
  }
}

/**
 * Fetches all Users.
 */
export async function getAllUsers() {
  return prisma.user.findMany();
}

/**
 * Creates a new Room.
 */
export async function createRoom(
  input: z.infer<typeof roomSchema>
): Promise<ActionResponse<any>> {
  const validation = roomSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      message: "Invalid input",
      validationErrors: validation.error.flatten().fieldErrors,
    };
  }

  try {
    const newRoom = await prisma.room.create({ data: validation.data });
    revalidatePath("/admin/rooms");
    return {
      success: true,
      message: "Room created successfully.",
      data: newRoom,
    };
  } catch (e: any) {
    if (e.code === "P2002") {
      return {
        success: false,
        message: `Room with name '${validation.data.name}' already exists.`,
      };
    }
    return { success: false, message: "Failed to create room." };
  }
}

/**
 * Updates a Room.
 */
export async function updateRoom(
  input: z.infer<typeof updateRoomSchema>
): Promise<ActionResponse<any>> {
  const validation = updateRoomSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      message: "Invalid input",
      validationErrors: validation.error.flatten().fieldErrors,
    };
  }
  const { id, ...data } = validation.data;
  try {
    const updatedRoom = await prisma.room.update({ where: { id }, data });
    revalidatePath("/admin/rooms");
    revalidatePath(`/admin/rooms/${id}`);
    return {
      success: true,
      message: "Room updated successfully.",
      data: updatedRoom,
    };
  } catch (e: any) {
    if (e.code === "P2002") {
      return {
        success: false,
        message: `Room with name '${validation.data.name}' already exists.`,
      };
    }
    return { success: false, message: "Failed to update room." };
  }
}

/**
 * Deletes a Room.
 */
export async function deleteRoom(
  input: z.infer<typeof idSchema>
): Promise<ActionResponse<any>> {
  try {
    await prisma.room.delete({ where: { id: input.id } });
    revalidatePath("/admin/rooms");
    return { success: true, message: "Room deleted successfully." };
  } catch (e) {
    return { success: false, message: "Failed to delete room." };
  }
}

/**
 * Fetches all Rooms.
 */
export async function getAllRooms() {
  return prisma.room.findMany();
}

/**
 * Creates multiple new Rooms in a single batch operation.
 */
export async function bulkCreateRooms(
  input: z.infer<typeof roomSchema>[]
): Promise<ActionResponse<any>> {
  const validation = z.array(roomSchema).safeParse(input);
  if (!validation.success) {
    const formattedErrors = validation.error.issues
      .map((issue) => `Room ${String(issue.path[0])}: ${issue.message}`)
      .join("; ");
    return {
      success: false,
      message: `Validation failed: ${formattedErrors}`,
    };
  }

  try {
    const existingRooms = await prisma.room.findMany({
      where: { name: { in: validation.data.map((room) => room.name) } },
      select: { name: true },
    });
    const existingNames = new Set(existingRooms.map((room) => room.name));

    const roomsToCreate = validation.data.filter(
      (room) => !existingNames.has(room.name)
    );
    const skippedCount = validation.data.length - roomsToCreate.length;

    if (roomsToCreate.length === 0) {
      return {
        success: false,
        message: `No rooms were created. All ${skippedCount} rooms already exist.`,
      };
    }

    const result = await prisma.room.createMany({
      data: roomsToCreate,
    });

    revalidatePath("/admin/rooms");

    let successMessage = `Successfully created ${result.count} rooms.`;
    if (skippedCount > 0) {
      successMessage += ` Skipped ${skippedCount} rooms because they already exist.`;
    }

    return {
      success: true,
      message: successMessage,
    };
  } catch (e) {
    console.error("Bulk create rooms failed:", e);
    return { success: false, message: "Failed to create rooms." };
  }
}

// --- Attendee Structure Actions (Program, Batch, Section, Group) ---

/**
 * Creates a new Program.
 */
export async function createProgram(
  input: z.infer<typeof programSchema>
): Promise<ActionResponse<any>> {
  const validation = programSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      message: "Invalid input",
      validationErrors: validation.error.flatten().fieldErrors,
    };
  }
  try {
    const newProgram = await prisma.program.create({ data: validation.data });
    revalidatePath("/admin/programs");
    return {
      success: true,
      message: "Program created successfully.",
      data: newProgram,
    };
  } catch (e: any) {
    if (e.code === "P2002") {
      return {
        success: false,
        message: `A program named '${validation.data.name}' already exists.`,
      };
    }
    return { success: false, message: "Failed to create program." };
  }
}

/**
 * Creates a new Batch.
 */
export async function createBatch(
  input: z.infer<typeof batchSchema>
): Promise<ActionResponse<any>> {
  const validation = batchSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      message: "Invalid input",
      validationErrors: validation.error.flatten().fieldErrors,
    };
  }
  try {
    const newBatch = await prisma.batch.create({ data: validation.data });
    revalidatePath(`/admin/programs/${validation.data.programId}`);
    return {
      success: true,
      message: "Batch created successfully.",
      data: newBatch,
    };
  } catch (e: any) {
    return { success: false, message: "Failed to create batch." };
  }
}

/**
 * Creates a new Section.
 */
export async function createSection(
  input: z.infer<typeof sectionSchema>
): Promise<ActionResponse<any>> {
  const validation = sectionSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      message: "Invalid input",
      validationErrors: validation.error.flatten().fieldErrors,
    };
  }
  try {
    const newSection = await prisma.section.create({ data: validation.data });
    revalidatePath(`/admin/batches/${validation.data.batchId}`); // Revalidate the parent batch page
    return {
      success: true,
      message: "Section created successfully.",
      data: newSection,
    };
  } catch (e) {
    return { success: false, message: "Failed to create section." };
  }
}

/**
 * Creates a new Group.
 */
export async function createGroup(
  input: z.infer<typeof groupSchema>
): Promise<ActionResponse<any>> {
  const validation = groupSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      message: "Invalid input",
      validationErrors: validation.error.flatten().fieldErrors,
    };
  }
  try {
    const newGroup = await prisma.group.create({ data: validation.data });
    revalidatePath(`/admin/sections/${validation.data.sectionId}`); // Revalidate the parent section page
    return {
      success: true,
      message: "Group created successfully.",
      data: newGroup,
    };
  } catch (e) {
    return { success: false, message: "Failed to create group." };
  }
}

/**
 * Fetches all Programs with their nested batches, sections, and groups.
 */
export async function getAllProgramsWithChildren() {
  return prisma.program.findMany({
    include: {
      batches: {
        include: {
          sections: {
            include: {
              groups: true,
            },
          },
        },
      },
    },
  });
}

// --- Schedule Instance Actions ---

/**
 * Creates a new, empty ScheduleInstance.
 */
export async function createScheduleInstance(
  input: z.infer<typeof createScheduleInstanceSchema>
): Promise<ActionResponse<any>> {
  const validation = createScheduleInstanceSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      message: "Invalid input.",
      validationErrors: validation.error.flatten().fieldErrors,
    };
  }

  try {
    const newSchedule = await prisma.scheduleInstance.create({
      data: { ...validation.data, status: "DRAFT" },
    });
    revalidatePath("/admin/schedules");
    return {
      success: true,
      message: "Schedule instance created.",
      data: newSchedule,
    };
  } catch (e: any) {
    if (e.code === "P2002") {
      return {
        success: false,
        message: `A schedule named '${validation.data.name}' already exists.`,
      };
    }
    return { success: false, message: "Failed to create schedule." };
  }
}

/**
 * Fetches all ScheduleInstances.
 */
export async function getAllScheduleInstances() {
  return prisma.scheduleInstance.findMany({
    orderBy: {
      startDate: "desc",
    },
  });
}

/**
 * Fetches a single ScheduleInstance by ID with all its related data.
 */
export async function getScheduleInstanceById(id: string) {
  return prisma.scheduleInstance.findUnique({
    where: { id },
    include: {
      courses: { include: { activityTemplates: true } },
      sections: { include: { batch: { include: { program: true } } } },
      personnel: true,
      rooms: true,
      preferences: true,
      scheduledEvents: true,
    },
  });
}

/**
 * Deletes a ScheduleInstance.
 */
export async function deleteScheduleInstance(
  input: z.infer<typeof idSchema>
): Promise<ActionResponse<any>> {
  try {
    await prisma.scheduleInstance.delete({ where: { id: input.id } });
    revalidatePath("/admin/schedules");
    return { success: true, message: "Schedule instance deleted." };
  } catch (e) {
    return { success: false, message: "Failed to delete schedule instance." };
  }
}

/**
 * Assigns Courses, Sections, Personnel, and Rooms to a ScheduleInstance.
 * This is the "pooling" step.
 */
export async function assignResourcesToSchedule(
  input: z.infer<typeof assignResourcesSchema>
): Promise<ActionResponse<any>> {
  const validation = assignResourcesSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      message: "Invalid input.",
      validationErrors: validation.error.flatten().fieldErrors,
    };
  }

  const { scheduleInstanceId, courseIds, sectionIds, personnelIds, roomIds } =
    validation.data;

  try {
    const updatedSchedule = await prisma.scheduleInstance.update({
      where: { id: scheduleInstanceId },
      data: {
        courses: { set: courseIds?.map((id) => ({ id })) },
        sections: { set: sectionIds?.map((id) => ({ id })) },
        personnel: { set: personnelIds?.map((id) => ({ id })) },
        rooms: { set: roomIds?.map((id) => ({ id })) },
      },
    });
    revalidatePath(`/admin/schedules/${scheduleInstanceId}`);
    return {
      success: true,
      message: "Resources assigned successfully.",
      data: updatedSchedule,
    };
  } catch (e) {
    return { success: false, message: "Failed to assign resources." };
  }
}

/**
 * Allows a user to submit their ranked preferences for a given schedule.
 */
export async function submitPreferences(
  input: z.infer<typeof preferencesSchema>
): Promise<ActionResponse<any>> {
  const validation = preferencesSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      message: "Invalid input.",
      validationErrors: validation.error.flatten().fieldErrors,
    };
  }

  const { personnelId, scheduleInstanceId, preferences } = validation.data;

  try {
    // Use a transaction to ensure we delete old preferences and create new ones atomically.
    await prisma.$transaction(async (tx) => {
      // 1. Delete existing preferences for this user on this schedule
      await tx.personnelPreference.deleteMany({
        where: {
          personnelId: personnelId,
          scheduleInstanceId: scheduleInstanceId,
        },
      });

      // 2. Create the new preferences
      if (preferences.length > 0) {
        await tx.personnelPreference.createMany({
          data: preferences.map((p) => ({
            personnelId,
            scheduleInstanceId,
            activityTemplateId: p.activityTemplateId,
            rank: p.rank,
          })),
        });
      }
    });

    return { success: true, message: "Preferences saved successfully." };
  } catch (e) {
    return { success: false, message: "Failed to save preferences." };
  }
}
