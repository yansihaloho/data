import { Router } from "express";
import { db, predictionsTable, totoResultsTable } from "@workspace/db";
import { desc, eq, and } from "drizzle-orm";

const router = Router();

function formatRow(r: typeof predictionsTable.$inferSelect) {
  return {
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
  };
}

// GET /api/predictions
router.get("/", async (req, res) => {
  const rows = await db.select().from(predictionsTable).orderBy(desc(predictionsTable.createdAt));

  // Auto-fill actuals for any pending predictions where actual is available
  const pending = rows.filter(r => r.actual4d === null);
  if (pending.length > 0) {
    const colMap: Record<string, string> = {
      "0001": "draw0001", "1300": "draw1300", "1600": "draw1600",
      "1900": "draw1900", "2200": "draw2200", "2300": "draw2300",
    };
    for (const pred of pending) {
      const col = colMap[pred.session];
      if (!col) continue;
      const [result] = await db.select().from(totoResultsTable)
        .where(eq(totoResultsTable.drawDate, pred.forDate))
        .limit(1);
      if (!result) continue;
      const actual = result[col as keyof typeof result] as string | null;
      if (!actual || actual.length !== 4) continue;
      const predicted = pred.predicted4d;
      if (!predicted || predicted.length !== 4) continue;
      const asC = predicted[0] === actual[0];
      const kopC = predicted[1] === actual[1];
      const kepC = predicted[2] === actual[2];
      const ekC = predicted[3] === actual[3];
      const score = [asC, kopC, kepC, ekC].filter(Boolean).length;
      await db.update(predictionsTable).set({
        actual4d: actual, asCorrect: asC, kopCorrect: kopC,
        kepalaCorrect: kepC, ekorCorrect: ekC, digitScore: score,
      }).where(eq(predictionsTable.id, pred.id));
      pred.actual4d = actual; pred.asCorrect = asC; pred.kopCorrect = kopC;
      pred.kepalaCorrect = kepC; pred.ekorCorrect = ekC; pred.digitScore = score;
    }
  }

  res.json(rows.map(formatRow));
});

// POST /api/predictions
router.post("/", async (req, res) => {
  const body = req.body as {
    session: string; forDate: string; predicted4d: string; confidence: number;
    signal: string; asP: number; kopP: number; kepalaP: number; ekorP: number; bbfs: string;
  };
  const [row] = await db.insert(predictionsTable).values({
    session: body.session, forDate: body.forDate, predicted4d: body.predicted4d,
    confidence: body.confidence, signal: body.signal, asP: body.asP, kopP: body.kopP,
    kepalaP: body.kepalaP, ekorP: body.ekorP, bbfs: body.bbfs,
  }).returning();
  res.status(201).json(formatRow(row!));
});

// PATCH /api/predictions/:id — manually update actual result
router.patch("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { actual4d } = req.body as { actual4d: string };
  if (!actual4d || actual4d.length !== 4) { res.status(400).json({ error: "actual4d must be 4 digits" }); return; }
  const [pred] = await db.select().from(predictionsTable).where(eq(predictionsTable.id, id)).limit(1);
  if (!pred) { res.status(404).json({ error: "Not found" }); return; }
  const predicted = pred.predicted4d;
  const asC = predicted[0] === actual4d[0];
  const kopC = predicted[1] === actual4d[1];
  const kepC = predicted[2] === actual4d[2];
  const ekC = predicted[3] === actual4d[3];
  const score = [asC, kopC, kepC, ekC].filter(Boolean).length;
  const [updated] = await db.update(predictionsTable).set({
    actual4d, asCorrect: asC, kopCorrect: kopC, kepalaCorrect: kepC, ekorCorrect: ekC, digitScore: score,
  }).where(eq(predictionsTable.id, id)).returning();
  res.json(formatRow(updated!));
});

// DELETE /api/predictions/:id
router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(predictionsTable).where(eq(predictionsTable.id, id));
  res.json({ ok: true });
});

export default router;
