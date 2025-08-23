
================================================
FILE: allocator/app/admin/programs/page.tsx
================================================
import { getAllProgramsWithChildren } from "@/lib/actions";
import { ProgramStructureClient } from "./_components/program-structure-client";

export default async function ProgramsPage() {
  const programs = await getAllProgramsWithChildren();

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Academic Structure</h1>
      </div>
      <ProgramStructureClient programs={programs} />
    </div>
  );
}



================================================
FILE: allocator/app/admin/programs/_components/batch-form.tsx
================================================
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



================================================
FILE: allocator/app/admin/programs/_components/bulk-add-program.tsx
================================================
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



================================================
FILE: allocator/app/admin/programs/_components/group-form.tsx
================================================
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



================================================
FILE: allocator/app/admin/programs/_components/program-form.tsx
================================================
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createProgram } from "@/lib/actions";
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

const programFormSchema = z.object({
  name: z.string().min(2, "Program name must be at least 2 characters."),
});

type ProgramFormProps = {
  onSuccess: () => void;
};

export function ProgramForm({ onSuccess }: ProgramFormProps) {
  const form = useForm<z.infer<typeof programFormSchema>>({
    resolver: zodResolver(programFormSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof programFormSchema>) => {
    try {
      const result = await createProgram(values);
      if (result?.success) {
        toast.success(result.message);
        onSuccess();
      } else {
        toast.error(result?.message || "Failed to create program.");
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
              <FormLabel>Program Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          Create Program
        </Button>
      </form>
    </Form>
  );
}



================================================
FILE: allocator/app/admin/programs/_components/program-structure-client.tsx
================================================
"use client";

import { useState } from "react";
import { Program, Batch, Section } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  PlusCircle,
  ChevronsUpDown,
  Plus,
  Trash2,
  BookCopy,
} from "lucide-react";
import { ProgramForm } from "./program-form";
import { BatchForm } from "./batch-form";
import { SectionForm } from "./section-form";
import { GroupForm } from "./group-form";
import { BulkAddProgram } from "./bulk-add-program"; // Import the new component
import {
  deleteProgram,
  deleteBatch,
  deleteSection,
  deleteGroup,
} from "@/lib/actions";
import { toast } from "sonner";

type ProgramWithChildren = Program & {
  batches: (Batch & {
    sections: (Section & {
      groups: { id: string; name: string }[];
    })[];
  })[];
};

type ModalType = "program" | "batch" | "section" | "group";

export function ProgramStructureClient({
  programs,
}: {
  programs: ProgramWithChildren[];
}) {
  // Use more descriptive state names to handle multiple dialogs
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType | null>(null);
  const [parentIds, setParentIds] = useState<{
    programId?: string;
    batchId?: string;
    sectionId?: string;
  }>({});

  const handleOpenFormDialog = (
    type: ModalType,
    ids: { programId?: string; batchId?: string; sectionId?: string }
  ) => {
    setModalType(type);
    setParentIds(ids);
    setIsFormDialogOpen(true);
  };

  const handleCloseFormDialog = () => {
    setParentIds({});
    setIsFormDialogOpen(false);
  };

  const handleOpenBulkDialog = () => {
    setIsBulkDialogOpen(true);
  };

  const handleCloseBulkDialog = () => {
    setIsBulkDialogOpen(false);
  };

  const handleDelete = async (
    type: "program" | "batch" | "section" | "group",
    id: string
  ) => {
    let result;
    if (confirm(`Are you sure you want to delete this ${type}?`)) {
      if (type === "program") {
        result = await deleteProgram({ id });
      } else if (type === "batch") {
        result = await deleteBatch({ id });
      } else if (type === "section") {
        result = await deleteSection({ id });
      } else {
        result = await deleteGroup({ id });
      }

      if (result?.success) {
        toast.success(result.message);
      } else {
        toast.error(result?.message || `Failed to delete ${type}.`);
      }
    }
  };

  const renderModalContent = () => {
    switch (modalType) {
      case "program":
        return <ProgramForm onSuccess={handleCloseFormDialog} />;
      case "batch":
        return (
          <BatchForm
            programId={parentIds.programId!}
            onSuccess={handleCloseFormDialog}
          />
        );
      case "section":
        return (
          <SectionForm
            batchId={parentIds.batchId!}
            onSuccess={handleCloseFormDialog}
          />
        );
      case "group":
        return (
          <GroupForm
            sectionId={parentIds.sectionId!}
            onSuccess={handleCloseFormDialog}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        {/* Button for single program creation */}
        <Button onClick={() => handleOpenFormDialog("program", {})}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Program
        </Button>
        {/* New button for bulk program creation */}
        <Button variant="outline" onClick={handleOpenBulkDialog}>
          <BookCopy className="mr-2 h-4 w-4" /> Bulk Add Structure
        </Button>
      </div>

      <div className="space-y-4">
        {programs.map((program) => (
          <Collapsible key={program.id} className="w-full">
            <div className="flex items-center justify-between space-x-4 border rounded-md p-4">
              <CollapsibleTrigger asChild>
                <div className="flex items-center space-x-2 cursor-pointer w-full">
                  <ChevronsUpDown className="h-4 w-4" />
                  <h2 className="font-semibold">{program.name}</h2>
                </div>
              </CollapsibleTrigger>
              <div className="flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    handleOpenFormDialog("batch", { programId: program.id })
                  }
                >
                  <Plus className="h-4 w-4" /> Add Batch
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete("program", program.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </div>
            <CollapsibleContent className="space-y-4 pt-4 pl-8">
              {program.batches.map((batch) => (
                <Collapsible key={batch.id}>
                  <div className="flex items-center justify-between space-x-4 border rounded-md p-3">
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center space-x-2 cursor-pointer w-full">
                        <ChevronsUpDown className="h-4 w-4" />
                        <h3 className="font-medium">{batch.name}</h3>
                      </div>
                    </CollapsibleTrigger>
                    <div className="flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleOpenFormDialog("section", { batchId: batch.id })
                        }
                      >
                        <Plus className="h-4 w-4" /> Add Section
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete("batch", batch.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                  <CollapsibleContent className="space-y-4 pt-4 pl-8">
                    {batch.sections.map((section) => (
                      <Collapsible key={section.id}>
                        <div className="flex items-center justify-between space-x-4 border rounded-md p-2">
                          <CollapsibleTrigger asChild>
                            <div className="flex items-center space-x-2 cursor-pointer w-full">
                              <ChevronsUpDown className="h-4 w-4" />
                              <h4 className="font-normal">{section.name}</h4>
                            </div>
                          </CollapsibleTrigger>
                          <div className="flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleOpenFormDialog("group", {
                                  sectionId: section.id,
                                })
                              }
                            >
                              <Plus className="h-4 w-4" /> Add Group
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleDelete("section", section.id)
                              }
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                        <CollapsibleContent className="pt-4 pl-8">
                          <ul className="space-y-2">
                            {section.groups.map((group) => (
                              <li
                                key={group.id}
                                className="flex justify-between items-center border rounded-md p-2"
                              >
                                <span className="text-sm">{group.name}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleDelete("group", group.id)
                                  }
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </li>
                            ))}
                          </ul>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>

      {/* Dialog for single item forms */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {modalType &&
                `Add New ${
                  modalType.charAt(0).toUpperCase() + modalType.slice(1)
                }`}
            </DialogTitle>
          </DialogHeader>
          {renderModalContent()}
        </DialogContent>
      </Dialog>

      {/* New Dialog for the Bulk Add Program form */}
      <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Bulk Create Program Structure</DialogTitle>
            <DialogDescription>
              Define a new program and its entire hierarchy of batches,
              sections, and groups in one go.
            </DialogDescription>
          </DialogHeader>
          <BulkAddProgram onSuccess={handleCloseBulkDialog} />
        </DialogContent>
      </Dialog>
    </>
  );
}



================================================
FILE: allocator/app/admin/programs/_components/section-form.tsx
================================================
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

