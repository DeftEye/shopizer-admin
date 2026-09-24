"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { RoleGate } from "@/components/role-gate";
import { StoreForm } from "@/components/store-form";
import { getStore } from "@/lib/api/store";
import type { StoreDetails } from "@/lib/api/types";
import { canAccessStoreDetails } from "@/lib/auth/gate";

export default function StoreDetailPage() {
  return (
    <RoleGate allow={canAccessStoreDetails}>
      <StoreByCode />
    </RoleGate>
  );
}

function StoreByCode() {
  const params = useParams<{ code: string }>();
  const [store, setStore] = useState<StoreDetails | null>(null);

  useEffect(() => {
    if (!params.code) {
      return;
    }
    getStore(params.code).then(setStore);
  }, [params.code]);

  if (!store) {
    return null;
  }

  return <StoreForm store={store} titleKey="STORE.STORE_INFORMATION" showCancel />;
}
