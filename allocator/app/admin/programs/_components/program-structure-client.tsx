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
