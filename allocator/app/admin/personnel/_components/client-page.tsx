"use client";

import { useState } from "react";
import { User } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PersonnelForm } from "./personnel-form";
import { PersonnelTable } from "./personnel-table";
import { PlusCircle } from "lucide-react";

type PersonnelClientPageProps = {
  users: User[];
};

export function PersonnelClientPage({ users }: PersonnelClientPageProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);

  const handleOpenDialog = (user?: User) => {
    setEditingUser(user);
    setIsOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingUser(undefined);
    setIsOpen(false);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Personnel</h1>
        <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Personnel
        </Button>
      </div>

      <PersonnelTable users={users} onEdit={handleOpenDialog} />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Edit Personnel" : "Create New Personnel"}
            </DialogTitle>
          </DialogHeader>
          <PersonnelForm user={editingUser} onSuccess={handleCloseDialog} />
        </DialogContent>
      </Dialog>
    </>
  );
}
