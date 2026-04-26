import Taro from '@tarojs/taro';
import type { LearnRecord } from '../types/word';

const HISTORY_KEY = 'learn_history';

export function getLearnHistory(): LearnRecord[] {
  try {
    const data = Taro.getStorageSync<LearnRecord[]>(HISTORY_KEY);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function setLearnHistory(records: LearnRecord[]): void {
  try {
    Taro.setStorageSync(HISTORY_KEY, records);
  } catch {
    // Silently fail — data lives in memory for this session
  }
}

export function clearLearnHistory(): void {
  try {
    Taro.removeStorageSync(HISTORY_KEY);
  } catch {
    // Silently fail
  }
}
