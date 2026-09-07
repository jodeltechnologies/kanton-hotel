import { requireStaff } from "@/lib/auth";
import { getMenu } from "@/lib/db";
import { deleteFood, saveFood } from "@/app/actions/admin";
import { money } from "@/lib/util";

export const dynamic = "force-dynamic";

export default async function AdminMenu({
  searchParams,
}: { searchParams: Promise<{ edit?: string }> }) {
  await requireStaff("menu");
  const { edit } = await searchParams;
  const menu = await getMenu();
  const item = menu.find((m) => m.id === edit);
  const cats = [...new Set(menu.map((m) => m.category))];

  return (
    <>
      <h2>Food menu</h2>
      {cats.map((c) => (
        <div key={c}>
          <h3 style={{ margin: "20px 0 8px" }}>{c}</h3>
          <div className="tablewrap">
            <table>
              <thead><tr><th>Dish</th><th className="right">Price</th><th>On the menu</th><th /></tr></thead>
              <tbody>
                {menu.filter((m) => m.category === c).map((m) => (
                  <tr key={m.id}>
                    <td><b>{m.name}</b>{m.description && <div className="tiny muted">{m.description}</div>}</td>
                    <td className="right">{money(m.price)}</td>
                    <td>{m.available ? <span className="state s-available">Yes</span>
                                      : <span className="state s-maintenance">Off</span>}</td>
                    <td className="acts">
                      <a className="btn sm ghost" href={`/admin/menu?edit=${m.id}`}>Edit</a>
                      <form action={deleteFood} style={{ display: "inline" }}>
                        <input type="hidden" name="id" value={m.id} />
                        <button className="btn sm danger">Delete</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <form action={saveFood} className="panel pad" style={{ marginTop: 22, maxWidth: 560 }}>
        <h3>{item ? "Edit dish" : "Add a dish"}</h3>
        {item && <input type="hidden" name="id" value={item.id} />}
        <label className="field"><span>Name</span>
          <input type="text" name="name" defaultValue={item?.name ?? ""} required /></label>
        <div className="grid g2" style={{ gap: "0 12px" }}>
          <label className="field"><span>Price (FCFA)</span>
            <input type="number" name="price" min={0} defaultValue={item?.price ?? 1000} /></label>
          <label className="field"><span>Section</span>
            <input type="text" name="category" list="cats" defaultValue={item?.category ?? "Main dishes"} />
            <datalist id="cats">{cats.map((c) => <option key={c} value={c} />)}</datalist></label>
        </div>
        <label className="field"><span>One line of description</span>
          <input type="text" name="description" defaultValue={item?.description ?? ""} /></label>
        <label className="checkline">
          <input type="checkbox" name="available" defaultChecked={item ? item.available : true} />
          <span>Show it on the guest menu</span>
        </label>
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn">Save</button>
          {item && <a className="btn ghost" href="/admin/menu">New dish instead</a>}
        </div>
      </form>
    </>
  );
}
