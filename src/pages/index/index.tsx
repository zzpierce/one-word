import { View, Text } from '@tarojs/components';
import { useCallback, useMemo, useState } from 'react';
import Taro from '@tarojs/taro';
import { useAppContext } from '../../context/AppContext';
import WordOcean from '../../components/WordOcean';
import WordDetailPanel from '../../components/WordDetailPanel';
import type { Word } from '../../types/word';
import './index.scss';

export default function Index() {
  const { vocabulary, learnHistory, isLearned, setCurrentWord } = useAppContext();
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);

  const todayCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return learnHistory.filter((r) => r.learnedAt >= today.getTime()).length;
  }, [learnHistory]);

  const handleSelect = useCallback((word: Word) => {
    setSelectedWord(word);
  }, []);

  const handleGoRecite = useCallback(() => {
    if (selectedWord) {
      setCurrentWord(selectedWord);
      Taro.navigateTo({ url: '/pages/detail/detail' });
    }
  }, [selectedWord, setCurrentWord]);

  return (
    <View className='index'>
      <View className='index__header'>
        <Text className='index__title'>选一个单词开始背诵</Text>
        <Text className='index__subtitle'>今日已背 {todayCount} 个</Text>
      </View>

      <WordOcean
        words={vocabulary}
        isLearned={isLearned}
        selectedId={selectedWord?.id ?? null}
        onSelect={handleSelect}
      />

      <WordDetailPanel word={selectedWord} onGoRecite={handleGoRecite} />
    </View>
  );
}
