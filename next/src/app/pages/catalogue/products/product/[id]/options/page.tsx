"use client";

import { useParams } from "next/navigation";

import { ProductAttributesPanel } from "../../../_components/product-attributes-panel";

export default function ProductOptionsPage() {
  const params = useParams<{ id: string }>();
  return <ProductAttributesPanel productId={String(params.id ?? "")} />;
}
