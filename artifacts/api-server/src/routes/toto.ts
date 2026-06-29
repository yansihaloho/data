import { Router } from "express";
import { db, totoResultsTable, predictionsTable, nomorTaruhanTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";

const router = Router();

const DAY_NAMES = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
const MONTH_NAMES = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const DRAW_LABELS: Record<string, string> = {
  "0001":"00:01","1300":"13:00","1600":"16:00","1900":"19:00","2200":"22:00","2300":"23:00",
};

function formatRow(row: typeof totoResultsTable.$inferSelect) {
  return {
    drawDate: row.drawDate,
    dayName: row.dayName,
    draw0001: row.draw0001,
    draw1300: row.draw1300,
    draw1600: row.draw1600,
    draw1900: row.draw1900,
    draw2200: row.draw2200,
    draw2300: row.draw2300,
  };
}

// GET /api/toto/latest
router.get("/latest", async (req, res) => {
  const rows = await db.select().from(totoResultsTable).orderBy(desc(totoResultsTable.drawDate)).limit(1);
  if (!rows.length) {
    res.status(404).json({ error: "No data" });
    return;
  }
  res.json(formatRow(rows[0]));
});

// GET /api/toto/months
router.get("/months", async (req, res) => {
  const rows = await db.select().from(totoResultsTable).orderBy(desc(totoResultsTable.drawDate));
  const monthMap = new Map<string, { year: number; month: number; results: typeof rows }>();
  for (const row of rows) {
    const d = new Date(row.drawDate);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    if (!monthMap.has(key)) {
      monthMap.set(key, { year: d.getFullYear(), month: d.getMonth() + 1, results: [] });
    }
    monthMap.get(key)!.results.push(row);
  }
  const result = Array.from(monthMap.values()).map(g => ({
    year: g.year,
    month: g.month,
    monthName: MONTH_NAMES[g.month - 1],
    totalDays: g.results.length,
    results: g.results.map(formatRow),
  }));
  res.json(result);
});

// GET /api/toto/schedule
router.get("/schedule", (_req, res) => {
  res.json({ drawTimes: Object.values(DRAW_LABELS) });
});

// POST /api/toto/refresh
router.post("/refresh", async (req, res) => {
  try {
    const newRecords = await seedRecentData();
    res.json({ message: "Data refreshed", newRecords });
  } catch (err: any) {
    req.log.error({ err }, "Refresh failed");
    res.status(500).json({ error: "Refresh failed: " + err.message });
  }
});

// GET /api/toto/nomor-taruhan
router.get("/nomor-taruhan", async (_req, res) => {
  const rows = await db.select().from(nomorTaruhanTable).limit(1);
  if (!rows.length) {
    res.json({ numbers: [] });
    return;
  }
  const nums = rows[0].numbers ? rows[0].numbers.split(",").filter(Boolean) : [];
  res.json({ numbers: nums });
});

// PUT /api/toto/nomor-taruhan
router.put("/nomor-taruhan", async (req, res) => {
  const { numbers } = req.body as { numbers: string[] };
  const str = Array.isArray(numbers) ? numbers.join(",") : "";
  const rows = await db.select().from(nomorTaruhanTable).limit(1);
  if (rows.length) {
    await db.update(nomorTaruhanTable).set({ numbers: str });
  } else {
    await db.insert(nomorTaruhanTable).values({ numbers: str });
  }
  res.json({ numbers: str ? str.split(",").filter(Boolean) : [] });
});

function rnd4d() {
  return String(Math.floor(Math.random() * 10000)).padStart(4, "0");
}

async function seedRecentData(): Promise<number> {
  let inserted = 0;
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const isToday = i === 0;

    try {
      await db.insert(totoResultsTable).values({
        drawDate: dateStr,
        dayName: DAY_NAMES[d.getDay()],
        draw0001: rnd4d(),
        draw1300: rnd4d(),
        draw1600: rnd4d(),
        draw1900: isToday ? null : rnd4d(),
        draw2200: isToday ? null : rnd4d(),
        draw2300: isToday ? null : rnd4d(),
      }).onConflictDoNothing();
      inserted++;
    } catch {
      // already exists
    }
  }
  return inserted;
}

export default router;
