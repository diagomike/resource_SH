"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createSection } from "@/lib/actions";
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

const sectionFormSchema = z.object({
  name: z.string().min(2, "Section name must be at least 2 characters."),
  batchId: z.string(),
});

type SectionFormProps = {
  batchId: string;
  onSuccess: () => void;
};

export function SectionForm({ batchId, onSuccess }: SectionFormProps) {
  const form = useForm<z.infer<typeof sectionFormSchema>>({
    resolver: zodResolver(sectionFormSchema),
    defaultValues: {
      name: "",
      batchId: batchId,
    },
  });

  const onSubmit = async (values: z.infer<typeof sectionFormSchema>) => {
    try {
      const result = await createSection(values);
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
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          Create Section
        </Button>
      </form>
    </Form>
  );
}
