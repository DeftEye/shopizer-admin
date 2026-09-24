"use client";

import { useParams } from "next/navigation";

import { ProductImagesPanel } from "../../../_components/product-images-panel";

export default function ProductImagesPage() {
  const params = useParams<{ id: string }>();
  return <ProductImagesPanel productId={String(params.id ?? "")} />;
}
