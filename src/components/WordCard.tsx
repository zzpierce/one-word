import { View, Text } from '@tarojs/components';
import type { Word } from '../types/word';
import './WordCard.scss';

interface WordCardProps {
  word: Word;
}

export default function WordCard({ word }: WordCardProps) {
  return (
    <View className="word-card">
      <View className="word-card__header">
        <Text className="word-card__spell">{word.spell}</Text>
        <Text className="word-card__phonetic">{word.phonetic}</Text>
      </View>

      <View className="word-card__meaning">
        <Text className="word-card__label">释义</Text>
        <Text className="word-card__text">{word.meaning}</Text>
      </View>

      <View className="word-card__example">
        <Text className="word-card__label">例句</Text>
        <Text className="word-card__text word-card__text--en">{word.example.en}</Text>
        <Text className="word-card__text word-card__text--cn">{word.example.cn}</Text>
      </View>
    </View>
  );
}
