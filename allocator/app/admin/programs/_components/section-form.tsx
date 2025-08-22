"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createSectionWithGroups } from "@/lib/actions";
import { createSectionWithGroupsSchema } from "@/lib/schemas";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { PlusCircle, Trash2, ChevronsUpDown } from "lucide-react";
import { useState } from "react";

type SectionFormValues = z.infer<typeof createSectionWithGroupsSchema>;

type SectionFormProps = {
  batchId: string;
  onSuccess: () => void;
};

export function SectionForm({ batchId, onSuccess }: SectionFormProps) {
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
  const form = useForm<SectionFormValues>({
    resolver: zodResolver(createSectionWithGroupsSchema),
    defaultValues: {
      name: "",
      batchId: batchId,
      groups: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "groups",
  });

  const onSubmit = async (values: SectionFormValues) => {
    // Only include groups if the bulk-add panel is open and has items
    const payload = {
      ...values,
      groups:
        isBulkAddOpen && values.groups && values.groups.length > 0
          ? values.groups
          : undefined,
    };

    try {
      const result = await createSectionWithGroups(payload);
      if (result?.success) {
        toast.success(result.message);
        onSuccess();
      } else {
        toast.error(result?.message || "Failed to create section.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Section Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g., Section A" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Collapsible open={isBulkAddOpen} onOpenChange={setIsBulkAddOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-start">
              <ChevronsUpDown className="mr-2 h-4 w-4" />
              Optional: Add Groups in Bulk
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="space-y-2 max-h-48 overflow-y-auto p-1 border rounded-md">
              {fields.map((field, index) => (
                <FormField
                  key={field.id}
                  control={form.control}
                  name={`groups.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="sr-only">Group Name</FormLabel>
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={`Group ${index + 1} Name`}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
          </CollapsibleContent>
        </Collapsible>

        <Button type="submit" className="w-full">
          Create Section
        </Button>
      </form>
    </Form>
  );
}
