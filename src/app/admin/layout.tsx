import { ConsoleShell } from "@/components/console";
import { requireStaff } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff("desk");
  return <ConsoleShell staff={staff}>{children}</ConsoleShell>;
}
