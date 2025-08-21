"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createUser, updateUser } from "@/lib/actions";
import { User, Role } from "@prisma/client";

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
import { Checkbox } from "@/components/ui/checkbox";
import { userSchema } from "@/lib/schemas";

type PersonnelFormProps = {
  user?: User;
  onSuccess: () => void;
};

export function PersonnelForm({ user, onSuccess }: PersonnelFormProps) {
  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: user || {
      name: "",
      email: "",
      roles: [],
    },
  });

  const onSubmit = async (values: z.infer<typeof userSchema>) => {
    try {
      const result = user
        ? await updateUser({ ...values, id: user.id })
        : await createUser(values);

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
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Jane Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., jane.doe@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="roles"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Roles</FormLabel>
              <div className="grid grid-cols-3 gap-2 p-4 border rounded-md">
                {Object.values(Role).map((role) => (
                  <FormField
                    key={role}
                    control={form.control}
                    name="roles"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={role}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(role)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, role])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== role
                                      )
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">{role}</FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting
            ? "Saving..."
            : user
            ? "Save Changes"
            : "Create User"}
        </Button>
      </form>
    </Form>
  );
}
