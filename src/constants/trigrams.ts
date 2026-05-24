import type { Trigram } from '../types';

// 先天八卦 (Fuxi / Pre-Heaven) — used for upper trigram, keyed by 'a' mapped value.
// Lines are [top, middle, bottom], 0=yin 1=yang.
export const XIANTIAN: Record<number, Trigram> = {
  1: { id: 1, name: '乾', lines: [1, 1, 1], symbol: '☰' },
  2: { id: 2, name: '兑', lines: [0, 1, 1], symbol: '☱' },
  3: { id: 3, name: '离', lines: [1, 0, 1], symbol: '☲' },
  4: { id: 4, name: '震', lines: [0, 0, 1], symbol: '☳' },
  5: { id: 5, name: '巽', lines: [1, 1, 0], symbol: '☴' },
  6: { id: 6, name: '坎', lines: [0, 1, 0], symbol: '☵' },
  7: { id: 7, name: '艮', lines: [1, 0, 0], symbol: '☶' },
  8: { id: 8, name: '坤', lines: [0, 0, 0], symbol: '☷' },
};

// 后天八卦 (King Wen / Post-Heaven) — used for lower trigram, keyed by 'b' mapped value.
// Key 5 = center (土) is handled in logic, not here.
export const HOUTIAN: Record<number, Trigram> = {
  1: { id: 1, name: '坎', lines: [0, 1, 0], symbol: '☵' },
  2: { id: 2, name: '坤', lines: [0, 0, 0], symbol: '☷' },
  3: { id: 3, name: '震', lines: [0, 0, 1], symbol: '☳' },
  4: { id: 4, name: '巽', lines: [1, 1, 0], symbol: '☴' },
  // 5 = random — handled in logic, NOT here
  6: { id: 6, name: '乾', lines: [1, 1, 1], symbol: '☰' },
  7: { id: 7, name: '兑', lines: [0, 1, 1], symbol: '☱' },
  8: { id: 8, name: '艮', lines: [1, 0, 0], symbol: '☶' },
  9: { id: 9, name: '离', lines: [1, 0, 1], symbol: '☲' },
};
