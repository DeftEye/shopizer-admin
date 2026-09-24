"use client";

import { useParams } from "next/navigation";

import { PriceForm } from "../../../../_components/price-form";

export default function CreatePricePage() {
  const params = useParams<{ productId: string; inventoryId: string }>();
  return (
    <PriceForm
      productId={String(params.productId ?? "")}
      inventoryId={String(params.inventoryId ?? "")}
    />
  );
}
