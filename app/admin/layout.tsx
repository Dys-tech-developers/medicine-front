import { AdminLayout } from "@/components/dashboard/AdminLayout";

export default function AdminSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
