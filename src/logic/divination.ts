import type {
  ChangingLine,
  DivinationResult,
  Hexagram,
  StrokeEvent,
  Trigram,
  TrigramName,
} from '../types';
import { XIANTIAN, HOUTIAN } from '../constants/trigrams';
import { SHICHEN_LIST } from '../constants/shichen';
import { HEXAGRAM_TABLE } from './hexagrams';

// ─── Local lookup: bottom-to-top 3-bit pattern → TrigramName ─────────────────
// Matches hexagram.lines convention: lines[0]=bottom, lines[2]=top.
const PATTERN_TO_TRIGRAM: Record<string, TrigramName> = {
  '000': '坤',
  '100': '震',
  '010': '坎',
  '110': '兑',
  '001': '艮',
  '101': '离',
  '011': '巽',
  '111': '乾',
};

const LINE_NAMES: Record<1 | 2 | 3 | 4 | 5 | 6, string> = {
  1: '初爻', 2: '二爻', 3: '三爻', 4: '四爻', 5: '五爻', 6: '上爻',
};

// ─── FUNCTION 1 — splitStrokesByMaxPause ──────────────────────────────────────
/**
 * Groups flat StrokeEvent[] into individual strokes (each ending on isLifted===true),
 * then splits them at the longest inter-stroke pause.
 */
export function splitStrokesByMaxPause(
  events: StrokeEvent[],
): { a: number; b: number } {
  // Edge case: no lift events → treat the whole input as a single stroke
  if (!events.some((e) => e.isLifted)) return { a: 1, b: 1 };

  // Collect complete strokes
  const strokes: StrokeEvent[][] = [];
  let current: StrokeEvent[] = [];
  for (const e of events) {
    current.push(e);
    if (e.isLifted) {
      strokes.push(current);
      current = [];
    }
  }
  // Any trailing events without a lift are discarded (incomplete stroke)

  const total = strokes.length;
  if (total <= 1) return { a: 1, b: 1 };

  // Find the longest pause between consecutive strokes.
  // pause[i] = time from the isLifted event of stroke i
  //            to the first non-lifted event of stroke i+1.
  // Do NOT count the gap after the last isLifted (that is the confirm-button delay).
  let maxPause = -1;
  let splitAfter = 0; // stroke index BEFORE the longest pause

  for (let i = 0; i < total - 1; i++) {
    const liftTs = strokes[i].at(-1)!.timestamp;
    const firstDown = strokes[i + 1].find((e) => !e.isLifted);
    if (!firstDown) continue;

    const pause = firstDown.timestamp - liftTs;
    if (pause > maxPause) {
      maxPause = pause;
      splitAfter = i;
    }
  }

  const a = splitAfter + 1;
  const b = total - a;
  return { a, b };
}

// ─── FUNCTION 2 — mapA (先天八卦 index) ──────────────────────────────────────
export function mapA(a: number): number {
  if (a <= 8) return a;
  const r = a % 6;
  return r === 0 ? 6 : r;
}

// ─── FUNCTION 3 — mapB (后天八卦 index) ──────────────────────────────────────
export function mapB(b: number): number {
  if (b <= 9) return b;
  const r = b % 6;
  return r === 0 ? 6 : r;
}

// ─── FUNCTION 4 — getUpperTrigram ────────────────────────────────────────────
export function getUpperTrigram(aMapped: number): Trigram {
  return XIANTIAN[aMapped]!;
}

// ─── FUNCTION 5 — getLowerTrigram ────────────────────────────────────────────
// bMapped === 5 means 中宫 (center earth) — resolve by random pick from 先天八卦.
export function getLowerTrigram(bMapped: number): Trigram {
  if (bMapped === 5) {
    const randomInt = Math.floor(Math.random() * 8) + 1; // 1–8
    return XIANTIAN[randomInt]!;
  }
  return HOUTIAN[bMapped]!;
}

// ─── FUNCTION 6 — getShichenIndex ────────────────────────────────────────────
export function getShichenIndex(date: Date = new Date()): { index: number; name: string } {
  // Convert to Beijing minutes-since-midnight (UTC+8)
  const bjMin = ((date.getUTCHours() * 60 + date.getUTCMinutes()) + 8 * 60) % (24 * 60);

  // 子时 wraps midnight: 23:01–01:00
  // Edge cases per spec: exactly 23:01 → 子时; exactly 01:00 → 子时
  const ziStart = 23 * 60 + 1; // 1381
  const ziEnd   =  1 * 60 + 0; // 60
  if (bjMin >= ziStart || bjMin <= ziEnd) return { index: 1, name: '子时' };

  const match = SHICHEN_LIST.find((s) => {
    const start = s.startHour * 60 + s.startMin;
    const end   = s.endHour   * 60 + s.endMin;
    return bjMin >= start && bjMin <= end;
  });

  return match ? { index: match.index, name: match.name } : { index: 1, name: '子时' };
}

// ─── FUNCTION 7 — getChangingLine ────────────────────────────────────────────
export function getChangingLine(
  totalStrokes: number,
  shichenIndex: number,
): ChangingLine {
  const sum = totalStrokes + shichenIndex;
  const r = sum % 6;
  const position = (r === 0 ? 6 : r) as 1 | 2 | 3 | 4 | 5 | 6;
  return { position, traditionalName: LINE_NAMES[position] };
}

// ─── FUNCTION 8 — applyChangingLine ──────────────────────────────────────────
// hexagram.lines is bottom-to-top: [line1, line2, line3, line4, line5, line6]
//   lines[0..2] = lower trigram  (positions 1–3)
//   lines[3..5] = upper trigram  (positions 4–6)
export function applyChangingLine(hexagram: Hexagram, line: ChangingLine): Hexagram {
  const lines = hexagram.lines.slice() as Array<0 | 1>; // mutable copy

  // Flip the bit at (line.position - 1), 0-indexed from bottom
  const idx = line.position - 1;
  lines[idx] = lines[idx] === 0 ? 1 : 0;

  // Derive new trigram names from the updated patterns
  const newLower = PATTERN_TO_TRIGRAM[`${lines[0]}${lines[1]}${lines[2]}`] as TrigramName;
  const newUpper = PATTERN_TO_TRIGRAM[`${lines[3]}${lines[4]}${lines[5]}`] as TrigramName;

  return HEXAGRAM_TABLE[newUpper]![newLower]!;
}

// ─── FUNCTION 9 — getReading (main export) ───────────────────────────────────
export function getReading(events: StrokeEvent[]): DivinationResult {
  // Total strokes = count of isLifted events
  const totalStrokes = events.filter((e) => e.isLifted).length;

  // 1. Split at longest pause
  const { a, b } = splitStrokesByMaxPause(events);

  // 2. Map to trigram indices
  const aMapped = mapA(a);
  const bMapped = mapB(b);

  // 3. Resolve trigrams
  const upperTrigram = getUpperTrigram(aMapped);
  const lowerTrigram = getLowerTrigram(bMapped);

  // 4. Look up original hexagram
  const originalHexagram = HEXAGRAM_TABLE[upperTrigram.name]![lowerTrigram.name]!;

  // 5. Current 时辰
  const { index: shichenIndex, name: shichenName } = getShichenIndex();

  // 6. Changing line
  const changingLine = getChangingLine(totalStrokes, shichenIndex);

  // 7. Changed hexagram
  const changedHexagram = applyChangingLine(originalHexagram, changingLine);

  // 8. Debug log
  const debug = [
    `总笔画数: ${totalStrokes}`,
    `分割: a=${a}, b=${b}`,
    `先天取卦: mapA(${a})=${aMapped} → ${upperTrigram.name}${upperTrigram.symbol}  (上卦)`,
    `后天取卦: mapB(${b})=${bMapped} → ${lowerTrigram.name}${lowerTrigram.symbol}  (下卦)`,
    `本卦: 第${originalHexagram.id}卦 ${originalHexagram.name} [上${originalHexagram.upper}下${originalHexagram.lower}]`,
    `时辰: 第${shichenIndex}个 ${shichenName}`,
    `动爻: (${totalStrokes} + ${shichenIndex}) % 6 = ${(totalStrokes + shichenIndex) % 6} → 第${changingLine.position}爻 ${changingLine.traditionalName}`,
    `变卦: 第${changedHexagram.id}卦 ${changedHexagram.name} [上${changedHexagram.upper}下${changedHexagram.lower}]`,
  ].join('\n');

  return {
    originalHexagram,
    changedHexagram,
    changingLine,
    upperTrigram,
    lowerTrigram,
    shichenIndex,
    shichenName,
    totalStrokes,
    a,
    b,
    aMapped,
    bMapped,
    debug,
  };
}
