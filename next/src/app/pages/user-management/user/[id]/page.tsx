"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { AdminRoute } from "@/components/admin-route";
import { UserForm } from "@/components/user-form";
import type { UserProfile } from "@/lib/api/types";
import { getUser } from "@/lib/api/users";

export default function UserDetailsPage() {
  const params = useParams<{ id: string }>();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) {
      return;
    }
    getUser(params.id)
      .then(setUser)
      .finally(() => setLoading(false));
  }, [params.id]);

  return (
    <AdminRoute>
      {loading || !user?.id ? null : (
        <UserForm user={user} title="COMPONENTS.USER_DETAILS" />
      )}
    </AdminRoute>
  );
}
