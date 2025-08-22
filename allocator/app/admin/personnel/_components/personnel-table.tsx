"use client";

import { User } from "@prisma/client";
import TanstackEnhancedTable from "@/components/shared/tanstack-enhanced-table"; // Adjusted import path to be relative
import { Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge"; // Ensure Badge is imported if used in render

interface PersonnelTableProps {
  users: User[];
  onEdit: (user: User) => void;
}

export function PersonnelTable({ users, onEdit }: PersonnelTableProps) {
  const columns = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      searchable: true,
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
      searchable: true,
    },
    {
      key: "roles",
      label: "Roles",
      render: (roles: string[]) => (
        <div className="flex flex-wrap gap-1">
          {roles.map((role) => (
            <Badge
              key={role}
              variant="outline"
              className="bg-muted px-2 py-1 rounded-full text-xs font-medium"
            >
              {role}
            </Badge>
          ))}
        </div>
      ),
      sortable: false, // Roles array might not be easily sortable as a single unit
      searchable: false, // Not directly searchable by array content in a simple way
    },
  ];

  const roleOptions = [
    { value: "ADMIN", label: "Admin" },
    { value: "TEACHER", label: "Teacher" },
    { value: "STUDENT", label: "Student" }, // Example: Add more roles
  ];

  const filterOptions = [
    {
      key: "roles",
      label: "Role",
      type: "multiselect" as const,
      options: roleOptions,
    },
  ];

  const actions = [
    {
      key: "edit",
      label: "Edit",
      icon: <Edit className="h-4 w-4" />,
    },
  ];

  const handleRowAction = (action: string, row: User) => {
    if (action === "edit") {
      onEdit(row);
    }
  };

  return (
    <TanstackEnhancedTable<User>
      data={users}
      columns={columns}
      filterOptions={filterOptions}
      searchPlaceholder="Search personnel by name or email..."
      emptyMessage="No personnel found."
      actions={actions}
      onRowAction={handleRowAction}
    />
  );
}
