// ─── Navigation ──────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Write: undefined;
  Result: { result: DivinationResult };
};

// ─── Gesture / Input ─────────────────────────────────────────────────────────

/** Raw gesture event captured from the canvas. */
export type StrokeEvent = {
  x: number;
  y: number;
  timestamp: number; // ms since epoch
  isLifted: boolean; // true = finger left screen at this point
};

// ─── Trigrams ─────────────────────────────────────────────────────────────────

export type TrigramName = '乾' | '兑' | '离' | '震' | '巽' | '坎' | '艮' | '坤';

export type Trigram = {
  id: number; // 1–8
  name: TrigramName;
  lines: [0 | 1, 0 | 1, 0 | 1]; // top to bottom (visual glyph order), 0=yin 1=yang
  symbol: string; // unicode or custom string
};

// ─── Hexagrams ────────────────────────────────────────────────────────────────

export type Hexagram = {
  id: number; // 1–64
  name: string; // Chinese name e.g. 火天大有
  pinyin: string; // e.g. huǒ tiān dà yǒu
  lines: [0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1]; // bottom to top
  upper: TrigramName;
  lower: TrigramName;
};

// ─── Divination ───────────────────────────────────────────────────────────────

/** Changing line position (1=bottom, 6=top) with traditional name. */
export type ChangingLine = {
  position: 1 | 2 | 3 | 4 | 5 | 6;
  traditionalName: string; // 初爻/二爻/三爻/四爻/五爻/上爻
};

/** Final result object returned by the main calculation. */
export type DivinationResult = {
  originalHexagram: Hexagram;
  changedHexagram: Hexagram;
  changingLine: ChangingLine;
  upperTrigram: Trigram;
  lowerTrigram: Trigram;
  shichenIndex: number; // 1–12
  shichenName: string; // e.g. 子时
  totalStrokes: number;
  a: number; // raw stroke count before split
  b: number; // raw stroke count after split
  aMapped: number; // after modulo rule
  bMapped: number; // after modulo rule
  debug: string; // human-readable step-by-step log
};

// ─── Time ─────────────────────────────────────────────────────────────────────

/** One of the 12 two-hour periods of the traditional Chinese day (Beijing time). */
export type Shichen = {
  index: number; // 1–12
  name: string; // e.g. 子时
  startHour: number; // Beijing 24h, inclusive
  startMin: number;
  endHour: number; // Beijing 24h, inclusive
  endMin: number;
};
