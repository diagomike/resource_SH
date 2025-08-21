"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createGroup } from "@/lib/actions";
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

const groupFormSchema = z.object({
  name: z.string().min(2, "Group name must be at least 2 characters."),
  sectionId: z.string(),
});

type GroupFormProps = {
  sectionId: string;
  onSuccess: () => void;
};

export function GroupForm({ sectionId, onSuccess }: GroupFormProps) {
  const form = useForm<z.infer<typeof groupFormSchema>>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: {
      name: "",
      sectionId: sectionId,
    },
  });

  const onSubmit = async (values: z.infer<typeof groupFormSchema>) => {
    try {
      const result = await createGroup(values);
      if (result?.success) {
        toast.success(result.message);
        onSuccess();
      } else {
        toast.error(result?.message || "Failed to create group.");
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
              <FormLabel>Group Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          Create Group
        </Button>
      </form>
    </Form>
  );
}
