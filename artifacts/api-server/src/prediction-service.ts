import { db, totoResultsTable, predictionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { logger } from "./lib/logger";
import { runPrediction, type DrawTime } from "./prediction-engine";

const DRAW_TIMES: DrawTime[] = ["0001", "1300", "1600", "1900", "2200", "2300"];

/**
 * Load all historical rows from DB and run prediction for a given session.
 * Saves to DB if no prediction exists yet for (forDate, session).
 * Returns the prediction id or null if already exists / insufficient data.
 */
export async function generateAndSavePrediction(
  forDate: string,
  session: DrawTime
): Promise<number | null> {
  // Check if prediction already exists
  const existing = await db
    .select({ id: predictionsTable.id })
    .from(predictionsTable)
    .where(and(eq(predictionsTable.forDate, forDate), eq(predictionsTable.session, session)))
    .limit(1);

  if (existing.length > 0) {
    logger.info({ forDate, session }, "Prediction already exists — skipping");
    return null;
  }

  // Load all historical data
  const rows = await db
    .select()
    .from(totoResultsTable)
    .orderBy(totoResultsTable.drawDate);

  const formatted = rows.map(r => ({
    drawDate: r.drawDate,
    draw0001: r.draw0001,
    draw1300: r.draw1300,
    draw1600: r.draw1600,
    draw1900: r.draw1900,
    draw2200: r.draw2200,
    draw2300: r.draw2300,
  }));

  const result = runPrediction(formatted, session);
  if (!result) {
    logger.warn({ forDate, session, dataRows: rows.length }, "Insufficient data for prediction");
    return null;
  }

  const [saved] = await db.insert(predictionsTable).values({
    session,
    forDate,
    predicted4d: result.predicted4D,
    confidence: result.confidence,
    signal: result.signal ? "yes" : "no",
    asP: result.asP,
    kopP: result.kopP,
    kepalaP: result.kepalaP,
    ekorP: result.ekorP,
    bbfs: result.bbfs,
  }).returning({ id: predictionsTable.id });

  logger.info({ forDate, session, predicted4D: result.predicted4D, confidence: result.confidence, id: saved?.id }, "Prediction saved");
  return saved?.id ?? null;
}

/**
 * After a draw result is in, find all predictions for (forDate, session) 
 * that don't have an actual result yet and fill them in.
 */
export async function updateActualResults(
  forDate: string,
  session: DrawTime,
  actual4d: string
): Promise<void> {
  // Find all pending predictions for this date + session
  const preds = await db
    .select()
    .from(predictionsTable)
    .where(
      and(
        eq(predictionsTable.forDate, forDate),
        eq(predictionsTable.session, session)
      )
    );

  const pending = preds.filter(p => p.actual4d === null);
  if (!pending.length) return;

  if (actual4d.length !== 4) {
    logger.warn({ forDate, session, actual4d }, "Invalid actual4d length, skipping update");
    return;
  }

  for (const pred of pending) {
    const predicted = pred.predicted4d;
    if (!predicted || predicted.length !== 4) continue;

    const asCorrect = predicted[0] === actual4d[0];
    const kopCorrect = predicted[1] === actual4d[1];
    const kepalaCorrect = predicted[2] === actual4d[2];
    const ekorCorrect = predicted[3] === actual4d[3];
    const digitScore = [asCorrect, kopCorrect, kepalaCorrect, ekorCorrect].filter(Boolean).length;

    await db
      .update(predictionsTable)
      .set({
        actual4d,
        asCorrect,
        kopCorrect,
        kepalaCorrect,
        ekorCorrect,
        digitScore,
      })
      .where(eq(predictionsTable.id, pred.id));

    logger.info(
      { id: pred.id, forDate, session, predicted: predicted, actual: actual4d, digitScore },
      "Prediction actual updated"
    );
  }
}

/**
 * Generate predictions for ALL upcoming draw times today (if not already saved).
 * Called at startup to catch up on any missing predictions.
 */
export async function generateTodayPredictions(todayWIB: string): Promise<void> {
  logger.info({ todayWIB }, "Generating today predictions for all sessions");
  for (const session of DRAW_TIMES) {
    try {
      await generateAndSavePrediction(todayWIB, session);
    } catch (err) {
      logger.error({ err, session, todayWIB }, "Failed to generate prediction");
    }
  }
}
