"use client";

import { useParams } from "next/navigation";

import { TypeForm } from "@/components/catalogue/type-form";

export default function TypeDetailsPage() {
  const params = useParams<{ id: string }>();
  return <TypeForm typeId={params.id} />;
}
