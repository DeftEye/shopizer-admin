"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProductChildIndexPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(
      `/pages/catalogue/products/product/${params.id}/images`,
    );
  }, [params.id, router]);

  return null;
}
