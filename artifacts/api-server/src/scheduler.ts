import { db, totoResultsTable, predictionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { logger } from "./lib/logger";
import { generateAndSavePrediction, updateActualResults, generateTodayPredictions } from "./prediction-service";
import type { DrawTime } from "./prediction-engine";

const DAY_NAMES = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];

// [drawHour, drawMinute, predHour, predMinute] — generate prediction 30 min before draw
const DRAW_SCHEDULE: Array<{
  dHour: number; dMinute: number; colKey: string; session: DrawTime;
  pHour: number; pMinute: number;
}> = [
  { dHour: 0,  dMinute: 1,  colKey: "draw0001", session: "0001", pHour: 23, pMinute: 31 },
  { dHour: 13, dMinute: 0,  colKey: "draw1300", session: "1300", pHour: 12, pMinute: 30 },
  { dHour: 16, dMinute: 0,  colKey: "draw1600", session: "1600", pHour: 15, pMinute: 30 },
  { dHour: 19, dMinute: 0,  colKey: "draw1900", session: "1900", pHour: 18, pMinute: 30 },
  { dHour: 22, dMinute: 0,  colKey: "draw2200", session: "2200", pHour: 21, pMinute: 30 },
  { dHour: 23, dMinute: 0,  colKey: "draw2300", session: "2300", pHour: 22, pMinute: 30 },
];

function rnd4d(): string {
  return String(Math.floor(Math.random() * 10000)).padStart(4, "0");
}

function getWIBContext(): { wibHour: number; wibMinute: number; dateStr: string; dayName: string; prevDateStr: string } {
  const now = new Date();
  const wibOffsetMs = 7 * 60 * 60 * 1000;
  const wib = new Date(now.getTime() + wibOffsetMs);
  const dateStr = wib.toISOString().split("T")[0]!;
  const prev = new Date(wib.getTime() - 24 * 60 * 60 * 1000);
  return {
    wibHour: wib.getUTCHours(),
    wibMinute: wib.getUTCMinutes(),
    dateStr,
    dayName: DAY_NAMES[wib.getUTCDay()]!,
    prevDateStr: prev.toISOString().split("T")[0]!,
  };
}

async function checkAndGenerateDraw(): Promise<void> {
  const { wibHour, wibMinute, dateStr, dayName, prevDateStr } = getWIBContext();

  for (const slot of DRAW_SCHEDULE) {
    // 1. Generate prediction 30 min before draw
    if (wibHour === slot.pHour && wibMinute === slot.pMinute) {
      // For 00:01 slot, prediction is generated on previous calendar day at 23:31
      const predForDate = slot.session === "0001" ? dateStr : dateStr;
      logger.info({ predForDate, session: slot.session }, "Prediction window — generating prediction");
      try {
        await generateAndSavePrediction(predForDate, slot.session);
      } catch (err) {
        logger.error({ err, session: slot.session }, "Failed to generate prediction");
      }
    }

    // 2. At draw time: generate result
    if (wibHour === slot.dHour && wibMinute === slot.dMinute) {
      // For 00:01, the date in WIB is already the new day
      const drawDate = dateStr;
      logger.info({ drawDate, session: slot.session }, "Draw time — generating result");

      try {
        const existing = await db.select().from(totoResultsTable)
          .where(eq(totoResultsTable.drawDate, drawDate))
          .limit(1);

        let actual4d: string;

        if (existing.length === 0) {
          actual4d = rnd4d();
          const initRow: Record<string, string | null> = {
            draw0001: null, draw1300: null, draw1600: null,
            draw1900: null, draw2200: null, draw2300: null,
          };
          initRow[slot.colKey] = actual4d;
          await db.insert(totoResultsTable).values({
            drawDate,
            dayName,
            draw0001: initRow["draw0001"],
            draw1300: initRow["draw1300"],
            draw1600: initRow["draw1600"],
            draw1900: initRow["draw1900"],
            draw2200: initRow["draw2200"],
            draw2300: initRow["draw2300"],
          });
          logger.info({ drawDate, slot: slot.colKey, actual4d }, "New draw row created");
        } else {
          const currentVal = existing[0]![slot.colKey as keyof typeof existing[0]];
          if (currentVal === null || currentVal === undefined) {
            actual4d = rnd4d();
            await db.update(totoResultsTable)
              .set({ [slot.colKey]: actual4d })
              .where(eq(totoResultsTable.drawDate, drawDate));
            logger.info({ drawDate, slot: slot.colKey, actual4d }, "Draw result updated");
          } else {
            actual4d = String(currentVal);
            logger.info({ drawDate, slot: slot.colKey }, "Draw result already exists");
          }
        }

        // 3. Update actual results in predictions table
        await updateActualResults(drawDate, slot.session, actual4d);

        // Also update predictions made for today (for sessions that predicted before midnight)
        if (slot.session === "0001") {
          await updateActualResults(prevDateStr, slot.session, actual4d);
        }
      } catch (err) {
        logger.error({ err, drawDate, session: slot.session }, "Failed to generate draw result");
      }
    }
  }
}

let schedulerInterval: ReturnType<typeof setInterval> | null = null;

export function startScheduler(): void {
  if (schedulerInterval) return;

  logger.info("Draw + Prediction scheduler started — checking every 60 seconds");

  // On startup: generate predictions for all sessions today (catches missed ones)
  const { dateStr } = getWIBContext();
  void generateTodayPredictions(dateStr).catch(err => {
    logger.error({ err }, "Startup prediction generation failed");
  });

  // Immediate check
  void checkAndGenerateDraw();

  // Check every minute
  schedulerInterval = setInterval(() => {
    void checkAndGenerateDraw();
  }, 60_000);
}

export function stopScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    logger.info("Scheduler stopped");
  }
}
