"use client";

import { useForm, useFieldArray, Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { bulkCreateProgram } from "@/lib/actions";
import { bulkProgramSchema } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Trash2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

// Define the type for our form values based on the Zod schema
type BulkProgramFormValues = z.infer<typeof bulkProgramSchema>;

type BulkAddProgramProps = {
  onSuccess: () => void;
};

/**
 * Renders the fields for a single Section, including its nested Groups.
 */
function SectionFields({
  control,
  batchIndex,
  sectionIndex,
  removeSection,
}: {
  control: Control<BulkProgramFormValues>;
  batchIndex: number;
  sectionIndex: number;
  removeSection: (index: number) => void;
}) {
  // `useFieldArray` for managing the dynamic list of groups within this section
  const { fields, append, remove } = useFieldArray({
    control,
    name: `batches.${batchIndex}.sections.${sectionIndex}.groups`,
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between p-3">
        <CardTitle className="text-base">Section {sectionIndex + 1}</CardTitle>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => removeSection(sectionIndex)}
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 p-3">
        {/* Input for Section Name */}
        <FormField
          control={control}
          name={`batches.${batchIndex}.sections.${sectionIndex}.name`}
          render={({ field }) => (
            <FormItem>
              <Label>Section Name</Label>
              <FormControl>
                <Input {...field} placeholder="e.g., Section A" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Dynamic list of Group inputs */}
        <div className="space-y-2 pl-4 border-l-2">
          {fields.map((item, groupIndex) => (
            <div key={item.id} className="flex items-center gap-2">
              <FormField
                control={control}
                name={`batches.${batchIndex}.sections.${sectionIndex}.groups.${groupIndex}.name`}
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <Label className="text-xs">Group {groupIndex + 1}</Label>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Group 1" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mt-5"
                onClick={() => remove(groupIndex)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ name: "" })}
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Add Group
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Renders the fields for a single Batch, including its nested Sections.
 */
function BatchFields({
  control,
  batchIndex,
  removeBatch,
}: {
  control: Control<BulkProgramFormValues>;
  batchIndex: number;
  removeBatch: (index: number) => void;
}) {
  // `useFieldArray` for managing the dynamic list of sections within this batch
  const { fields, append, remove } = useFieldArray({
    control,
    name: `batches.${batchIndex}.sections`,
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between p-4">
        <CardTitle className="text-lg">Batch {batchIndex + 1}</CardTitle>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => removeBatch(batchIndex)}
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        {/* Input for Batch Name */}
        <FormField
          control={control}
          name={`batches.${batchIndex}.name`}
          render={({ field }) => (
            <FormItem>
              <Label>Batch Name</Label>
              <FormControl>
                <Input {...field} placeholder="e.g., 2024 Intake" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Dynamic list of Section components */}
        <div className="space-y-2 pl-4 border-l-2">
          {fields.map((item, sectionIndex) => (
            <SectionFields
              key={item.id}
              control={control}
              batchIndex={batchIndex}
              sectionIndex={sectionIndex}
              removeSection={remove}
            />
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ name: "", groups: [{ name: "" }] })}
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Add Section
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * The main component for the bulk program creation form.
 */
export function BulkAddProgram({ onSuccess }: BulkAddProgramProps) {
  const form = useForm<BulkProgramFormValues>({
    resolver: zodResolver(bulkProgramSchema),
    // Set default values to ensure the form starts with one of everything
    defaultValues: {
      name: "",
      batches: [{ name: "", sections: [{ name: "", groups: [{ name: "" }] }] }],
    },
  });

  // `useFieldArray` for managing the dynamic list of batches at the top level
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "batches",
  });

  // Handle form submission
  const onSubmit = async (values: BulkProgramFormValues) => {
    const result = await bulkCreateProgram(values);
    if (result?.success) {
      toast.success(result.message);
      onSuccess(); // Close the dialog on success
    } else {
      toast.error(result?.message || "Failed to create program.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Input for Program Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <Label className="text-lg">Program Name</Label>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g., Computer Science - Regular"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Container for the dynamic list of Batch components */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
          {fields.map((item, index) => (
            <BatchFields
              key={item.id}
              control={form.control}
              batchIndex={index}
              removeBatch={remove}
            />
          ))}
        </div>

        {/* Button to add a new Batch */}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            append({
              name: "",
              sections: [{ name: "", groups: [{ name: "" }] }],
            })
          }
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Add Batch
        </Button>

        {/* Form submission button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? "Creating..."
              : "Create Program Structure"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
