"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createCourseSchema } from "@/lib/schemas";
import { createCourse, updateCourse } from "@/lib/actions";
import { CourseWithTemplates } from "@/types";
import { Role, RoomType, AttendeeLevel } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
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
import { PlusCircle, Trash2 } from "lucide-react";
import { PersonnelFields } from "@/components/shared/personnel-fields"; // Import the new component

type CourseFormProps = {
  course?: CourseWithTemplates;
  onSuccess: () => void;
};

export function CourseForm({ course, onSuccess }: CourseFormProps) {
  const form = useForm<z.infer<typeof createCourseSchema>>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: course
      ? {
          ...course,
          activityTemplates: course.activityTemplates.map((template) => ({
            ...template,
            // Ensure requiredPersonnel is always an array
            requiredPersonnel: template.requiredPersonnel || [],
          })),
        }
      : {
          code: "",
          title: "",
          activityTemplates: [
            {
              title: "",
              durationMinutes: 60,
              attendeeLevel: AttendeeLevel.SECTION,
              requiredRoomType: RoomType.LECTURE_HALL,
              requiredPersonnel: [{ role: Role.LECTURER, count: 1 }],
            },
          ],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "activityTemplates",
  });

  const onSubmit = async (values: z.infer<typeof createCourseSchema>) => {
    try {
      let result;
      if (course) {
        // The update action would need a different schema and logic.
        // For now, let's just show a message.
        // toast.info("Update functionality to be implemented.");
        console.log("Update values", { ...values, id: course.id });
        result = await updateCourse({ ...values, id: course.id });
      } else {
        result = await createCourse(values);
      }

      if (result?.success) {
        toast.success(result.message);
        onSuccess();
      } else {
        toast.error(result?.message || "An error occurred.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Course Code</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., CS101" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Course Title</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Introduction to Programming"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Activity Templates</h3>
          {/* Scrollable container for activity templates */}
          <div className="max-h-64 overflow-y-auto pr-2 space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="p-4 border rounded-md space-y-4 relative"
              >
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}

                {/* START: Detailed form fields for each activity template */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`activityTemplates.${index}.title`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Activity Title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Weekly Lecture"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`activityTemplates.${index}.durationMinutes`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (Minutes)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 120"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value, 10))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`activityTemplates.${index}.attendeeLevel`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Attendee Level</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(AttendeeLevel).map((level) => (
                              <SelectItem key={level} value={level}>
                                {level}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`activityTemplates.${index}.requiredRoomType`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Required Room Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select room type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(RoomType).map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Use the dedicated component for the nested personnel array */}
                <PersonnelFields nestIndex={index} control={form.control} />
                {/* END: Detailed form fields */}
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({
                title: "",
                durationMinutes: 60,
                attendeeLevel: AttendeeLevel.SECTION,
                requiredRoomType: RoomType.LECTURE_HALL,
                requiredPersonnel: [{ role: Role.LECTURER, count: 1 }],
              })
            }
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add Activity
          </Button>
        </div>

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting
            ? "Saving..."
            : course
            ? "Save Changes"
            : "Create Course"}
        </Button>
      </form>
    </Form>
  );
}
