"use client";

import { RoleGate } from "@/components/role-gate";
import { StoreForm } from "@/components/store-form";
import { canAccessCreateStore } from "@/lib/auth/gate";

export default function CreateStorePage() {
  return (
    <RoleGate allow={canAccessCreateStore}>
      <StoreForm titleKey="STORE.STORE_INFORMATION" />
    </RoleGate>
  );
}
