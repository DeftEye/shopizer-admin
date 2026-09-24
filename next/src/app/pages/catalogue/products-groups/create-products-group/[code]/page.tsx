"use client";

import { useParams } from "next/navigation";

import { GroupForm } from "@/components/catalogue/group-form";

export default function EditProductGroupPage() {
  const params = useParams<{ code: string }>();
  return <GroupForm groupCode={params.code} />;
}
