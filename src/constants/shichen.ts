import type { Shichen } from '../types';

// All times are Beijing time (UTC+8).
// Ranges use :01/:00 boundaries so no moment belongs to two periods.
// 子时 (index 1) wraps midnight: 23:01–01:00.
export const SHICHEN_LIST: Shichen[] = [
  { index: 1,  name: '子时', startHour: 23, startMin: 1,  endHour: 1,  endMin: 0  },
  { index: 2,  name: '丑时', startHour: 1,  startMin: 1,  endHour: 3,  endMin: 0  },
  { index: 3,  name: '寅时', startHour: 3,  startMin: 1,  endHour: 5,  endMin: 0  },
  { index: 4,  name: '卯时', startHour: 5,  startMin: 1,  endHour: 7,  endMin: 0  },
  { index: 5,  name: '辰时', startHour: 7,  startMin: 1,  endHour: 9,  endMin: 0  },
  { index: 6,  name: '巳时', startHour: 9,  startMin: 1,  endHour: 11, endMin: 0  },
  { index: 7,  name: '午时', startHour: 11, startMin: 1,  endHour: 13, endMin: 0  },
  { index: 8,  name: '未时', startHour: 13, startMin: 1,  endHour: 15, endMin: 0  },
  { index: 9,  name: '申时', startHour: 15, startMin: 1,  endHour: 17, endMin: 0  },
  { index: 10, name: '酉时', startHour: 17, startMin: 1,  endHour: 19, endMin: 0  },
  { index: 11, name: '戌时', startHour: 19, startMin: 1,  endHour: 21, endMin: 0  },
  { index: 12, name: '亥时', startHour: 21, startMin: 1,  endHour: 23, endMin: 0  },
];
