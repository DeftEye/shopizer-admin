import { ErrorCard } from "@/components/error-card";

export default function Error500Page() {
  return (
    <ErrorCard
      code="500"
      titleKey="ERROR.SYSTEM_ERROR"
      textKey="ERROR.SYSTEM_ERROR_TEXT"
    />
  );
}
