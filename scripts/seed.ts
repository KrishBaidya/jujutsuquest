// Seeds reference data and demo students. Safe to re-run: reference rows are
// upserted and demo users are only given ledger rows the first time.
// Run with: npm run db:seed
import { createHash } from "node:crypto";
import { config } from "dotenv";
import { Pool } from "@neondatabase/serverless";

config({ path: ".env.local" });

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

const hostels = [
  ["sukhna", "Sukhna", "鳳", "#E5322D"],
  ["zakir", "Zakir", "龍", "#3D8BFF"],
  ["tagore", "Tagore", "虎", "#E0B04A"],
  ["shivalik", "Shivalik", "狼", "#5FD0E6"],
  ["nek-chand", "Nek Chand", "鷹", "#3FB68B"],
  ["govind", "Govind", "熊", "#E0508A"],
  ["le-corbusier", "Le Corbusier", "鹿", "#F0813A"],
  ["aravali", "Aravali", "蛇", "#8FA3B8"],
] as const;

// PLACEHOLDERS: coordinates and reference descriptions are to be replaced by the
// scout (A2) with the real pin positions and what is actually visible on site.
const locations = [
  {
    id: "fountain-park",
    name: "Fountain Park",
    kanji: "泉",
    lat: 30.7689,
    lng: 76.5752,
    image: "/locations/fountain-plaza.jpg",
    ref: "An open park with a circular fountain basin at its centre, paved paths around it, lawns and trees, and campus buildings behind.",
    qr: null,
  },
  {
    id: "a3-parking",
    name: "A3 Block Parking",
    kanji: "駐",
    lat: 30.7702,
    lng: 76.5768,
    image: "/locations/fire-station.jpg",
    ref: "An outdoor parking area beside a multi-storey academic block marked A3, with marked bays, parked two-wheelers and cars.",
    qr: null,
  },
  {
    id: "b1-park",
    name: "B1 Park",
    kanji: "園",
    lat: 30.7676,
    lng: 76.5741,
    image: "/locations/night-cafe.jpg",
    ref: "A small landscaped park next to Block B1 with benches, low hedges, a lawn and a walking path.",
    qr: null,
  },
  {
    id: "b1-notice-board",
    name: "Block B1 notice board",
    kanji: "告",
    lat: 30.7679,
    lng: 76.5746,
    image: null,
    ref: "A wall-mounted notice board inside the Block B1 entrance with printed notices and a QR code sheet pinned to it.",
    // The printed code carries this token. Set QR_TOKEN_B1 before seeding for the real one.
    qr: process.env.QR_TOKEN_B1 ?? "cmb-b1-notice-demo",
  },
];

const day = 24 * 60 * 60 * 1000;
const quests = [
  ["fountain-first-light", "First light at Fountain Park", "Find the fountain at the heart of the park and photograph it with the water basin fully in frame.", "explore", "g4", 40, "fountain-park", "photo", "Take a live photo of the fountain basin", false, null],
  ["fountain-daily-bounty", "Daily bounty: the fountain from the far path", "Stand on the far side of the park and capture the fountain with a campus block behind it.", "explore", "g3", 200, "fountain-park", "photo", "Fountain in front, building behind", true, 1],
  ["a3-parking-sweep", "Sweep the A3 Block parking", "Walk to the A3 Block parking and photograph the block sign with the bays in front of it.", "explore", "g4", 60, "a3-parking", "photo", "A3 sign and parking bays in one frame", false, null],
  ["a3-parking-count", "Count the curse marks at A3", "Photograph a full row of marked bays at the A3 parking so the painted numbers are readable.", "skill", "g3", 90, "a3-parking", "photo", "One full row of numbered bays", false, 3],
  ["b1-park-rest", "Ten quiet minutes at B1 Park", "Take a break on a bench in B1 Park and photograph the view from where you sit.", "wellness", "g4", 50, "b1-park", "photo", "The park from a bench", false, null],
  ["b1-park-meet", "Meet someone new at B1 Park", "Find a student you have not met before at B1 Park and photograph the park together (no faces needed).", "social", "g2", 120, "b1-park", "photo", "B1 Park with the lawn visible", false, 5],
  ["b1-notice-seal", "Break the seal on the B1 notice board", "Find the talisman sheet on the Block B1 notice board and scan its code.", "event", "g4", 80, "b1-notice-board", "qr", "Scan the QR code pinned to the board", false, null],
] as const;

const badges = [
  ["first-seal", "First seal", "印", "Complete your first mission.", 1],
  ["four-corners", "Four corners", "探", "Clear all four campus locations.", 2],
  ["black-flash", "Black Flash", "閃", "Land a Black Flash.", 3],
  ["grade-3", "Grade 3", "参", "Reach Grade 3.", 4],
  ["grade-2", "Grade 2", "弐", "Reach Grade 2.", 5],
  ["grade-1", "Grade 1", "壱", "Reach Grade 1.", 6],
  ["seat-holder", "Seat holder", "特", "Hold a Special Grade seat.", 7],
  ["archivist", "Archivist", "蔵", "Share a photo in the Cursed Archive.", 8],
] as const;

const departments = ["Finance", "Analytics", "Marketing", "Operations", "HR", "Insurance"];
// [name, term CE]. The first six clear the Grade 1 bar, so four hold seats and two chase.
const students: [string, number][] = [
  ["Diya Kapoor", 9840], ["Rohan Iyer", 8215], ["Meher Sandhu", 6930], ["Kabir Das", 6410],
  ["Ananya Rao", 5870], ["Ishaan Verma", 5120], ["Sara Thomas", 4620], ["Vivaan Gill", 4310],
  ["Tara Bose", 3980], ["Arjun Nair", 3640], ["Zoya Khan", 3210], ["Dev Malhotra", 2890],
  ["Isha Reddy", 2560], ["Neil Dsouza", 2240], ["Riya Sen", 1980], ["Aditya Jain", 1720],
  ["Pooja Menon", 1560], ["Karan Mehra", 1540], ["Aarav Mehta", 1480], ["Simran Kaur", 1310],
  ["Yash Patel", 1120], ["Naina Roy", 940], ["Om Shukla", 720], ["Leah Pinto", 480],
  ["Farhan Ali", 260],
];

async function main() {
  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const pool = new Pool({ connectionString: url });

  for (const h of hostels) {
    await pool.query(
      `insert into hostels (id, name, crest, color) values ($1,$2,$3,$4)
       on conflict (id) do update set name = excluded.name, crest = excluded.crest, color = excluded.color`,
      [...h],
    );
  }

  for (const l of locations) {
    await pool.query(
      `insert into locations (id, name, kanji, lat, lng, image_url, reference_description, qr_token_hash)
       values ($1,$2,$3,$4,$5,$6,$7,$8)
       on conflict (id) do update set name = excluded.name, kanji = excluded.kanji, lat = excluded.lat,
         lng = excluded.lng, image_url = excluded.image_url,
         reference_description = excluded.reference_description, qr_token_hash = excluded.qr_token_hash`,
      [l.id, l.name, l.kanji, l.lat, l.lng, l.image, l.ref, l.qr ? sha256(l.qr) : null],
    );
  }

  for (const q of quests) {
    const [id, title, description, category, grade, ce, locationId, verification, hint, bounty, days] = q;
    await pool.query(
      `insert into quests (id, title, description, category, grade, ce, location_id, verification, verify_hint, is_bounty, expires_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       on conflict (id) do update set title = excluded.title, description = excluded.description,
         category = excluded.category, grade = excluded.grade, ce = excluded.ce,
         location_id = excluded.location_id, verification = excluded.verification,
         verify_hint = excluded.verify_hint, is_bounty = excluded.is_bounty, expires_at = excluded.expires_at`,
      [id, title, description, category, grade, ce, locationId, verification, hint, bounty,
        days ? new Date(Date.now() + days * day) : null],
    );
  }

  for (const b of badges) {
    await pool.query(
      `insert into badges (id, name, kanji, description, sort) values ($1,$2,$3,$4,$5)
       on conflict (id) do update set name = excluded.name, kanji = excluded.kanji,
         description = excluded.description, sort = excluded.sort`,
      [...b],
    );
  }

  let created = 0;
  for (const [i, [name, ce]] of students.entries()) {
    const uid = `DEMO-${String(i + 1).padStart(4, "0")}`;
    const { rows } = await pool.query(
      `insert into users (uid, name, department, hostel_id, role)
       values ($1,$2,$3,$4,$5) on conflict (uid) do nothing returning id`,
      [uid, name, departments[i % departments.length], hostels[i % hostels.length][0],
        name === "Aarav Mehta" ? "reviewer" : "student"],
    );
    if (!rows[0]) continue; // already seeded: leave their ledger alone
    created++;
    // Split the total so the weekly board differs from the term board.
    const recent = Math.round(ce * (0.08 + ((i * 7) % 10) / 100));
    await pool.query(
      `insert into ce_ledger (user_id, amount, reason, note, created_at) values
         ($1, $2, 'seed', 'Earlier this term', now() - interval '21 days'),
         ($1, $3, 'seed', 'This week', now() - interval '2 days')`,
      [rows[0].id, ce - recent, recent],
    );
  }

  const { rows: counts } = await pool.query(
    `select (select count(*) from users) users, (select count(*) from quests) quests,
            (select count(*) from locations) locations, (select count(*) from ce_ledger) ledger`,
  );
  console.log("seeded", { created, ...counts[0] });
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
