import { getAllUsers } from "@/lib/actions";
import { PersonnelClientPage } from "./_components/client-page";

export default async function PersonnelPage() {
  const users = await getAllUsers();

  return (
    <div className="container mx-auto py-10">
      <PersonnelClientPage users={users} />
    </div>
  );
}
