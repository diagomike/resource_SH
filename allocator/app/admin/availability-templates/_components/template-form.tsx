"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  createAvailabilityTemplate,
  updateAvailabilityTemplate,
} from "@/lib/actions";
import { availabilityTemplateSchema } from "@/lib/schemas";
import { AvailabilityTemplate, DayOfWeek } from "@prisma/client";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { PlusCircle, Trash2 } from "lucide-react";

type TemplateFormProps = {
  template?: AvailabilityTemplate;
  onSuccess: () => void;
};

type TemplateFormValues = z.infer<typeof availabilityTemplateSchema>;

export function TemplateForm({ template, onSuccess }: TemplateFormProps) {
  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(availabilityTemplateSchema),
    defaultValues: template
      ? { ...template }
      : {
          name: "",
          availableSlots: [
            {
              dayOfWeek: DayOfWeek.MONDAY,
              startTime: "09:00",
              endTime: "17:00",
            },
          ],
        },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "availableSlots",
  });

  const onSubmit = async (values: TemplateFormValues) => {
    const action = template
      ? updateAvailabilityTemplate
      : createAvailabilityTemplate;
    const result = await action({ ...values, id: template?.id });

    if (result.success) {
      toast.success(result.message);
      onSuccess();
    } else {
      toast.error(result.message);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Template Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Standard Weekday Schedule"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <FormLabel>Time Blocks</FormLabel>
          <div className="max-h-64 overflow-y-auto pr-2 space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex flex-col sm:flex-row items-end gap-4 p-4 border rounded-md"
              >
                <FormField
                  control={form.control}
                  name={`availableSlots.${index}.dayOfWeek`}
                  render={({ field }) => (
                    <FormItem className="flex-1 w-full">
                      <FormLabel>Day</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(DayOfWeek).map((day) => (
                            <SelectItem key={day} value={day}>
                              {day}
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
                  name={`availableSlots.${index}.startTime`}
                  render={({ field }) => (
                    <FormItem className="flex-1 w-full">
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type="time" step="1800" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`availableSlots.${index}.endTime`}
                  render={({ field }) => (
                    <FormItem className="flex-1 w-full">
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input type="time" step="1800" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => remove(index)}
                  disabled={fields.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <FormMessage>
            {form.formState.errors.availableSlots?.root?.message}
          </FormMessage>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              dayOfWeek: DayOfWeek.MONDAY,
              startTime: "09:00",
              endTime: "17:00",
            })
          }
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Add Time Block
        </Button>

        <div className="pt-4 flex justify-end">
          <Button
            type="submit"
            disabled={!form.formState.isValid || form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Saving..." : "Save Template"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
