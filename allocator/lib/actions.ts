// lib/actions.ts
"use server";

import { z } from "zod";
import { prisma } from "@/prisma/client";
import { revalidatePath } from "next/cache";
import {
  assignResourcesSchema,
  batchSchema,
  bulkCreateGroupsSchema,
  bulkProgramSchema,
  createBatchWithSectionsSchema,
  createCourseSchema,
  createScheduleInstanceSchema,
  createSectionWithGroupsSchema,
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
  removeResourceSchema,
  availabilityTemplateSchema,
  updateScheduleTemplateSchema,
  importSolutionSchema,
  updateScheduleSolverSettingsSchema,
  scheduleInstanceStatusSchema,
  getEventsAtTimeSlotSchema,
  getAvailableResourcesSchema,
  updateScheduledEventResourceSchema,
} from "./schemas";
import { AttendeeLevel, DayOfWeek, ScheduleInstance } from "@prisma/client";

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
 * Deletes a Course and its associated ActivityTemplates.
 */
export async function deleteCourse(
  input: z.infer<typeof idSchema>
): Promise<ActionResponse<any>> {
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Delete associated ActivityTemplates first
      await tx.activityTemplate.deleteMany({
        where: { courseId: input.id },
      });

      // 2. Then delete the Course
      await tx.course.delete({ where: { id: input.id } });
    });

    revalidatePath("/admin/courses");
    return { success: true, message: "Course deleted successfully." };
  } catch (e) {
    console.error("Failed to delete course:", e); // Log the error for debugging
    return {
      success: false,
      message:
        "Failed to delete course. It might be assigned to a schedule or another related entity.",
    };
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
 * Deletes a Program.
 */
export async function deleteProgram(
  input: z.infer<typeof idSchema>
): Promise<ActionResponse<any>> {
  try {
    await prisma.program.delete({ where: { id: input.id } });
    revalidatePath("/admin/programs");
    return { success: true, message: "Program deleted successfully." };
  } catch (e: any) {
    return { success: false, message: "Failed to delete program." };
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
 * Deletes a Batch.
 */
export async function deleteBatch(
  input: z.infer<typeof idSchema>
): Promise<ActionResponse<any>> {
  try {
    await prisma.batch.delete({ where: { id: input.id } });
    revalidatePath("/admin/programs");
    return { success: true, message: "Batch deleted successfully." };
  } catch (e: any) {
    return { success: false, message: "Failed to delete batch." };
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
 * Deletes a Section.
 */
export async function deleteSection(
  input: z.infer<typeof idSchema>
): Promise<ActionResponse<any>> {
  try {
    await prisma.section.delete({ where: { id: input.id } });
    revalidatePath("/admin/programs");
    return { success: true, message: "Section deleted successfully." };
  } catch (e: any) {
    return { success: false, message: "Failed to delete section." };
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
 * Deletes a Group.
 */
export async function deleteGroup(
  input: z.infer<typeof idSchema>
): Promise<ActionResponse<any>> {
  try {
    await prisma.group.delete({ where: { id: input.id } });
    revalidatePath("/admin/programs");
    return { success: true, message: "Group deleted successfully." };
  } catch (e: any) {
    return { success: false, message: "Failed to delete group." };
  }
}

/**
 * Creates a new Program with its entire nested structure (Batches, Sections, Groups) in a single transaction.
 */
export async function bulkCreateProgram(
  input: z.infer<typeof bulkProgramSchema>
): Promise<ActionResponse<any>> {
  const validation = bulkProgramSchema.safeParse(input);
  if (!validation.success) {
    // Flatten errors to make them easier to display on the form
    const flatErrors = validation.error.flatten();
    const firstErrorMessage = Object.values(flatErrors.fieldErrors)?.[0]?.[0];

    return {
      success: false,
      message: firstErrorMessage || "Invalid input",
      validationErrors: flatErrors.fieldErrors,
    };
  }

  const { name, batches } = validation.data;

  try {
    // Check for existing program name to provide a cleaner error message
    const existingProgram = await prisma.program.findUnique({
      where: { name },
    });
    if (existingProgram) {
      return {
        success: false,
        message: `A program named '${name}' already exists.`,
      };
    }

    // Use a transaction to ensure all or nothing is created
    await prisma.$transaction(async (tx) => {
      // 1. Create the Program
      const newProgram = await tx.program.create({
        data: { name },
      });

      // 2. Loop through and create Batches and their children
      for (const batchData of batches) {
        const newBatch = await tx.batch.create({
          data: {
            name: batchData.name,
            programId: newProgram.id,
          },
        });

        // 3. Loop through and create Sections and their children
        for (const sectionData of batchData.sections) {
          const newSection = await tx.section.create({
            data: {
              name: sectionData.name,
              batchId: newBatch.id,
            },
          });

          // 4. Create all Groups for the current section
          if (sectionData.groups.length > 0) {
            await tx.group.createMany({
              data: sectionData.groups.map((groupData) => ({
                name: groupData.name,
                sectionId: newSection.id,
              })),
            });
          }
        }
      }
    });

    revalidatePath("/admin/programs");
    return {
      success: true,
      message: `Program '${name}' and its structure created successfully.`,
    };
  } catch (e: any) {
    console.error("Bulk create program failed:", e);
    // Handle potential race condition if name was created after our initial check
    if (e.code === "P2002") {
      return {
        success: false,
        message: `A program named '${name}' already exists.`,
      };
    }
    return {
      success: false,
      message:
        "An unexpected error occurred. Failed to create the program structure.",
    };
  }
}

/**
 * Creates multiple new Groups under a single Section.
 */
export async function bulkCreateGroups(
  input: z.infer<typeof bulkCreateGroupsSchema>
): Promise<ActionResponse<any>> {
  const validation = bulkCreateGroupsSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      message: "Invalid input",
      validationErrors: validation.error.flatten().fieldErrors,
    };
  }

  const { sectionId, groups } = validation.data;

  try {
    const result = await prisma.group.createMany({
      data: groups.map((group) => ({ ...group, sectionId })),
    });
    revalidatePath("/admin/programs");
    return {
      success: true,
      message: `Successfully created ${result.count} groups.`,
    };
  } catch (e) {
    console.error("Bulk create groups failed:", e);
    return { success: false, message: "Failed to create groups." };
  }
}

/**
 * Creates a new Section and optionally multiple Groups under it in a transaction.
 */
export async function createSectionWithGroups(
  input: z.infer<typeof createSectionWithGroupsSchema>
): Promise<ActionResponse<any>> {
  const validation = createSectionWithGroupsSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      message: "Invalid input",
      validationErrors: validation.error.flatten().fieldErrors,
    };
  }

  const { batchId, name, groups } = validation.data;

  try {
    await prisma.$transaction(async (tx) => {
      const newSection = await tx.section.create({
        data: { name, batchId },
      });

      if (groups && groups.length > 0) {
        await tx.group.createMany({
          data: groups.map((group) => ({
            name: group.name,
            sectionId: newSection.id,
          })),
        });
      }
    });

    revalidatePath("/admin/programs");
    return {
      success: true,
      message: `Section '${name}' and ${
        groups?.length || 0
      } groups created successfully.`,
    };
  } catch (e) {
    console.error("Create section with groups failed:", e);
    return { success: false, message: "Failed to create section structure." };
  }
}

/**
 * Creates a new Batch and optionally multiple Sections (with Groups) under it in a transaction.
 */
export async function createBatchWithSections(
  input: z.infer<typeof createBatchWithSectionsSchema>
): Promise<ActionResponse<any>> {
  const validation = createBatchWithSectionsSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      message: "Invalid input",
      validationErrors: validation.error.flatten().fieldErrors,
    };
  }

  const { programId, name, sections } = validation.data;

  try {
    await prisma.$transaction(async (tx) => {
      const newBatch = await tx.batch.create({
        data: { name, programId },
      });

      if (sections && sections.length > 0) {
        for (const sectionData of sections) {
          const newSection = await tx.section.create({
            data: {
              name: sectionData.name,
              batchId: newBatch.id,
            },
          });

          if (sectionData.groups && sectionData.groups.length > 0) {
            await tx.group.createMany({
              data: sectionData.groups.map((groupData) => ({
                name: groupData.name,
                sectionId: newSection.id,
              })),
            });
          }
        }
      }
    });

    revalidatePath("/admin/programs");
    return {
      success: true,
      message: `Batch '${name}' and its structure created successfully.`,
    };
  } catch (e) {
    console.error("Create batch with sections failed:", e);
    return { success: false, message: "Failed to create batch structure." };
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

// --- Availability Template Actions (NEW SECTION) ---

/**
 * Creates a new AvailabilityTemplate.
 */
export async function createAvailabilityTemplate(
  input: z.infer<typeof availabilityTemplateSchema>
): Promise<ActionResponse<any>> {
  const validation = availabilityTemplateSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      message: "Invalid input.",
      validationErrors: validation.error.flatten().fieldErrors,
    };
  }
  try {
    const newTemplate = await prisma.availabilityTemplate.create({
      data: validation.data,
    });
    revalidatePath("/admin/availability-templates");
    return {
      success: true,
      message: "Template created successfully.",
      data: newTemplate,
    };
  } catch (e: any) {
    if (e.code === "P2002") {
      return {
        success: false,
        message: `A template named '${validation.data.name}' already exists.`,
      };
    }
    return { success: false, message: "Failed to create template." };
  }
}

/**
 * Updates an existing AvailabilityTemplate.
 */
export async function updateAvailabilityTemplate(
  input: z.infer<typeof availabilityTemplateSchema>
): Promise<ActionResponse<any>> {
  const validation = availabilityTemplateSchema.safeParse(input);
  if (!validation.success || !input.id) {
    return { success: false, message: "Invalid input." };
  }
  const { id, ...data } = validation.data;
  try {
    const updatedTemplate = await prisma.availabilityTemplate.update({
      where: { id },
      data,
    });
    revalidatePath("/admin/availability-templates");
    revalidatePath(`/admin/availability-templates/${id}`);
    return {
      success: true,
      message: "Template updated successfully.",
      data: updatedTemplate,
    };
  } catch (e: any) {
    if (e.code === "P2002") {
      return {
        success: false,
        message: `A template named '${validation.data.name}' already exists.`,
      };
    }
    return { success: false, message: "Failed to update template." };
  }
}

/**
 * Deletes an AvailabilityTemplate.
 */
export async function deleteAvailabilityTemplate(
  input: z.infer<typeof idSchema>
): Promise<ActionResponse<any>> {
  try {
    await prisma.availabilityTemplate.delete({ where: { id: input.id } });
    revalidatePath("/admin/availability-templates");
    return { success: true, message: "Template deleted successfully." };
  } catch (e) {
    return {
      success: false,
      message: "Failed to delete template. It might be in use by a schedule.",
    };
  }
}

/**
 * Fetches all AvailabilityTemplates.
 */
export async function getAllAvailabilityTemplates() {
  try {
    const availabilityTemplates = await prisma.availabilityTemplate.findMany({
      orderBy: { name: "asc" },
    });
    return {
      success: true,
      message: "Availability Templates fetched successfully.",
      data: availabilityTemplates,
    };
  } catch (error) {
    console.error("Failed to fetch schedule instances:", error);
    return {
      success: false,
      message: "Failed to fetch schedule instances.",
    };
  }
}

/**
 * Fetches a single AvailabilityTemplate by its ID.
 */
export async function getAvailabilityTemplateById(id: string) {
  return prisma.availabilityTemplate.findUnique({
    where: { id },
  });
}

// --- Schedule Instance Actions ---
/**
 * Creates a new ScheduleInstance.
 * (This function is UPDATED to use the new schema with availabilityTemplateId)
 */
export async function createScheduleInstance(
  input: z.infer<typeof createScheduleInstanceSchema>
): Promise<ActionResponse<any>> {
  // The validation now correctly checks for availabilityTemplateId
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
export async function getAllScheduleInstances(): Promise<
  ActionResponse<ScheduleInstance[]>
> {
  try {
    const instances = await prisma.scheduleInstance.findMany({
      orderBy: {
        startDate: "desc",
      },
    });
    return {
      success: true,
      message: "Schedules fetched successfully.",
      data: instances,
    };
  } catch (error) {
    console.error("Failed to fetch schedule instances:", error);
    return {
      success: false,
      message: "Failed to fetch schedule instances.",
    };
  }
}

/**
 * Fetches all data required for the schedule instance dashboard.
 * UPDATED: Now includes fully populated relations for assigned sections
 * on the scheduleInstance object for the preview tab.
 */
export async function getScheduleInstanceDetails(id: string) {
  const [scheduleInstance, allCourses, allPersonnel, allRooms, allSections] =
    await Promise.all([
      prisma.scheduleInstance.findUnique({
        where: { id },
        include: {
          courses: true,
          personnel: true,
          rooms: true,
          sections: {
            // Populate relations for assigned sections
            include: {
              batch: {
                include: {
                  program: true,
                },
              },
            },
          },
        },
      }),
      prisma.course.findMany({ orderBy: { code: "asc" } }),
      prisma.user.findMany({ orderBy: { name: "asc" } }),
      prisma.room.findMany({ orderBy: { name: "asc" } }),
      prisma.section.findMany({
        include: { batch: { include: { program: true } } },
        orderBy: { name: "asc" },
      }),
    ]);

  if (!scheduleInstance) {
    return null;
  }

  return {
    scheduleInstance,
    allCourses,
    allPersonnel,
    allRooms,
    allSections,
  };
}

/**
 * NEW: Removes (disconnects) a single resource from a ScheduleInstance.
 */
export async function removeResourceFromSchedule(
  input: z.infer<typeof removeResourceSchema>
): Promise<ActionResponse<any>> {
  const validation = removeResourceSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, message: "Invalid input." };
  }

  const { scheduleInstanceId, resourceId, resourceType } = validation.data;

  try {
    let updateData = {};
    // Determine which relation to update based on the resource type
    switch (resourceType) {
      case "course":
        updateData = { courses: { disconnect: { id: resourceId } } };
        break;
      case "personnel":
        updateData = { personnel: { disconnect: { id: resourceId } } };
        break;
      case "room":
        updateData = { rooms: { disconnect: { id: resourceId } } };
        break;
      case "section":
        updateData = { sections: { disconnect: { id: resourceId } } };
        break;
      default:
        return { success: false, message: "Invalid resource type." };
    }

    await prisma.scheduleInstance.update({
      where: { id: scheduleInstanceId },
      data: updateData,
    });

    revalidatePath(`/admin/schedules/${scheduleInstanceId}`);
    return { success: true, message: "Resource removed successfully." };
  } catch (e) {
    console.error("Failed to remove resource:", e);
    return { success: false, message: "Failed to remove resource." };
  }
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
      // Include optional solver parameters
      timePreferences: true, // Assuming a relation for time preferences
      // These two below are auto imported since they are not models
      // roomStickinessWeight: true,
      // spacingPreference: true,
    },
  });
}

// NEW: Action to update optional solver settings on ScheduleInstance
export async function updateScheduleSolverSettings(
  input: z.infer<typeof updateScheduleSolverSettingsSchema>
): Promise<ActionResponse<any>> {
  const validation = updateScheduleSolverSettingsSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      message: "Invalid input for solver settings.",
      validationErrors: validation.error.flatten().fieldErrors,
    };
  }

  const { scheduleInstanceId, roomStickinessWeight, spacingPreference } =
    validation.data;

  try {
    await prisma.scheduleInstance.update({
      where: { id: scheduleInstanceId },
      data: {
        roomStickinessWeight: roomStickinessWeight,
        spacingPreference: spacingPreference,
      },
    });
    revalidatePath(`/admin/schedules/${scheduleInstanceId}`); // Revalidate to show updated settings
    return { success: true, message: "Solver settings updated successfully." };
  } catch (error: any) {
    console.error("Failed to update solver settings:", error);
    return {
      success: false,
      message: error.message || "Failed to update solver settings.",
    };
  }
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

/**
 * Updates the AvailabilityTemplate for a specific ScheduleInstance.
 */
export async function updateScheduleTemplate(
  input: z.infer<typeof updateScheduleTemplateSchema>
): Promise<ActionResponse<any>> {
  const validation = updateScheduleTemplateSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, message: "Invalid input." };
  }

  const { scheduleInstanceId, availabilityTemplateId } = validation.data;

  try {
    await prisma.scheduleInstance.update({
      where: { id: scheduleInstanceId },
      data: {
        availabilityTemplateId: availabilityTemplateId,
      },
    });
    revalidatePath(`/admin/schedules/${scheduleInstanceId}`);
    return {
      success: true,
      message: "Availability template updated successfully.",
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Failed to update the template." };
  }
}

// Python Link Activities

// =================================================================================
// STEP 1: DATA AGGREGATION AND FORMATTING FOR THE SOLVER
// =================================================================================

/**
 * Converts "HH:MM" time string to a slot index within a 24-hour day (0-47).
 * e.g., "00:00" -> 0, "08:30" -> 17, "23:30" -> 47
 */
const timeToSlotIndex = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 2 + Math.floor(minutes / 30);
};

/**
 * Gathers all data for a given schedule and formats it into the JSON structure
 * expected by the Python allocation service.
 */
async function getScheduleDataForSolver(scheduleInstanceId: string) {
  const schedule = await prisma.scheduleInstance.findUnique({
    where: { id: scheduleInstanceId },
    include: {
      availabilityTemplate: true,
      courses: { include: { activityTemplates: true } },
      personnel: true,
      rooms: true,
      sections: { include: { groups: true } },
      preferences: true,
      // Include the new optional solver parameters
      timePreferences: true, // Assuming this is a relation on ScheduleInstance
    },
  });

  if (!schedule || !schedule.availabilityTemplate) {
    throw new Error("Schedule or its availability template not found.");
  }

  // --- 1. Process Time Slots ---
  const dayOrder: DayOfWeek[] = [
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.FRIDAY,
    DayOfWeek.SATURDAY,
    DayOfWeek.SUNDAY,
  ];
  const slotsPerDay = 48; // 24 hours * 2 slots/hour
  let time_slots: number[] = [];
  const availableDays: string[] = [];

  dayOrder.forEach((day, dayIndex) => {
    const blocksForDay = schedule.availabilityTemplate.availableSlots.filter(
      (s) => s.dayOfWeek === day
    );
    if (blocksForDay.length > 0) {
      if (!availableDays.includes(day)) {
        availableDays.push(day);
      }
      blocksForDay.forEach((block) => {
        const startSlot = timeToSlotIndex(block.startTime);
        const endSlot = timeToSlotIndex(block.endTime);
        for (let i = startSlot; i < endSlot; i++) {
          // Use a global index across the entire week for the solver
          const globalSlotIndex = dayIndex * slotsPerDay + i;
          time_slots.push(globalSlotIndex);
        }
      });
    }
  });
  time_slots = [...new Set(time_slots)].sort((a, b) => a - b);

  // --- 2. Expand Activities ---
  // A single ActivityTemplate can result in multiple "tasks" for the solver.
  // e.g., a Lab template creates a task for each group in each section.
  const activities = schedule.sections.flatMap((section) =>
    schedule.courses.flatMap((course) =>
      course.activityTemplates.flatMap((template) => {
        if (template.attendeeLevel === "SECTION") {
          // Create one activity for the entire section
          return [
            {
              id: `${template.id}_${section.id}`, // Unique ID for the solver task
              templateId: template.id, // Keep original template ID for saving results
              courseId: course.id, // ADDED: Course ID for spacing constraint
              duration_slots: Math.ceil(template.durationMinutes / 30),
              required_room_type: template.requiredRoomType,
              required_personnel: template.requiredPersonnel,
              attendee_level: "SECTION",
              attendee_id: section.id,
            },
          ];
        } else {
          // GROUP level
          // Create one activity for each group within the section
          return section.groups.map((group) => ({
            id: `${template.id}_${group.id}`, // Unique ID for the solver task
            templateId: template.id, // Keep original template ID for saving results
            courseId: course.id, // ADDED: Course ID for spacing constraint
            duration_slots: Math.ceil(template.durationMinutes / 30),
            required_room_type: template.requiredRoomType,
            required_personnel: template.requiredPersonnel,
            attendee_level: "GROUP",
            attendee_id: group.id,
          }));
        }
      })
    )
  );

  // --- 3. Format Other Resources ---
  const personnel = schedule.personnel.map((p) => ({
    id: p.id,
    roles: p.roles,
  }));
  const rooms = schedule.rooms.map((r) => ({ id: r.id, type: r.type }));

  // Preferences link to the template, not the expanded activity, so we use templateId
  const preferences = schedule.preferences.map((p) => ({
    personnel_id: p.personnelId,
    activity_id: p.activityTemplateId, // This correctly refers to ActivityTemplate ID
    rank: p.rank,
  }));

  // Time preferences for the solver
  const time_preferences = schedule.timePreferences
    ? schedule.timePreferences.map((tp) => ({
        time: tp.time,
        rank: tp.rank,
      }))
    : [];

  return {
    activities,
    personnel,
    rooms,
    preferences,
    time_slots,
    days: availableDays,
    // Include the new optional solver parameters
    room_stickiness_weight: schedule.roomStickinessWeight || 0, // Default to 0 if not set
    spacing_preference: schedule.spacingPreference || "NONE", // Default to "NONE"
    time_preferences: time_preferences,
  };
}

// =================================================================================
// STEP 2: SAVING THE SOLVER'S SOLUTION
// =================================================================================

/**
 * Saves the timetable solution from the Python service to the database.
 * This is done in a transaction to ensure data integrity.
 */
async function saveSolutionToDatabase(
  scheduleInstanceId: string,
  solution: any[]
) {
  // Helper to convert a global slot index back to day and time
  const slotToTime = (globalSlotIndex: number) => {
    const slotsPerDay = 48;
    const dayIndex = Math.floor(globalSlotIndex / slotsPerDay);
    const slotInDay = globalSlotIndex % slotsPerDay;

    // Ensure day is a valid DayOfWeek enum member
    const day = Object.values(DayOfWeek)[dayIndex] as DayOfWeek;
    const hours = Math.floor(slotInDay / 2);
    const minutes = (slotInDay % 2) * 30;

    return {
      day,
      time: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0"
      )}`,
    };
  };

  const eventsToCreate = solution.map((event) => {
    const { day: startDay, time: startTime } = slotToTime(event.start_slot);
    // Ensure end_slot conversion handles potential end of day correctly
    const { time: endTime } = slotToTime(event.end_slot);

    return {
      dayOfWeek: startDay,
      startTime: startTime,
      endTime: endTime,
      scheduleInstanceId: scheduleInstanceId,
      activityTemplateId: event.templateId, // Use the original templateId
      roomId: event.room_id,
      personnelIds: event.personnel_ids,
      attendeeSectionId:
        event.attendee_level === "SECTION" ? event.attendee_id : null,
      attendeeGroupId:
        event.attendee_level === "GROUP" ? event.attendee_id : null,
    };
  });

  // Use a transaction to perform a clean update
  await prisma.$transaction([
    // 1. Delete all previously scheduled events for this schedule
    prisma.scheduledEvent.deleteMany({
      where: { scheduleInstanceId: scheduleInstanceId },
    }),
    // 2. Create all the new events from the solution
    prisma.scheduledEvent.createMany({
      data: eventsToCreate,
    }),
    // 3. Mark the schedule as completed
    prisma.scheduleInstance.update({
      where: { id: scheduleInstanceId },
      data: { status: "COMPLETED" },
    }),
  ]);
}

// =================================================================================
// STEP 3: THE TRIGGER ACTION (UPDATED)
// =================================================================================

/**
 * Gathers data, calls the Python solver, and saves the resulting timetable.
 */
export async function triggerAllocation(
  scheduleInstanceId: string
): Promise<ActionResponse<any>> {
  console.log(`Starting allocation for schedule: ${scheduleInstanceId}`);

  // 1. Update status to LOCK the schedule during allocation
  await prisma.scheduleInstance.update({
    where: { id: scheduleInstanceId },
    data: { status: "LOCKED" },
  });

  try {
    // 2. Aggregate and format all data required by the solver
    console.log("Gathering and formatting data for solver...");
    const solverInput = await getScheduleDataForSolver(scheduleInstanceId);

    if (solverInput.activities.length === 0) {
      return {
        success: false,
        message:
          "No activities to schedule. Please assign courses and sections.",
      };
    }
    if (solverInput.time_slots.length === 0) {
      return {
        success: false,
        message:
          "No available time slots defined. Please set an availability template.",
      };
    }

    // 3. Call the Python solver service
    const solverUrl = process.env.SOLVER_API_URL;
    if (!solverUrl) {
      throw new Error("SOLVER_API_URL environment variable is not set.");
    }

    console.log(
      `Sending ${solverInput.activities.length} activities to solver at ${solverUrl}...`
    );
    const response = await fetch(`${solverUrl}/solve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(solverInput),
      // Add a reasonable timeout for the solver
      signal: AbortSignal.timeout(300000), // 5 minutes
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Solver failed: ${error.detail || response.statusText}`);
    }

    const solution = await response.json();
    console.log(`Solver returned a solution with ${solution.length} events.`);

    // 4. Save the solution to the database
    await saveSolutionToDatabase(scheduleInstanceId, solution);

    revalidatePath(`/admin/schedules/${scheduleInstanceId}`);
    return {
      success: true,
      message:
        "Allocation completed successfully! The timetable is now available.",
    };
  } catch (error: any) {
    console.error("Allocation trigger failed:", error);
    // Revert status to DRAFT if allocation fails
    await prisma.scheduleInstance.update({
      where: { id: scheduleInstanceId },
      data: { status: "DRAFT" },
    });
    return {
      success: false,
      message: error.message || "An unexpected error occurred.",
    };
  }
}

/**
 * Gathers and formats allocation data for manual export.
 */
export async function exportAllocationData(
  scheduleInstanceId: string
): Promise<ActionResponse<any>> {
  try {
    const solverInput = await getScheduleDataForSolver(scheduleInstanceId);
    return {
      success: true,
      message: "Data exported successfully.",
      data: solverInput,
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

/**
 * Imports a JSON solution file and saves it to the database.
 */
export async function importAllocationSolution(
  input: z.infer<typeof importSolutionSchema>
): Promise<ActionResponse<any>> {
  const validation = importSolutionSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      message: "Invalid solution file format.",
      validationErrors: validation.error.flatten().fieldErrors,
    };
  }

  const { scheduleInstanceId, solution } = validation.data;

  try {
    await saveSolutionToDatabase(scheduleInstanceId, solution);
    revalidatePath(`/admin/schedules/${scheduleInstanceId}`);
    return { success: true, message: "Timetable imported successfully!" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// ---------------------------------------------------
// 3. Server Actions
// ---------------------------------------------------

// ... existing actions ...

// NEW SECTION: Scheduled Event Management Actions

/**
 * Fetches all necessary data for the timetable view of a specific ScheduleInstance.
 * This includes the schedule itself, its availability template, all its scheduled events,
 * and global lists of all personnel and rooms to determine availability.
 */
export async function getTimetableDetails(scheduleInstanceId: string): Promise<
  ActionResponse<{
    scheduleInstance: any; // Type with full relations
    scheduledEvents: any[]; // Type with full relations
    allPersonnel: any[];
    allRooms: any[];
  }>
> {
  const validation = idSchema.safeParse({ id: scheduleInstanceId });
  if (!validation.success) {
    return { success: false, message: "Invalid schedule instance ID." };
  }

  try {
    const scheduleInstance = await prisma.scheduleInstance.findUnique({
      where: { id: scheduleInstanceId },
      include: {
        availabilityTemplate: true,
        scheduledEvents: {
          include: {
            activityTemplate: true,
            room: true,
            personnel: true,
            attendeeSection: true,
            attendeeGroup: true,
          },
          orderBy: { startTime: "asc" }, // Order events for easier display
        },
      },
    });

    if (!scheduleInstance) {
      return { success: false, message: "Schedule instance not found." };
    }

    const allPersonnel = await prisma.user.findMany({
      orderBy: { name: "asc" },
    });
    const allRooms = await prisma.room.findMany({ orderBy: { name: "asc" } });

    return {
      success: true,
      message: "Timetable details fetched successfully.",
      data: {
        scheduleInstance,
        scheduledEvents: scheduleInstance.scheduledEvents,
        allPersonnel,
        allRooms,
      },
    };
  } catch (error: any) {
    console.error("Failed to fetch timetable details:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch timetable details.",
    };
  }
}

/**
 * Fetches scheduled events that start at a specific day and time for a given schedule instance.
 * This is used when a user clicks on a time block in the timetable.
 */
export async function getScheduledEventsForTimeSlot(
  input: z.infer<typeof getEventsAtTimeSlotSchema>
): Promise<ActionResponse<any[]>> {
  const validation = getEventsAtTimeSlotSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      message: "Invalid input for time slot query.",
      validationErrors: validation.error.flatten().fieldErrors,
    };
  }

  const { scheduleInstanceId, dayOfWeek, startTime } = validation.data;

  try {
    const scheduledEvents = await prisma.scheduledEvent.findMany({
      where: {
        scheduleInstanceId,
        dayOfWeek,
        startTime,
      },
      include: {
        activityTemplate: true,
        room: true,
        personnel: true,
        attendeeSection: {
          include: {
            batch: {
              include: {
                program: true,
              },
            },
          },
        },
        attendeeGroup: {
          include: {
            section: {
              include: {
                batch: {
                  include: {
                    program: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { startTime: "asc" },
    });

    return {
      success: true,
      message: "Scheduled events fetched successfully.",
      data: scheduledEvents,
    };
  } catch (error: any) {
    console.error("Failed to fetch scheduled events for time slot:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch scheduled events.",
    };
  }
}

/**
 * Fetches personnel and rooms that are currently not allocated in any ScheduledEvent
 * during a specific time slot (day, start time, and end time).
 * This provides a global list of free resources for swapping.
 */
export async function getFreeResourcesForTimeSlot(
  input: z.infer<typeof getAvailableResourcesSchema>
): Promise<
  ActionResponse<{ availablePersonnel: any[]; availableRooms: any[] }>
> {
  const validation = getAvailableResourcesSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      message: "Invalid input for available resources query.",
      validationErrors: validation.error.flatten().fieldErrors,
    };
  }

  const { dayOfWeek, startTime, endTime } = validation.data;

  try {
    // Find all scheduled events that overlap with the requested time slot
    const overlappingEvents = await prisma.scheduledEvent.findMany({
      where: {
        dayOfWeek,
        // An event overlaps if its start time is before the query's end time
        // AND its end time is after the query's start time.
        AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
      },
      select: {
        roomId: true,
        personnelIds: true,
      },
    });

    // Extract IDs of occupied rooms and personnel
    const occupiedRoomIds = new Set<string>();
    const occupiedPersonnelIds = new Set<string>();

    overlappingEvents.forEach((event) => {
      if (event.roomId) {
        occupiedRoomIds.add(event.roomId);
      }
      event.personnelIds.forEach((id) => occupiedPersonnelIds.add(id));
    });

    // Find all personnel who are not occupied
    const availablePersonnel = await prisma.user.findMany({
      where: {
        id: { notIn: Array.from(occupiedPersonnelIds) },
      },
      orderBy: { name: "asc" },
    });

    // Find all rooms that are not occupied
    const availableRooms = await prisma.room.findMany({
      where: {
        id: { notIn: Array.from(occupiedRoomIds) },
      },
      orderBy: { name: "asc" },
    });

    return {
      success: true,
      message: "Available resources fetched successfully.",
      data: { availablePersonnel, availableRooms },
    };
  } catch (error: any) {
    console.error("Failed to fetch available resources:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch available resources.",
    };
  }
}

/**
 * Updates the room and/or personnel assigned to a specific ScheduledEvent.
 * This supports both removing (by setting to null/empty array) and reassigning.
 */
export async function updateScheduledEventResources(
  input: z.infer<typeof updateScheduledEventResourceSchema>
): Promise<ActionResponse<any>> {
  const validation = updateScheduledEventResourceSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      message: "Invalid input for updating scheduled event.",
      validationErrors: validation.error.flatten().fieldErrors,
    };
  }

  const { scheduledEventId, roomId, personnelIds } = validation.data;

  try {
    const updateData: any = {};

    if (roomId !== undefined) {
      // Check if roomId was provided, even if null
      updateData.roomId = roomId;
    }
    if (personnelIds !== undefined) {
      // Check if personnelIds was provided, even if empty array
      updateData.personnelIds = personnelIds;
    }

    const updatedEvent = await prisma.scheduledEvent.update({
      where: { id: scheduledEventId },
      data: updateData,
      include: {
        // Include relations for updated data to be useful on the client
        activityTemplate: true,
        room: true,
        personnel: true,
        attendeeSection: true,
        attendeeGroup: true,
      },
    });

    revalidatePath(`/admin/schedules/${updatedEvent.scheduleInstanceId}`);
    return {
      success: true,
      message: "Scheduled event resources updated successfully.",
      data: updatedEvent,
    };
  } catch (error: any) {
    console.error("Failed to update scheduled event resources:", error);
    return {
      success: false,
      message: error.message || "Failed to update scheduled event resources.",
    };
  }
}

/**
 * Calculates and returns the allocation status for all schedule instances.
 * Statuses: COMPLETED, SEMI_ALLOCATED, NOT_SCHEDULED.
 */
export async function getScheduleInstanceOverviewStatuses(): Promise<
  ActionResponse<z.infer<typeof scheduleInstanceStatusSchema>[]>
> {
  try {
    const allScheduleInstances = await prisma.scheduleInstance.findMany({
      include: {
        courses: {
          include: {
            activityTemplates: true,
          },
        },
        sections: {
          include: {
            groups: true,
          },
        },
        scheduledEvents: {
          select: { id: true }, // Only need count of scheduled events
        },
      },
      orderBy: { name: "asc" },
    });

    const statuses: z.infer<typeof scheduleInstanceStatusSchema>[] = [];

    for (const instance of allScheduleInstances) {
      let totalExpectedActivities = 0;
      // Calculate total potential activities based on courses, sections, and groups
      instance.courses.forEach((course) => {
        course.activityTemplates.forEach((template) => {
          if (template.attendeeLevel === AttendeeLevel.SECTION) {
            totalExpectedActivities += instance.sections.length;
          } else if (template.attendeeLevel === AttendeeLevel.GROUP) {
            instance.sections.forEach((section) => {
              // Assuming all groups in a section take all group-level activities
              // This needs to be carefully aligned with how your solver input generates activities
              totalExpectedActivities += section.groups.length;
            });
          }
        });
      });

      const currentlyScheduledEvents = instance.scheduledEvents.length;
      let status: z.infer<typeof scheduleInstanceStatusSchema>["status"];

      if (totalExpectedActivities === 0) {
        // If there are no activities defined for the schedule instance, it can't be scheduled.
        // We'll treat this as 'NOT_SCHEDULED' or you might want a specific 'NO_ACTIVITIES' status.
        status = "NOT_SCHEDULED";
      } else if (currentlyScheduledEvents === totalExpectedActivities) {
        status = "COMPLETED";
      } else if (currentlyScheduledEvents > 0) {
        status = "SEMI_ALLOCATED";
      } else {
        status = "NOT_SCHEDULED";
      }

      statuses.push({
        id: instance.id,
        name: instance.name,
        status,
        totalActivitiesToSchedule: totalExpectedActivities,
        currentlyScheduledEvents: currentlyScheduledEvents,
      });
    }

    return {
      success: true,
      message: "Schedule instance statuses fetched successfully.",
      data: statuses,
    };
  } catch (error: any) {
    console.error("Failed to fetch schedule instance statuses:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch schedule instance statuses.",
    };
  }
}
