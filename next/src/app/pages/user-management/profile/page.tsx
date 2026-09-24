"use client";

import { useEffect, useState } from "react";

import { UserForm } from "@/components/user-form";
import type { UserProfile } from "@/lib/api/types";
import { getUserProfile } from "@/lib/api/users";

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserProfile()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !user?.id) {
    return null;
  }

  return <UserForm user={user} title="COMPONENTS.PROFILE" />;
}
