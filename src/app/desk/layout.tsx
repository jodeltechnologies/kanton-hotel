import { ConsoleShell } from "@/components/console";
import { requireStaff } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function DeskLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff("desk");
  const { count } = await supabaseAdmin().from("reservations")
    .select("id", { count: "exact", head: true }).eq("payment_status", "reported");
  return <ConsoleShell staff={staff} pending={count ?? 0}>{children}</ConsoleShell>;
}
