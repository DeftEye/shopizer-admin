"use client";

import { useParams } from "next/navigation";

import { PriceForm } from "../../../../../_components/price-form";

export default function EditPricePage() {
  const params = useParams<{
    productId: string;
    inventoryId: string;
    priceId: string;
  }>();
  return (
    <PriceForm
      productId={String(params.productId ?? "")}
      inventoryId={String(params.inventoryId ?? "")}
      priceId={String(params.priceId ?? "")}
    />
  );
}
