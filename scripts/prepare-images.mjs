// One-off: converts the owner-supplied photos into web-sized files in public/images.
// Usage: node scripts/prepare-images.mjs <sourceDir>
import sharp from "sharp";
import path from "node:path";

const src = process.argv[2];
if (!src) throw new Error("Pass the source directory");
const jobs = [
  ["vslposter.jpg", "vsl-poster.jpg", 1600],
  ["meeting.jpg", "meeting.jpg", 1400],
  ["talk.jpg", "talk.jpg", 1200],
  ["lounge.jpg", "lounge.jpg", 1200],
  ["cap_night.jpg", "merch-cap.jpg", 1000],
  ["tricou-g33-mai-mare.png", "merch-tshirt.jpg", 1000],
  ["Poza cinematica de background.jpg", "hero-bg.jpg", 2200],
  ["Poza de grup principala, cea mai buna.jpg", "group.jpg", 1800],
  ["Poza Grup in actiune.jpg", "group-action.jpg", 1600],
  ["Membrii simtinduse bine.jpg", "members.jpg", 1400],
  ["Vorbind cu un membru.jpg", "conversation.jpg", 1400],
];
for (const [from, to, width] of jobs) {
  const img = sharp(path.join(src, from), { limitInputPixels: false }).rotate();
  const meta = await img.metadata();
  await img
    .resize({ width, withoutEnlargement: true })
    .flatten({ background: "#080808" })
    .jpeg({ quality: 80, mozjpeg: true, progressive: true })
    .toFile(path.join("public/images", to));
  console.log(from, meta.width + "x" + meta.height, "->", to);
}
await sharp(path.join(src, "logo.png")).resize({ width: 512, withoutEnlargement: true }).png().toFile("public/images/logo-g33.png");
console.log("logo done");
