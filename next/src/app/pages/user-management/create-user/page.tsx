"use client";

import { AdminRoute } from "@/components/admin-route";
import { UserForm } from "@/components/user-form";

export default function CreateUserPage() {
  return (
    <AdminRoute>
      <UserForm title="COMPONENTS.CREATE_USER" />
    </AdminRoute>
  );
}
