"use client";

import { useParams } from "next/navigation";

import { OptionValueForm } from "@/components/options/option-value-form";

export default function EditOptionValuePage() {
  const params = useParams<{ optionValueId: string }>();
  return <OptionValueForm optionValueId={params.optionValueId} />;
}
