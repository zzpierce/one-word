import { ScrollView, View } from '@tarojs/components';
import { useMemo } from 'react';
import type { Word } from '../types/word';
import { getColorAt } from '../utils/color';
import WordTile from './WordTile';
import './WordOcean.scss';

const ROWS = 5;
const LEVEL_COUNT = 7;

interface WordOceanProps {
  words: Word[];
  isLearned: (id: string) => boolean;
  selectedId: string | null;
  onSelect: (word: Word) => void;
}

interface TileEntry {
  word: Word;
  startColor: string;
  endColor: string;
}

export default function WordOcean({
  words,
  isLearned,
  selectedId,
  onSelect,
}: WordOceanProps) {
  const columns = useMemo<TileEntry[][]>(() => {
    const sorted = [...words].sort((a, b) => a.difficulty - b.difficulty);

    const counts: number[] = Array(LEVEL_COUNT).fill(0);
    for (const w of sorted) counts[w.difficulty - 1]++;

    const entries: TileEntry[] = sorted.map((word, i) => {
      const startColor = getColorAt(i, counts);
      const endIndex = Math.min(i + 1, sorted.length - 1);
      const endColor = getColorAt(endIndex, counts);
      return { word, startColor, endColor };
    });

    const cols: TileEntry[][] = [];
    for (let c = 0; c < entries.length; c += ROWS) {
      cols.push(entries.slice(c, c + ROWS));
    }
    return cols;
  }, [words]);

  return (
    <View className='word-ocean'>
      <ScrollView className='word-ocean__scroll' scrollX enableFlex>
        <View className='word-ocean__row'>
          {columns.map((col, ci) => (
            <View className='word-ocean__col' key={ci}>
              {col.map(({ word, startColor, endColor }) => (
                <View className='word-ocean__cell' key={word.id}>
                  <WordTile
                    word={word}
                    isLearned={isLearned(word.id)}
                    selected={selectedId === word.id}
                    startColor={startColor}
                    endColor={endColor}
                    onClick={onSelect}
                  />
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
