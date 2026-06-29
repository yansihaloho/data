import { Router } from "express";
import { db, predictionsTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";

const router = Router();

// GET /api/predictions
router.get("/", async (req, res) => {
  const rows = await db.select().from(predictionsTable).orderBy(desc(predictionsTable.createdAt));
  res.json(rows.map(r => ({
    id: r.id,
    session: r.session,
    forDate: r.forDate,
    predicted4d: r.predicted4d,
    confidence: r.confidence,
    signal: r.signal,
    asP: r.asP,
    kopP: r.kopP,
    kepalaP: r.kepalaP,
    ekorP: r.ekorP,
    bbfs: r.bbfs,
    createdAt: r.createdAt.toISOString(),
    actual4d: r.actual4d,
    asCorrect: r.asCorrect,
    kopCorrect: r.kopCorrect,
    kepalaCorrect: r.kepalaCorrect,
    ekorCorrect: r.ekorCorrect,
    digitScore: r.digitScore,
  })));
});

// POST /api/predictions
router.post("/", async (req, res) => {
  const body = req.body as {
    session: string;
    forDate: string;
    predicted4d: string;
    confidence: number;
    signal: string;
    asP: number;
    kopP: number;
    kepalaP: number;
    ekorP: number;
    bbfs: string;
  };

  const [row] = await db.insert(predictionsTable).values({
    session: body.session,
    forDate: body.forDate,
    predicted4d: body.predicted4d,
    confidence: body.confidence,
    signal: body.signal,
    asP: body.asP,
    kopP: body.kopP,
    kepalaP: body.kepalaP,
    ekorP: body.ekorP,
    bbfs: body.bbfs,
  }).returning();

  res.status(201).json({
    id: row.id,
    session: row.session,
    forDate: row.forDate,
    predicted4d: row.predicted4d,
    confidence: row.confidence,
    signal: row.signal,
    asP: row.asP,
    kopP: row.kopP,
    kepalaP: row.kepalaP,
    ekorP: row.ekorP,
    bbfs: row.bbfs,
    createdAt: row.createdAt.toISOString(),
    actual4d: row.actual4d,
    asCorrect: row.asCorrect,
    kopCorrect: row.kopCorrect,
    kepalaCorrect: row.kepalaCorrect,
    ekorCorrect: row.ekorCorrect,
    digitScore: row.digitScore,
  });
});

// DELETE /api/predictions/:id
router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(predictionsTable).where(eq(predictionsTable.id, id));
  res.json({ ok: true });
});

export default router;
