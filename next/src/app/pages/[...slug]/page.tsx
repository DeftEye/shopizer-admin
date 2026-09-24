import { ErrorCard } from "@/components/error-card";

export default function PagesCatchAll() {
  return (
    <ErrorCard
      code="404"
      titleKey="NOT_FOUND.PAGE_NOT_FOUND"
      textKey="NOT_FOUND.PAGE_NOT_FOUND_TEXT"
    />
  );
}
