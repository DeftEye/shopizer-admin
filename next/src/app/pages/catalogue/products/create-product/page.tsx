"use client";

import { ProductForm } from "@/components/catalogue/product-form";
import type { ProductDetail } from "@/lib/catalogue/types";

const EMPTY_PRODUCT: ProductDetail = {};

export default function CreateProductPage() {
  return (
    <ProductForm product={EMPTY_PRODUCT} titleKey="COMPONENTS.CREATE_PRODUCT" />
  );
}
