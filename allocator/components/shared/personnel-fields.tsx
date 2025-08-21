"use client";

import { useFieldArray, Control } from "react-hook-form";
import { z } from "zod";
import { createCourseSchema } from "@/lib/schemas";
import { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
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

// Define props for the new component
type PersonnelFieldsProps = {
  nestIndex: number;
  control: Control<z.infer<typeof createCourseSchema>>;
};

export function PersonnelFields({ nestIndex, control }: PersonnelFieldsProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `activityTemplates.${nestIndex}.requiredPersonnel`,
  });

  return (
    <div className="space-y-3 pl-4 border-l-2">
      <FormLabel>Required Personnel</FormLabel>
      {fields.map((field, k) => (
        <div key={field.id} className="flex items-end gap-3">
          <FormField
            control={control}
            name={`activityTemplates.${nestIndex}.requiredPersonnel.${k}.role`}
            render={({ field }) => (
              <FormItem className="flex-grow">
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(Role).map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`activityTemplates.${nestIndex}.requiredPersonnel.${k}.count`}
            render={({ field }) => (
              <FormItem className="w-24">
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Count"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value, 10) || 1)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => remove(k)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-2"
        onClick={() => append({ role: Role.LECTURER, count: 1 })}
      >
        <PlusCircle className="mr-2 h-4 w-4" /> Add Personnel
      </Button>
    </div>
  );
}
