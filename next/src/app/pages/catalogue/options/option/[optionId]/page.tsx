"use client";

import { useParams } from "next/navigation";

import { OptionForm } from "@/components/options/option-form";

export default function EditOptionPage() {
  const params = useParams<{ optionId: string }>();
  return <OptionForm optionId={params.optionId} />;
}
