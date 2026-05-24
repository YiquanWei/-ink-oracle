import {
  splitStrokesByMaxPause,
  mapA,
  mapB,
  getUpperTrigram,
  getLowerTrigram,
  getShichenIndex,
  getChangingLine,
  applyChangingLine,
  getReading,
} from './divination';
import { HEXAGRAM_TABLE } from './hexagrams';
import type { StrokeEvent } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeStroke(timestamps: number[], liftAt?: number): StrokeEvent[] {
  return timestamps.map((t, i) => ({
    x: 0,
    y: 0,
    timestamp: t,
    isLifted: i === timestamps.length - 1,
  }));
}

function makeEvents(strokeTimestamps: number[][], gapBetween?: number[]): StrokeEvent[] {
  const result: StrokeEvent[] = [];
  for (let s = 0; s < strokeTimestamps.length; s++) {
    const times = strokeTimestamps[s];
    for (let i = 0; i < times.length; i++) {
      result.push({ x: 0, y: 0, timestamp: times[i], isLifted: i === times.length - 1 });
    }
  }
  return result;
}

// ─── splitStrokesByMaxPause ───────────────────────────────────────────────────

describe('splitStrokesByMaxPause', () => {
  test('single stroke → {a:1, b:1}', () => {
    const events: StrokeEvent[] = [
      { x: 0, y: 0, timestamp: 100, isLifted: false },
      { x: 1, y: 0, timestamp: 200, isLifted: true },
    ];
    expect(splitStrokesByMaxPause(events)).toEqual({ a: 1, b: 1 });
  });

  test('zero strokes → {a:1, b:1}', () => {
    expect(splitStrokesByMaxPause([])).toEqual({ a: 1, b: 1 });
  });

  test('two strokes with clear pause splits correctly', () => {
    // Stroke 1: 100–200 (lift at 200)
    // Stroke 2: 500–600 (lift at 600) — gap 300ms
    const events: StrokeEvent[] = [
      { x: 0, y: 0, timestamp: 100, isLifted: false },
      { x: 1, y: 0, timestamp: 200, isLifted: true },
      { x: 2, y: 0, timestamp: 500, isLifted: false },
      { x: 3, y: 0, timestamp: 600, isLifted: true },
    ];
    // Only one gap between 2 strokes, so split after stroke 1: a=1, b=1
    expect(splitStrokesByMaxPause(events)).toEqual({ a: 1, b: 1 });
  });

  test('three strokes: longest pause in middle → a=2, b=1', () => {
    // Stroke 1: lift at 100, stroke 2 starts at 150 → gap 50ms
    // Stroke 2: lift at 200, stroke 3 starts at 500 → gap 300ms (longest)
    const events: StrokeEvent[] = [
      { x: 0, y: 0, timestamp: 50,  isLifted: false },
      { x: 0, y: 0, timestamp: 100, isLifted: true },
      { x: 0, y: 0, timestamp: 150, isLifted: false },
      { x: 0, y: 0, timestamp: 200, isLifted: true },
      { x: 0, y: 0, timestamp: 500, isLifted: false },
      { x: 0, y: 0, timestamp: 600, isLifted: true },
    ];
    expect(splitStrokesByMaxPause(events)).toEqual({ a: 2, b: 1 });
  });

  test('three strokes: longest pause first → a=1, b=2', () => {
    // Stroke 1: lift at 100, stroke 2 starts at 500 → gap 400ms (longest)
    // Stroke 2: lift at 600, stroke 3 starts at 650 → gap 50ms
    const events: StrokeEvent[] = [
      { x: 0, y: 0, timestamp: 50,  isLifted: false },
      { x: 0, y: 0, timestamp: 100, isLifted: true },
      { x: 0, y: 0, timestamp: 500, isLifted: false },
      { x: 0, y: 0, timestamp: 600, isLifted: true },
      { x: 0, y: 0, timestamp: 650, isLifted: false },
      { x: 0, y: 0, timestamp: 700, isLifted: true },
    ];
    expect(splitStrokesByMaxPause(events)).toEqual({ a: 1, b: 2 });
  });

  test('confirm-tap gap after last lift is excluded', () => {
    // Stroke 1: lift at 100, stroke 2 starts at 150 → gap 50ms
    // Stroke 2: lift at 200, then a long gap before button press (not an event) → ignored
    // With only 2 strokes: splitAfter=0, so a=1, b=1
    const events: StrokeEvent[] = [
      { x: 0, y: 0, timestamp: 50,  isLifted: false },
      { x: 0, y: 0, timestamp: 100, isLifted: true },
      { x: 0, y: 0, timestamp: 150, isLifted: false },
      { x: 0, y: 0, timestamp: 200, isLifted: true },
      // No third stroke added — button-press gap is not an event
    ];
    expect(splitStrokesByMaxPause(events)).toEqual({ a: 1, b: 1 });
  });

  test('five strokes: longest pause between stroke 3 and 4 → a=3, b=2', () => {
    const events: StrokeEvent[] = [
      // Stroke 1
      { x: 0, y: 0, timestamp: 100, isLifted: false },
      { x: 0, y: 0, timestamp: 200, isLifted: true },
      // Stroke 2 (gap 50ms)
      { x: 0, y: 0, timestamp: 250, isLifted: false },
      { x: 0, y: 0, timestamp: 350, isLifted: true },
      // Stroke 3 (gap 50ms)
      { x: 0, y: 0, timestamp: 400, isLifted: false },
      { x: 0, y: 0, timestamp: 500, isLifted: true },
      // Stroke 4 (gap 1000ms — longest)
      { x: 0, y: 0, timestamp: 1500, isLifted: false },
      { x: 0, y: 0, timestamp: 1600, isLifted: true },
      // Stroke 5 (gap 100ms)
      { x: 0, y: 0, timestamp: 1700, isLifted: false },
      { x: 0, y: 0, timestamp: 1800, isLifted: true },
    ];
    expect(splitStrokesByMaxPause(events)).toEqual({ a: 3, b: 2 });
  });
});

// ─── mapA ─────────────────────────────────────────────────────────────────────

describe('mapA', () => {
  test.each([
    [1, 1],
    [8, 8],
    [9, 3],   // 9%6=3
    [12, 6],  // 12%6=0 → 6
    [14, 2],  // 14%6=2
  ])('mapA(%i) === %i', (input, expected) => {
    expect(mapA(input)).toBe(expected);
  });
});

// ─── mapB ─────────────────────────────────────────────────────────────────────

describe('mapB', () => {
  test.each([
    [1, 1],
    [9, 9],
    [10, 4],  // 10%6=4
    [12, 6],  // 12%6=0 → 6
    [15, 3],  // 15%6=3
  ])('mapB(%i) === %i', (input, expected) => {
    expect(mapB(input)).toBe(expected);
  });
});

// ─── getUpperTrigram ──────────────────────────────────────────────────────────

describe('getUpperTrigram', () => {
  test('returns 乾 for index 1', () => {
    const t = getUpperTrigram(1);
    expect(t.name).toBe('乾');
    expect(t.symbol).toBe('☰');
  });

  test('returns 坤 for index 8', () => {
    const t = getUpperTrigram(8);
    expect(t.name).toBe('坤');
  });
});

// ─── getLowerTrigram ──────────────────────────────────────────────────────────

describe('getLowerTrigram', () => {
  test('returns 坎 for index 1 (后天坎)', () => {
    const t = getLowerTrigram(1);
    expect(t.name).toBe('坎');
  });

  test('index 5 returns a valid trigram (random from 先天)', () => {
    const validNames = ['乾','兑','离','震','巽','坎','艮','坤'];
    for (let i = 0; i < 20; i++) {
      const t = getLowerTrigram(5);
      expect(validNames).toContain(t.name);
    }
  });

  test('returns 离 for index 9 (后天离)', () => {
    const t = getLowerTrigram(9);
    expect(t.name).toBe('离');
  });
});

// ─── getShichenIndex ──────────────────────────────────────────────────────────

describe('getShichenIndex', () => {
  test('23:31 Beijing time → 子时 index 1', () => {
    // BJ 23:31 = UTC 15:31 same day
    const date = new Date('2024-01-15T15:31:00Z');
    const { index, name } = getShichenIndex(date);
    expect(index).toBe(1);
    expect(name).toBe('子时');
  });

  test('00:59 Beijing time → 子时 index 1', () => {
    // BJ 00:59 = UTC 16:59
    const date = new Date('2024-01-15T16:59:00Z');
    const { index, name } = getShichenIndex(date);
    expect(index).toBe(1);
    expect(name).toBe('子时');
  });

  test('02:44 Beijing time → 丑时 index 2', () => {
    // BJ 02:44 = UTC 18:44
    const date = new Date('2024-01-15T18:44:00Z');
    const { index, name } = getShichenIndex(date);
    expect(index).toBe(2);
    expect(name).toBe('丑时');
  });

  test('12:00 Beijing time → 午时 index 7', () => {
    // BJ 12:00 = UTC 04:00
    const date = new Date('2024-01-15T04:00:00Z');
    const { index, name } = getShichenIndex(date);
    expect(index).toBe(7);
    expect(name).toBe('午时');
  });

  test('01:00 Beijing time (boundary) → 子时 index 1', () => {
    // BJ 01:00 = UTC 17:00 — end boundary of 子时
    const date = new Date('2024-01-15T17:00:00Z');
    const { index, name } = getShichenIndex(date);
    expect(index).toBe(1);
    expect(name).toBe('子时');
  });

  test('01:01 Beijing time → 丑时 index 2', () => {
    // BJ 01:01 = UTC 17:01 — first minute of 丑时
    const date = new Date('2024-01-15T17:01:00Z');
    const { index, name } = getShichenIndex(date);
    expect(index).toBe(2);
    expect(name).toBe('丑时');
  });
});

// ─── getChangingLine ──────────────────────────────────────────────────────────

describe('getChangingLine', () => {
  test('totalStrokes=10, shichenIndex=3 → position 1 (初爻)', () => {
    // (10+3)%6 = 13%6 = 1
    const line = getChangingLine(10, 3);
    expect(line.position).toBe(1);
    expect(line.traditionalName).toBe('初爻');
  });

  test('totalStrokes=9, shichenIndex=3 → position 6 (上爻)', () => {
    // (9+3)%6 = 12%6 = 0 → 6
    const line = getChangingLine(9, 3);
    expect(line.position).toBe(6);
    expect(line.traditionalName).toBe('上爻');
  });

  test.each([
    [1, 1, 2, '二爻'],
    [2, 1, 3, '三爻'],
    [3, 1, 4, '四爻'],
    [4, 1, 5, '五爻'],
    [5, 1, 6, '上爻'],
    [6, 1, 1, '初爻'],  // 7%6=1
  ])('sum %i+%i → position %i %s', (strokes, shichen, pos, name) => {
    const line = getChangingLine(strokes, shichen);
    expect(line.position).toBe(pos);
    expect(line.traditionalName).toBe(name);
  });
});

// ─── applyChangingLine ────────────────────────────────────────────────────────

describe('applyChangingLine', () => {
  test('火天大有 position=6 → 雷天大壮', () => {
    // 火天大有: upper=离, lower=乾, id=14
    // lines (bottom-to-top): 乾=[1,1,1], 离=[1,0,1] → [1,1,1,1,0,1]
    // Flip position 6 (index 5): [1,1,1,1,0,0]
    // newLower = '111' → 乾, newUpper = '100' → 震
    // HEXAGRAM_TABLE['震']['乾'] = 大壮 id=34
    const hexagram = HEXAGRAM_TABLE['离']!['乾']!;
    expect(hexagram.id).toBe(14);
    expect(hexagram.name).toBe('大有');

    const changed = applyChangingLine(hexagram, { position: 6, traditionalName: '上爻' });
    expect(changed.id).toBe(34);
    expect(changed.name).toBe('大壮');
    expect(changed.upper).toBe('震');
    expect(changed.lower).toBe('乾');
  });

  test('乾 position=1 → 天风姤', () => {
    // 乾: upper=乾, lower=乾, lines=[1,1,1,1,1,1]
    // Flip position 1 (index 0): [0,1,1,1,1,1]
    // newLower='011'→巽, newUpper='111'→乾 → 姤 id=44
    const hexagram = HEXAGRAM_TABLE['乾']!['乾']!;
    const changed = applyChangingLine(hexagram, { position: 1, traditionalName: '初爻' });
    expect(changed.id).toBe(44);
    expect(changed.name).toBe('姤');
    expect(changed.upper).toBe('乾');
    expect(changed.lower).toBe('巽');
  });

  test('坤 position=1 → 地雷复', () => {
    // 坤: lines=[0,0,0,0,0,0]
    // Flip position 1 (index 0): [1,0,0,0,0,0]
    // newLower='100'→震, newUpper='000'→坤 → 复 id=24
    const hexagram = HEXAGRAM_TABLE['坤']!['坤']!;
    const changed = applyChangingLine(hexagram, { position: 1, traditionalName: '初爻' });
    expect(changed.id).toBe(24);
    expect(changed.name).toBe('复');
  });
});

// ─── getReading ───────────────────────────────────────────────────────────────

describe('getReading', () => {
  function buildEvents(strokeCount: number, baseTime = 1000): StrokeEvent[] {
    const events: StrokeEvent[] = [];
    for (let s = 0; s < strokeCount; s++) {
      events.push({ x: 0, y: 0, timestamp: baseTime + s * 200,     isLifted: false });
      events.push({ x: 1, y: 0, timestamp: baseTime + s * 200 + 100, isLifted: true });
    }
    return events;
  }

  test('returns a DivinationResult with all fields', () => {
    const events = buildEvents(5);
    const result = getReading(events);

    expect(result).toHaveProperty('originalHexagram');
    expect(result).toHaveProperty('changedHexagram');
    expect(result).toHaveProperty('changingLine');
    expect(result).toHaveProperty('upperTrigram');
    expect(result).toHaveProperty('lowerTrigram');
    expect(result).toHaveProperty('shichenIndex');
    expect(result).toHaveProperty('shichenName');
    expect(result).toHaveProperty('totalStrokes', 5);
    expect(result).toHaveProperty('debug');
    expect(typeof result.debug).toBe('string');
  });

  test('totalStrokes counts only isLifted events', () => {
    const events = buildEvents(7);
    const result = getReading(events);
    expect(result.totalStrokes).toBe(7);
  });

  test('a + b === totalStrokes (when > 1 stroke)', () => {
    const events = buildEvents(6);
    const result = getReading(events);
    expect(result.a + result.b).toBe(result.totalStrokes);
  });

  test('originalHexagram is a valid hexagram', () => {
    const events = buildEvents(4);
    const result = getReading(events);
    expect(result.originalHexagram.id).toBeGreaterThanOrEqual(1);
    expect(result.originalHexagram.id).toBeLessThanOrEqual(64);
    expect(result.originalHexagram.lines).toHaveLength(6);
  });

  test('changedHexagram is a valid hexagram', () => {
    const events = buildEvents(4);
    const result = getReading(events);
    expect(result.changedHexagram.id).toBeGreaterThanOrEqual(1);
    expect(result.changedHexagram.id).toBeLessThanOrEqual(64);
  });

  test('changingLine.position is in range 1–6', () => {
    const events = buildEvents(4);
    const result = getReading(events);
    expect(result.changingLine.position).toBeGreaterThanOrEqual(1);
    expect(result.changingLine.position).toBeLessThanOrEqual(6);
  });

  test('debug string contains expected markers', () => {
    const events = buildEvents(3);
    const result = getReading(events);
    expect(result.debug).toContain('总笔画数:');
    expect(result.debug).toContain('分割:');
    expect(result.debug).toContain('本卦:');
    expect(result.debug).toContain('变卦:');
    expect(result.debug).toContain('动爻:');
  });
});
