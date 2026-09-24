"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import {
  getInventoryById,
  type InventoryItem,
} from "@/lib/api/product-children";

import { InventoryForm } from "../../../_components/inventory-form";

export default function InventoryDetailsPage() {
  const params = useParams<{ productId: string; inventoryId: string }>();
  const [inventory, setInventory] = useState<InventoryItem | null>(null);

  useEffect(() => {
    void getInventoryById(params.productId, params.inventoryId).then((res) =>
      setInventory({ ...res }),
    );
  }, [params.inventoryId, params.productId]);

  if (!inventory?.id) {
    return <p>…</p>;
  }

  return (
    <InventoryForm
      productId={String(params.productId ?? "")}
      inventory={inventory}
      titleKey="COMPONENTS.INVENTORY"
    />
  );
}
