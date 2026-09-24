"use client";

import { CurrentStoreForm } from "@/components/store-form";
import { RoleGate } from "@/components/role-gate";
import { canAccessStoreDetails } from "@/lib/auth/gate";

export default function CurrentStorePage() {
  return (
    <RoleGate allow={canAccessStoreDetails}>
      <CurrentStoreForm />
    </RoleGate>
  );
}
