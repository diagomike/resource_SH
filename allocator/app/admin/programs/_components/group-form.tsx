"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { bulkCreateGroups } from "@/lib/actions";
import { bulkCreateGroupsSchema } from "@/lib/schemas";
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
import { PlusCircle, Trash2 } from "lucide-react";

type GroupFormValues = z.infer<typeof bulkCreateGroupsSchema>;

type GroupFormProps = {
  sectionId: string;
  onSuccess: () => void;
};

export function GroupForm({ sectionId, onSuccess }: GroupFormProps) {
  const form = useForm<GroupFormValues>({
    resolver: zodResolver(bulkCreateGroupsSchema),
    defaultValues: {
      sectionId: sectionId,
      groups: [{ name: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "groups",
  });

  const onSubmit = async (values: GroupFormValues) => {
    try {
      const result = await bulkCreateGroups(values);
      if (result?.success) {
        toast.success(result.message);
        onSuccess();
      } else {
        toast.error(result?.message || "Failed to create groups.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2 max-h-60 overflow-y-auto p-1">
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
                      disabled={fields.length <= 1}
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
          <PlusCircle className="mr-2 h-4 w-4" /> Add Another Group
        </Button>

        <Button type="submit" className="w-full">
          Create Groups
        </Button>
      </form>
    </Form>
  );
}
