import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Word, LearnRecord } from '../types/word';
import { getLearnHistory, setLearnHistory } from '../utils/storage';
import vocabulary from '../data/vocabulary.json';

interface AppContextValue {
  vocabulary: Word[];
  currentWord: Word | null;
  learnHistory: LearnRecord[];
  setCurrentWord: (word: Word) => void;
  markAsLearned: (wordId: string) => void;
  removeRecord: (wordId: string) => void;
  isLearned: (wordId: string) => boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [currentWord, setCurrentWordState] = useState<Word | null>(null);
  const [learnHistory, setLearnHistoryState] = useState<LearnRecord[]>([]);

  useEffect(() => {
    setLearnHistoryState(getLearnHistory());
  }, []);

  const setCurrentWord = useCallback((word: Word) => {
    setCurrentWordState(word);
  }, []);

  const isLearned = useCallback((wordId: string) => {
    return learnHistory.some(r => r.wordId === wordId);
  }, [learnHistory]);

  const markAsLearned = useCallback((wordId: string) => {
    const word = vocabulary.find((w: Word) => w.id === wordId);
    if (!word) return;

    setLearnHistoryState(prev => {
      const filtered = prev.filter(r => r.wordId !== wordId);
      const updated = [...filtered, { wordId, wordSpell: word.spell, learnedAt: Date.now() }];
      setLearnHistory(updated);
      return updated;
    });
  }, []);

  const removeRecord = useCallback((wordId: string) => {
    setLearnHistoryState(prev => {
      const updated = prev.filter(r => r.wordId !== wordId);
      setLearnHistory(updated);
      return updated;
    });
  }, []);

  const value: AppContextValue = {
    vocabulary: vocabulary as Word[],
    currentWord,
    learnHistory,
    setCurrentWord,
    markAsLearned,
    removeRecord,
    isLearned,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used within AppContextProvider');
  }
  return ctx;
}
