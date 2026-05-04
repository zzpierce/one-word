export interface Word {
  id: string;
  spell: string;
  phonetic: string;
  meaning: string;
  example: {
    en: string;
    cn: string;
  };
  difficulty: 1 | 2 | 3 | 4 | 5 | 6 | 7;
}

export interface LearnRecord {
  wordId: string;
  wordSpell: string;
  learnedAt: number;
}
