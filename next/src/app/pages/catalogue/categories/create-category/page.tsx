"use client";

import { CategoryForm } from "@/components/category-form";
import type { CategoryDetail } from "@/lib/categories/types";

const EMPTY_CATEGORY: Partial<CategoryDetail> = {};

export default function CreateCategoryPage() {
  return <CategoryForm category={EMPTY_CATEGORY} />;
}
