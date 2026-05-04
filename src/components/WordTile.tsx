import { View, Text } from '@tarojs/components';
import type { Word } from '../types/word';
import './WordTile.scss';

interface WordTileProps {
  word: Word;
  isLearned: boolean;
  selected: boolean;
  startColor: string;
  endColor: string;
  onClick: (word: Word) => void;
}

export default function WordTile({
  word,
  isLearned,
  selected,
  startColor,
  endColor,
  onClick,
}: WordTileProps) {
  const className = [
    'word-tile',
    isLearned ? 'word-tile--learned' : '',
    selected ? 'word-tile--selected' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const style = {
    background: `linear-gradient(135deg, ${startColor} 0%, ${endColor} 100%)`,
  };

  return (
    <View className={className} style={style} onClick={() => onClick(word)}>
      <Text className='word-tile__text'>{word.spell}</Text>
    </View>
  );
}
