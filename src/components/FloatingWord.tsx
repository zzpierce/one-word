import { View, Text } from '@tarojs/components';
import type { Word } from '../types/word';
import './FloatingWord.scss';

interface FloatingWordProps {
  word: Word;
  isLearned: boolean;
  onClick: (word: Word) => void;
}

export default function FloatingWord({ word, isLearned, onClick }: FloatingWordProps) {
  return (
    <View
      className={`floating-word ${isLearned ? 'floating-word--learned' : ''}`}
      onClick={() => onClick(word)}
    >
      <Text className="floating-word__text">{word.spell}</Text>
    </View>
  );
}
