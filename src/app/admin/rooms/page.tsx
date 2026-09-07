import { requireStaff } from "@/lib/auth";
import { getRooms } from "@/lib/db";
import { deleteRoom, deleteRoomMedia, saveRoom, uploadRoomMedia } from "@/app/actions/admin";
import { mediaUrl, money, titleCase } from "@/lib/util";
import type { Room } from "@/lib/types";

export const dynamic = "force-dynamic";

/** The photographs that ship with the site. Anything else is an upload. */
const BUNDLED = ["hero", "facade", "wing", "entrance", "lobby", "lounge", "sitting", "bed", "pillows", "armchair", "desk"];
const CATS = [["standard", "Standard"], ["modern", "Modern standard"], ["vip", "V.I.P"], ["executive", "Executive V.I.P"]] as const;
const isUpload = (p: string) => !BUNDLED.includes(p);

export default async function AdminRooms({
  searchParams,
}: { searchParams: Promise<{ edit?: string; add?: string }> }) {
  await requireStaff("rooms");
  const { edit, add } = await searchParams;
  const rooms = await getRooms();
  const room = rooms.find((r) => r.id === edit);
  const uploaded = room ? room.photos.filter(isUpload) : [];

  return (
    <>
      <div className="spread">
        <h2>Rooms &amp; prices</h2>
        <a className="btn" href="/admin/rooms?add=1">Add a room</a>
      </div>
      <p className="small muted" style={{ marginTop: 6 }}>
        Change the number, the price, what the room offers, and the photographs or walk-through video guests see.
      </p>

      <div className="tablewrap" style={{ marginTop: 16 }}>
        <table>
          <thead><tr><th>Room</th><th>Category</th><th className="right">Price / night</th>
            <th>Sleeps</th><th>Media</th><th>On sale</th><th /></tr></thead>
          <tbody>
            {rooms.map((r) => (
              <tr key={r.id}>
                <td><b>{r.number}</b><div className="tiny muted">{r.name} · floor {r.floor}</div></td>
                <td>{titleCase(r.category)}</td>
                <td className="right"><b>{money(r.price)}</b></td>
                <td>{r.capacity}</td>
                <td>{r.photos.length} photo{r.photos.length > 1 ? "s" : ""}
                  {r.videos?.length ? <div className="tiny muted">{r.videos.length} video</div> : null}</td>
                <td>{r.active ? <span className="state s-available">Yes</span>
                              : <span className="state s-maintenance">Hidden</span>}</td>
                <td className="acts">
                  <a className="btn sm ghost" href={`/admin/rooms?edit=${r.id}`}>Edit</a>
                  <form action={deleteRoom} style={{ display: "inline" }}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="btn sm danger">Delete</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(room || add) && (
        <>
          <form action={saveRoom} className="panel pad" style={{ marginTop: 20 }}>
            <h3>{room ? `Room ${room.number}` : "New room"}</h3>
            {room && <input type="hidden" name="id" value={room.id} />}

            <div className="grid g2" style={{ gap: "0 14px" }}>
              <label className="field"><span>Room number</span>
                <input type="text" name="number" defaultValue={room?.number ?? ""} required /></label>
              <label className="field"><span>What it is called</span>
                <input type="text" name="name" defaultValue={room?.name ?? "Standard room"} /></label>
              <label className="field"><span>Category</span>
                <select name="category" defaultValue={room?.category ?? "standard"}>
                  {CATS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select></label>
              <label className="field"><span>Price per night (FCFA)</span>
                <input type="number" name="price" min={0} defaultValue={room?.price ?? 13000} /></label>
              <label className="field"><span>Floor</span>
                <input type="number" name="floor" min={0} max={9} defaultValue={room?.floor ?? 1} /></label>
              <label className="field"><span>Sleeps</span>
                <input type="number" name="capacity" min={1} max={6} defaultValue={room?.capacity ?? 2} /></label>
              <label className="field"><span>Bed</span>
                <input type="text" name="bed" defaultValue={room?.bed ?? "1 queen bed"} /></label>
              <label className="field"><span>Status</span>
                <select name="status" defaultValue={room?.status ?? "available"}>
                  <option value="available">available</option><option value="cleaning">cleaning</option>
                  <option value="maintenance">maintenance</option><option value="occupied">occupied</option>
                </select></label>
            </div>

            <label className="field"><span>Description guests read</span>
              <textarea name="description" defaultValue={room?.description ?? ""} /></label>
            <label className="field"><span>What this room offers — one per line</span>
              <textarea name="amenities" rows={8} defaultValue={(room?.amenities ?? [
                "Free unlimited internet", "Smart TV", "Air conditioning", "Private bathroom",
                "Tea & coffee tray", "Daily housekeeping", "24-hour reception",
              ]).join("\n")} /></label>

            <span className="small" style={{ fontWeight: 600, color: "var(--muted)" }}>
              House photographs to show for this room
            </span>
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(96px,1fr))", gap: 8, margin: "8px 0 14px" }}>
              {BUNDLED.map((k) => (
                <label key={k} style={{ cursor: "pointer", textAlign: "center" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mediaUrl(k)} alt={k}
                    style={{ width: "100%", aspectRatio: 1, objectFit: "cover", borderRadius: "var(--r)", border: "1px solid var(--line)" }} />
                  <input type="checkbox" name="photos" value={k}
                    defaultChecked={room ? room.photos.includes(k) : k === "bed"} style={{ marginTop: 4 }} />
                  <span className="tiny muted" style={{ display: "block" }}>{k}</span>
                </label>
              ))}
            </div>

            {/* keeps the uploaded media attached when the room is saved */}
            {uploaded.map((u) => <input key={u} type="hidden" name="photos" value={u} />)}
            {(room?.videos ?? []).map((v) => <input key={v} type="hidden" name="videos" value={v} />)}

            <label className="checkline">
              <input type="checkbox" name="active" defaultChecked={room ? room.active : true} />
              <span>Show this room on the guest site</span>
            </label>
            <div className="row" style={{ marginTop: 8 }}>
              <button className="btn">Save room</button>
              <a className="btn ghost" href="/admin/rooms">Cancel</a>
            </div>
          </form>

          {room ? (
            <div className="panel pad" style={{ marginTop: 18 }}>
              <h3>Photos and video of room {room.number}</h3>
              <p className="small muted">
                Photographs up to 8&nbsp;MB, video up to 60&nbsp;MB (mp4 or webm). Guests see them in the order they were added.
              </p>

              <form action={uploadRoomMedia} className="row" style={{ margin: "12px 0 18px" }}>
                <input type="hidden" name="id" value={room.id} />
                <input type="file" name="files" multiple accept="image/*,video/mp4,video/webm" style={{ maxWidth: 340 }} />
                <button className="btn">Upload</button>
              </form>

              {uploaded.length + (room.videos?.length ?? 0) === 0 ? (
                <p className="small muted">Nothing uploaded yet — the room is using the house photographs above.</p>
              ) : (
                <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10 }}>
                  {uploaded.map((u) => (
                    <div key={u}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={u} alt="Room photo"
                        style={{ width: "100%", aspectRatio: 4 / 3, objectFit: "cover", borderRadius: "var(--r)" }} />
                      <form action={deleteRoomMedia}>
                        <input type="hidden" name="id" value={room.id} />
                        <input type="hidden" name="url" value={u} />
                        <button className="btn sm danger block" style={{ marginTop: 4 }}>Remove</button>
                      </form>
                    </div>
                  ))}
                  {(room.videos ?? []).map((v) => (
                    <div key={v}>
                      <video src={v} controls muted preload="metadata"
                        style={{ width: "100%", aspectRatio: 4 / 3, objectFit: "cover", borderRadius: "var(--r)", background: "#000" }} />
                      <form action={deleteRoomMedia}>
                        <input type="hidden" name="id" value={room.id} />
                        <input type="hidden" name="url" value={v} />
                        <button className="btn sm danger block" style={{ marginTop: 4 }}>Remove video</button>
                      </form>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="notice" style={{ marginTop: 18 }}>
              Save the room first. Photographs and video can be uploaded once it exists.
            </div>
          )}
        </>
      )}
    </>
  );
}
