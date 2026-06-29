import { db, totoResultsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./lib/logger";

const DAY_NAMES = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];

// Draw times in WIB (UTC+7): [hour, minute, column key]
const DRAW_SCHEDULE: Array<[number, number, string]> = [
  [0,  1,  "draw0001"],
  [13, 0,  "draw1300"],
  [16, 0,  "draw1600"],
  [19, 0,  "draw1900"],
  [22, 0,  "draw2200"],
  [23, 0,  "draw2300"],
];

function rnd4d(): string {
  return String(Math.floor(Math.random() * 10000)).padStart(4, "0");
}

function getWIBDate(): { date: Date; wibHour: number; wibMinute: number; dateStr: string; dayName: string } {
  const now = new Date();
  const wibOffsetMs = 7 * 60 * 60 * 1000;
  const wibDate = new Date(now.getTime() + wibOffsetMs);
  const dateStr = wibDate.toISOString().split("T")[0]!;
  return {
    date: wibDate,
    wibHour: wibDate.getUTCHours(),
    wibMinute: wibDate.getUTCMinutes(),
    dateStr,
    dayName: DAY_NAMES[wibDate.getUTCDay()]!,
  };
}

async function checkAndGenerateDraw(): Promise<void> {
  const { wibHour, wibMinute, dateStr, dayName } = getWIBDate();

  for (const [dHour, dMinute, colKey] of DRAW_SCHEDULE) {
    // Only trigger exactly at draw time (within the same minute)
    if (wibHour !== dHour || wibMinute !== dMinute) continue;

    logger.info({ dateStr, draw: `${dHour}:${dMinute}`, colKey }, "Draw time reached — generating result");

    try {
      // Get or create today's row
      const existing = await db.select().from(totoResultsTable)
        .where(eq(totoResultsTable.drawDate, dateStr))
        .limit(1);

      if (existing.length === 0) {
        // Create the row with today's first result
        const row: Record<string, string | null> = {
          draw0001: null, draw1300: null, draw1600: null,
          draw1900: null, draw2200: null, draw2300: null,
        };
        row[colKey] = rnd4d();
        await db.insert(totoResultsTable).values({
          drawDate: dateStr,
          dayName,
          draw0001: row["draw0001"],
          draw1300: row["draw1300"],
          draw1600: row["draw1600"],
          draw1900: row["draw1900"],
          draw2200: row["draw2200"],
          draw2300: row["draw2300"],
        });
        logger.info({ dateStr, colKey }, "New draw row created");
      } else {
        // Only update if this slot is still null
        const currentVal = existing[0]![colKey as keyof typeof existing[0]];
        if (currentVal === null || currentVal === undefined) {
          await db.update(totoResultsTable)
            .set({ [colKey]: rnd4d() })
            .where(eq(totoResultsTable.drawDate, dateStr));
          logger.info({ dateStr, colKey }, "Draw result updated");
        } else {
          logger.info({ dateStr, colKey }, "Draw result already exists, skipping");
        }
      }
    } catch (err) {
      logger.error({ err, dateStr, colKey }, "Failed to generate draw result");
    }
  }
}

let schedulerInterval: ReturnType<typeof setInterval> | null = null;

export function startScheduler(): void {
  if (schedulerInterval) return;

  logger.info("Draw scheduler started — checking every 60 seconds");

  // Check immediately on start (in case we missed a draw while server was down)
  void checkAndGenerateDraw();

  // Then check every minute
  schedulerInterval = setInterval(() => {
    void checkAndGenerateDraw();
  }, 60_000);
}

export function stopScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    logger.info("Draw scheduler stopped");
  }
}
