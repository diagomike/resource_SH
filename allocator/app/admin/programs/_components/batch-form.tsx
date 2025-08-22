"use client";

import { useForm, useFieldArray, Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createBatchWithSections } from "@/lib/actions";
import { createBatchWithSectionsSchema } from "@/lib/schemas";
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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PlusCircle, Trash2, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { Label } from "@/components/ui/label";

type BatchFormValues = z.infer<typeof createBatchWithSectionsSchema>;

// A reusable component for the nested groups form array
function GroupFields({
  control,
  sectionIndex,
}: {
  control: Control<BatchFormValues>;
  sectionIndex: number;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `sections.${sectionIndex}.groups`,
  });

  return (
    <div className="space-y-2 pl-4 border-l-2 pt-2">
      <Label className="text-xs font-semibold">Groups</Label>
      {fields.map((item, groupIndex) => (
        <div key={item.id} className="flex items-center gap-2">
          <FormField
            control={control}
            name={`sections.${sectionIndex}.groups.${groupIndex}.name`}
            render={({ field }) => (
              <FormItem className="flex-grow">
                <FormControl>
                  <Input {...field} placeholder={`Group ${groupIndex + 1}`} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => remove(groupIndex)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ name: "" })}
      >
        <PlusCircle className="mr-2 h-4 w-4" /> Add Group
      </Button>
    </div>
  );
}

export function BatchForm({
  programId,
  onSuccess,
}: {
  programId: string;
  onSuccess: () => void;
}) {
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
  const form = useForm<BatchFormValues>({
    resolver: zodResolver(createBatchWithSectionsSchema),
    defaultValues: {
      name: "",
      programId: programId,
      sections: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "sections",
  });

  const onSubmit = async (values: BatchFormValues) => {
    // Only include sections if the bulk-add panel is open and has items
    const payload = {
      ...values,
      sections:
        isBulkAddOpen && values.sections && values.sections.length > 0
          ? values.sections
          : undefined,
    };
    try {
      const result = await createBatchWithSections(payload);
      if (result?.success) {
        toast.success(result.message);
        onSuccess();
      } else {
        toast.error(result?.message || "Failed to create batch.");
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
              <FormLabel>Batch Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g., 2024 Intake" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Collapsible open={isBulkAddOpen} onOpenChange={setIsBulkAddOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-start">
              <ChevronsUpDown className="mr-2 h-4 w-4" />
              Optional: Add Sections in Bulk
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="space-y-3 max-h-60 overflow-y-auto p-1 border rounded-md">
              {fields.map((item, index) => (
                <Card key={item.id} className="p-3">
                  <CardHeader className="flex flex-row items-center justify-between p-0 pb-2">
                    <FormLabel>Section {index + 1}</FormLabel>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0 space-y-2">
                    <FormField
                      control={form.control}
                      name={`sections.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input {...field} placeholder="Section Name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <GroupFields control={form.control} sectionIndex={index} />
                  </CardContent>
                </Card>
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
          </CollapsibleContent>
        </Collapsible>

        <Button type="submit" className="w-full">
          Create Batch
        </Button>
      </form>
    </Form>
  );
}
