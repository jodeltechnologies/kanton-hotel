import { requireStaff } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ROLES } from "@/lib/roles";
import { deleteStaff, toggleStaff, updateStaff } from "@/app/actions/admin";
import { NewStaffForm, ResetPasswordForm } from "./StaffForms";
import { stamp } from "@/lib/util";
import type { Staff } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const me = await requireStaff("*");
  const { data } = await supabaseAdmin().from("staff").select("*").order("created_at");
  const staff = (data ?? []) as Staff[];

  return (
    <>
      <h2>Staff accounts</h2>
      <p className="small muted">
        Each person signs in with their own work email. Roles decide what they can touch.
      </p>

      <div className="tablewrap" style={{ marginTop: 16 }}>
        <table>
          <thead><tr><th>Name</th><th>Role</th><th>Phone</th><th>Status</th><th>Password</th><th /></tr></thead>
          <tbody>
            {staff.map((u) => (
              <tr key={u.id}>
                <td>
                  <b>{u.full_name}</b>
                  <div className="tiny muted">
                    {u.username} · {u.last_login ? "last in " + stamp(u.last_login) : "never signed in"}
                  </div>
                </td>
                <td>
                  <form action={updateStaff} className="row" style={{ gap: 6, flexWrap: "nowrap" }}>
                    <input type="hidden" name="id" value={u.id} />
                    <input type="hidden" name="full_name" value={u.full_name} />
                    <input type="hidden" name="phone" value={u.phone} />
                    <select name="role" defaultValue={u.role} disabled={u.role === "owner"}>
                      {Object.entries(ROLES).map(([k, r]) => <option key={k} value={k}>{r.label}</option>)}
                    </select>
                    {u.role !== "owner" && <button className="btn sm ghost">Save</button>}
                  </form>
                  <div className="tiny muted">{ROLES[u.role]?.desc}</div>
                </td>
                <td>{u.phone || "—"}</td>
                <td>{u.active
                  ? <span className="state s-available">Active</span>
                  : <span className="state s-maintenance">Off</span>}</td>
                <td><ResetPasswordForm id={u.id} name={u.full_name} /></td>
                <td className="acts">
                  {u.role !== "owner" && u.id !== me.id && (
                    <>
                      <form action={toggleStaff} style={{ display: "inline" }}>
                        <input type="hidden" name="id" value={u.id} />
                        <input type="hidden" name="active" value={String(u.active)} />
                        <button className="btn sm ghost">{u.active ? "Switch off" : "Switch on"}</button>
                      </form>
                      <form action={deleteStaff} style={{ display: "inline" }}>
                        <input type="hidden" name="id" value={u.id} />
                        <button className="btn sm danger">Delete</button>
                      </form>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <NewStaffForm />

      <div className="panel pad" style={{ marginTop: 20 }}>
        <h3>What each role can do</h3>
        {Object.values(ROLES).map((r) => (
          <div className="sumline" key={r.label}>
            <span><b>{r.label}</b><div className="small muted">{r.desc}</div></span>
          </div>
        ))}
      </div>
    </>
  );
}
