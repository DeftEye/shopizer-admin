"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { CategoryForm } from "@/components/category-form";
import { useI18n } from "@/components/i18n-provider";
import { getCategoryById, readApiErrorMessage } from "@/lib/api/categories";
import type { CategoryDetail } from "@/lib/catalogue/types";

export default function CategoryDetailPage() {
  const params = useParams<{ id: string }>();
  const { t } = useI18n();
  const [category, setCategory] = useState<CategoryDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCategoryById(params.id)
      .then((result) => {
        if (!cancelled) {
          setCategory(result);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(readApiErrorMessage(err, t("COMMON.INTERNAL_SERVER_ERROR")));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [params.id, t]);

  if (error) {
    return <p role="alert">{error}</p>;
  }
  if (!category?.id) {
    return null;
  }
  return <CategoryForm category={category} />;
}
