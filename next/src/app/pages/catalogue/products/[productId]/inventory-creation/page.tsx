"use client";

import { useParams } from "next/navigation";

import { InventoryForm } from "../../_components/inventory-form";

export default function InventoryCreationPage() {
  const params = useParams<{ productId: string }>();
  return (
    <InventoryForm
      productId={String(params.productId ?? "")}
      inventory={{}}
      titleKey="COMPONENTS.INVENTORY"
    />
  );
}
