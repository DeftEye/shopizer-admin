import { PagesShell } from "@/components/pages-shell";

export default function PagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PagesShell>{children}</PagesShell>;
}
