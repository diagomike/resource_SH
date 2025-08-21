"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createBatch } from "@/lib/actions";
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

const batchFormSchema = z.object({
  name: z.string().min(2, "Batch name must be at least 2 characters."),
  programId: z.string(),
});

type BatchFormProps = {
  programId: string;
  onSuccess: () => void;
};

export function BatchForm({ programId, onSuccess }: BatchFormProps) {
  const form = useForm<z.infer<typeof batchFormSchema>>({
    resolver: zodResolver(batchFormSchema),
    defaultValues: {
      name: "",
      programId: programId,
    },
  });

  const onSubmit = async (values: z.infer<typeof batchFormSchema>) => {
    try {
      const result = await createBatch(values);
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
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          Create Batch
        </Button>
      </form>
    </Form>
  );
}
