export interface Word {
  id: string;
  spell: string;
  phonetic: string;
  meaning: string;
  example: {
    en: string;
    cn: string;
  };
  difficulty: 1 | 2 | 3;
}

export interface LearnRecord {
  wordId: string;
  wordSpell: string;
  learnedAt: number;
}
