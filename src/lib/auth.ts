import { redirect } from "next/navigation";
import { supabaseServer } from "./supabase/server";
import { supabaseAdmin } from "./supabase/admin";
import { can } from "./roles";
import type { Staff } from "./types";

/** The signed-in staff member, or null. */
export async function currentStaff(): Promise<Staff | null> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await supabaseAdmin().from("staff").select("*").eq("id", user.id).single();
  if (!data || !data.active) return null;
  return data as Staff;
}

/** Use at the top of every staff page and action. */
export async function requireStaff(perm?: string): Promise<Staff> {
  const staff = await currentStaff();
  if (!staff) redirect("/login");
  if (perm && !can(staff.role, perm)) redirect("/desk?denied=1");
  return staff;
}
