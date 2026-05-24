import { SHICHEN_LIST } from '../constants/shichen';
import type { Shichen } from '../types';

/** Returns the 时辰 for a given Date, using Beijing time (UTC+8). */
export function getCurrentShichen(date: Date = new Date()): Shichen {
  const bjMin =
    ((date.getUTCHours() * 60 + date.getUTCMinutes()) + 8 * 60) % (24 * 60);

  // 子时 wraps midnight: 23:01–01:00
  const ziStart = 23 * 60 + 1;
  const ziEnd = 1 * 60 + 0;
  if (bjMin >= ziStart || bjMin <= ziEnd) return SHICHEN_LIST[0]!;

  return (
    SHICHEN_LIST.find((s) => {
      const start = s.startHour * 60 + s.startMin;
      const end = s.endHour * 60 + s.endMin;
      return bjMin >= start && bjMin <= end;
    }) ?? SHICHEN_LIST[0]!
  );
}

/** Returns the 时辰 index (1–12) for a given Date. */
export function getShichenIndex(date: Date = new Date()): number {
  return getCurrentShichen(date).index;
}
