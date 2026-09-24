"use client";

import { useParams } from "next/navigation";

import { BrandForm } from "@/components/catalogue/brand-form";

export default function BrandDetailsPage() {
  const params = useParams<{ id: string }>();
  return <BrandForm brandId={params.id} titleKey="COMPONENTS.BRAND" />;
}
