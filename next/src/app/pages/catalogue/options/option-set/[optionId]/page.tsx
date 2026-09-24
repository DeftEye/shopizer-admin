"use client";

import { useParams } from "next/navigation";

import { OptionSetForm } from "@/components/options/option-set-form";

export default function EditOptionSetPage() {
  const params = useParams<{ optionId: string }>();
  return <OptionSetForm optionId={params.optionId} />;
}
