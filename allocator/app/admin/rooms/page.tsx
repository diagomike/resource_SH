import { getAllRooms } from "@/lib/actions";
import { RoomsClientPage } from "./_components/client-page";

export default async function RoomsPage() {
  const rooms = await getAllRooms();

  return (
    <div className="container mx-auto py-10">
      <RoomsClientPage rooms={rooms} />
    </div>
  );
}
