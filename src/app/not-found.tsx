import Link from "next/link";

export default function NotFound() {
  return (
    <main className="wrap section narrow" style={{ textAlign: "center" }}>
      <h2>That page is not on the board</h2>
      <p className="muted">The link may be old, or the booking code wrong.</p>
      <p><Link className="btn" href="/">Back to the hotel</Link></p>
    </main>
  );
}
