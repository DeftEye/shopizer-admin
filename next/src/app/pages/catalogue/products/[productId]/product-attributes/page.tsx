"use client";

import { useParams } from "next/navigation";

import { ProductAttributesPanel } from "../../_components/product-attributes-panel";

export default function ProductAttributesPage() {
  const params = useParams<{ productId: string }>();
  return <ProductAttributesPanel productId={String(params.productId ?? "")} />;
}
