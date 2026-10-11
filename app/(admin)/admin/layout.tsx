import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth/admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await requireAdmin())) notFound();
  return <AdminShell>{children}</AdminShell>;
}
