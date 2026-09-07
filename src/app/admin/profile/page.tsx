import { requireStaff } from "@/lib/auth";
import { ROLES } from "@/lib/roles";
import { saveProfile } from "@/app/actions/admin";
import { PasswordForm } from "./ProfileForms";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { fcfa } from "@/lib/util";

export const dynamic = "force-dynamic";

export default async function Profile() {
  const me = await requireStaff();
  const { data } = await supabaseAdmin().from("payments").select("amount").eq("taken_by", me.id);
  const taken = (data ?? []).reduce((a, p) => a + p.amount, 0);

  return (
    <>
      <h2>My profile</h2>
      <div className="grid g2" style={{ marginTop: 18, alignItems: "start" }}>
        <div className="panel pad">
          <div className="row">
            <div className="avatar">{me.full_name.slice(0, 1).toUpperCase()}</div>
            <div>
              <b className="slab" style={{ fontSize: "1.2rem" }}>{me.full_name}</b>
              <div className="small muted">{ROLES[me.role].label} · {me.username}</div>
            </div>
          </div>
          <hr />
          <form action={saveProfile}>
            <label className="field"><span>Name</span>
              <input type="text" name="full_name" defaultValue={me.full_name} /></label>
            <label className="field"><span>Phone</span>
              <input type="tel" name="phone" defaultValue={me.phone} /></label>
            <button className="btn">Save my details</button>
          </form>
        </div>
        <div className="panel pad">
          <h3>Change my password</h3>
          <PasswordForm />
          <hr />
          <h3>My work</h3>
          <div className="sumline"><span className="muted">Payments I have taken</span><b>{fcfa(taken)}</b></div>
          <div className="sumline"><span className="muted">Receipts issued</span><b>{(data ?? []).length}</b></div>
        </div>
      </div>
    </>
  );
}
