import { demoToday } from "@/data/demo";

export function daysUntil(date?: string, referenceDate: Date = demoToday) {
  if (!date) return null;
  return Math.ceil(
    (new Date(`${date}T12:00:00`).getTime() - referenceDate.getTime()) / 86400000,
  );
}
