"use client";

import { useState } from "react";
import { Room } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RoomForm } from "./room-form";
import { RoomsTable } from "./rooms-table";
import { PlusCircle } from "lucide-react";
import BulkAddRooms from "./bulk-add-room";

type RoomsClientPageProps = {
  rooms: Room[];
};

export function RoomsClientPage({ rooms }: RoomsClientPageProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | undefined>(undefined);

  const handleOpenDialog = (room?: Room) => {
    setEditingRoom(room);
    setIsOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingRoom(undefined);
    setIsOpen(false);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Rooms</h1>
        <div className="flex items-center gap-2">
          <BulkAddRooms onUpdate={() => window.location.reload()} />
          <Button onClick={() => handleOpenDialog()}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Room
          </Button>
        </div>
      </div>

      <div className="mt-8">
        <RoomsTable rooms={rooms} onEdit={handleOpenDialog} />
      </div>

      <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingRoom ? "Edit Room" : "Add Room"}</DialogTitle>
          </DialogHeader>
          <RoomForm room={editingRoom} onSuccess={handleCloseDialog} />
        </DialogContent>
      </Dialog>
    </>
  );
}
