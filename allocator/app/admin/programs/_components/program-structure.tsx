"use client";

import { useState } from "react";
import { ProgramWithChildren } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight, PlusCircle } from "lucide-react";
import { ProgramForm } from "./program-form";
import { BatchForm } from "./batch-form";
import { SectionForm } from "./section-form";

// Define a type for the dialog state
type DialogState =
  | { type: "program"; data?: ProgramWithChildren }
  | { type: "batch"; data?: { programId: string } }
  | { type: "section"; data?: { batchId: string } }
  | null;

export function ProgramStructureClient({
  programs: initialPrograms,
}: {
  programs: ProgramWithChildren[];
}) {
  const [dialogState, setDialogState] = useState<DialogState>(null);

  // We'll manage the state locally to avoid a full page refresh on create/edit
  const [programs, setPrograms] = useState(initialPrograms);

  const handleSuccess = () => {
    // In a real app, you would ideally refetch the data or update the state smartly.
    // For now, we just close the dialog. A page refresh will show the new data.
    setDialogState(null);
  };

  const renderDialogContent = () => {
    if (!dialogState) return null;

    switch (dialogState.type) {
      case "program":
        return (
          <ProgramForm program={dialogState.data} onSuccess={handleSuccess} />
        );
      case "batch":
        return (
          <BatchForm
            programId={dialogState.data?.programId!}
            onSuccess={handleSuccess}
          />
        );
      case "section":
        return (
          <SectionForm
            batchId={dialogState.data?.batchId!}
            onSuccess={handleSuccess}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="p-4 border rounded-md">
        <div className="flex justify-end mb-4">
          <Button onClick={() => setDialogState({ type: "program" })}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Program
          </Button>
        </div>
        <div className="space-y-2">
          {programs.map((program) => (
            <Collapsible key={program.id} className="group">
              <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted">
                <CollapsibleTrigger asChild>
                  <div className="flex items-center flex-1 cursor-pointer">
                    <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                    <span className="font-semibold ml-2">{program.name}</span>
                  </div>
                </CollapsibleTrigger>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setDialogState({
                      type: "batch",
                      data: { programId: program.id },
                    })
                  }
                >
                  Add Batch
                </Button>
              </div>
              <CollapsibleContent className="pl-6 border-l ml-4">
                {program.batches.map((batch) => (
                  <Collapsible key={batch.id} className="group">
                    <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted">
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center flex-1 cursor-pointer">
                          <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                          <span className="ml-2">{batch.name}</span>
                        </div>
                      </CollapsibleTrigger>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setDialogState({
                            type: "section",
                            data: { batchId: batch.id },
                          })
                        }
                      >
                        Add Section
                      </Button>
                    </div>
                    <CollapsibleContent className="pl-6 border-l ml-4">
                      {batch.sections.map((section) => (
                        <div key={section.id} className="p-2">
                          <span>- {section.name}</span>
                          {/* Add Group button/logic would go here */}
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </div>

      <Dialog
        open={!!dialogState}
        onOpenChange={(isOpen) => !isOpen && setDialogState(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogState?.type === "program" && "Add/Edit Program"}
              {dialogState?.type === "batch" && "Add Batch"}
              {dialogState?.type === "section" && "Add Section"}
            </DialogTitle>
          </DialogHeader>
          {renderDialogContent()}
        </DialogContent>
      </Dialog>
    </>
  );
}
