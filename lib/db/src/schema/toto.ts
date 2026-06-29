import { pgTable, text, serial, date, integer, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const totoResultsTable = pgTable("toto_results", {
  id: serial("id").primaryKey(),
  drawDate: date("draw_date").notNull().unique(),
  dayName: text("day_name").notNull(),
  draw0001: text("draw_0001"),
  draw1300: text("draw_1300"),
  draw1600: text("draw_1600"),
  draw1900: text("draw_1900"),
  draw2200: text("draw_2200"),
  draw2300: text("draw_2300"),
});

export const predictionsTable = pgTable("predictions", {
  id: serial("id").primaryKey(),
  session: text("session").notNull(),
  forDate: date("for_date").notNull(),
  predicted4d: text("predicted_4d").notNull(),
  confidence: real("confidence").notNull(),
  signal: text("signal").notNull(),
  asP: real("as_p").notNull(),
  kopP: real("kop_p").notNull(),
  kepalaP: real("kepala_p").notNull(),
  ekorP: real("ekor_p").notNull(),
  bbfs: text("bbfs").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  actual4d: text("actual_4d"),
  asCorrect: boolean("as_correct"),
  kopCorrect: boolean("kop_correct"),
  kepalaCorrect: boolean("kepala_correct"),
  ekorCorrect: boolean("ekor_correct"),
  digitScore: integer("digit_score"),
});

export const nomorTaruhanTable = pgTable("nomor_taruhan", {
  id: serial("id").primaryKey(),
  numbers: text("numbers").notNull().default(""),
});

export const insertTotoResultSchema = createInsertSchema(totoResultsTable).omit({ id: true });
export type InsertTotoResult = z.infer<typeof insertTotoResultSchema>;
export type TotoResult = typeof totoResultsTable.$inferSelect;

export const insertPredictionSchema = createInsertSchema(predictionsTable).omit({ id: true, createdAt: true });
export type InsertPrediction = z.infer<typeof insertPredictionSchema>;
export type PredictionRow = typeof predictionsTable.$inferSelect;
