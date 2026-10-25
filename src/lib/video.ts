export type VideoSource = { kind: "youtube"; id: string } | { kind: "file"; src: string } | null;

/** Parses a configured video URL. Unknown/invalid URLs return null (nothing rendered). */
export function parseVideoUrl(url: string | null | undefined): VideoSource {
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return url.startsWith("/") && /\.(mp4|webm)$/i.test(url) ? { kind: "file", src: url } : null;
  }
  if (u.protocol !== "https:") return null;
  const host = u.hostname.replace(/^www\.|^m\./, "");
  let id: string | null = null;
  if (host === "youtu.be") id = u.pathname.slice(1);
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (u.pathname === "/watch") id = u.searchParams.get("v");
    else {
      const m = u.pathname.match(/^\/(embed|shorts|live)\/([^/?#]+)/);
      id = m?.[2] ?? null;
    }
  }
  if (id && /^[A-Za-z0-9_-]{11}$/.test(id)) return { kind: "youtube", id };
  if (/\.(mp4|webm)$/i.test(u.pathname)) return { kind: "file", src: u.toString() };
  return null;
}
