import { View, Text, Button } from '@tarojs/components';
import type { Word } from '../types/word';
import './WordDetailPanel.scss';

interface WordDetailPanelProps {
  word: Word | null;
  onGoRecite: () => void;
}

const DIFFICULTY_LABELS: Record<1 | 2 | 3 | 4 | 5 | 6 | 7, string> = {
  1: '入门',
  2: '初级',
  3: '基础',
  4: '中级',
  5: '中高级',
  6: '高级',
  7: '精通',
};

const DIFFICULTY_COLORS: Record<1 | 2 | 3 | 4 | 5 | 6 | 7, string> = {
  1: '#4ade80',
  2: '#34d399',
  3: '#22d3ee',
  4: '#38bdf8',
  5: '#6366f1',
  6: '#a855f7',
  7: '#d946ef',
};

export default function WordDetailPanel({
  word,
  onGoRecite,
}: WordDetailPanelProps) {
  if (!word) {
    return (
      <View className='word-detail-panel'>
        <View className='word-detail-panel__hint'>
          <Text>点选词海中的单词查看详情</Text>
        </View>
        <Button
          className='word-detail-panel__button word-detail-panel__button--disabled'
          disabled
        >
          去背诵
        </Button>
      </View>
    );
  }

  return (
    <View className='word-detail-panel'>
      <View className='word-detail-panel__main'>
        <View className='word-detail-panel__top-row'>
          <Text className='word-detail-panel__spell'>{word.spell}</Text>
          <Text className='word-detail-panel__phonetic'>{word.phonetic}</Text>
          <View
            className='word-detail-panel__difficulty-tag'
            style={{ background: DIFFICULTY_COLORS[word.difficulty] }}
          >
            <Text>难度 {DIFFICULTY_LABELS[word.difficulty]}</Text>
          </View>
        </View>
        <Text className='word-detail-panel__meaning'>{word.meaning}</Text>
      </View>
      <Button
        className='word-detail-panel__button'
        onClick={onGoRecite}
      >
        去背诵
      </Button>
    </View>
  );
}
