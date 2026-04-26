import { View, Text } from '@tarojs/components'
import { useCallback, useMemo } from 'react'
import Taro from '@tarojs/taro'
import { useAppContext } from '../../context/AppContext'
import FloatingWord from '../../components/FloatingWord'
import type { Word } from '../../types/word'
import './index.scss'

interface PositionedWord {
  word: Word
  left: string
  top: string
  animDelay: string
  animDuration: string
}

export default function Index() {
  const { vocabulary, learnHistory, isLearned, setCurrentWord } = useAppContext()

  const todayCount = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return learnHistory.filter(r => r.learnedAt >= today.getTime()).length
  }, [learnHistory])

  const positionedWords = useMemo(() => {
    const result: PositionedWord[] = []
    vocabulary.forEach((word) => {
      let minLeft: number, maxLeft: number
      if (word.difficulty === 1) { minLeft = 5; maxLeft = 30 }
      else if (word.difficulty === 2) { minLeft = 35; maxLeft = 60 }
      else { minLeft = 65; maxLeft = 90 }

      const hash = word.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
      const left = minLeft + (hash % (maxLeft - minLeft))
      const top = 10 + (hash % 70)

      result.push({
        word,
        left: `${left}%`,
        top: `${top}%`,
        animDelay: `${(hash % 5)}s`,
        animDuration: `${4 + (hash % 4)}s`,
      })
    })
    return result
  }, [vocabulary])

  const handleWordClick = useCallback((word: Word) => {
    setCurrentWord(word)
    Taro.navigateTo({ url: '/pages/detail/detail' })
  }, [setCurrentWord])

  return (
    <View className='index'>
      <View className='index__header'>
        <Text className='index__title'>选一个单词开始背诵</Text>
        <Text className='index__subtitle'>今日已背 {todayCount} 个</Text>
      </View>

      <View className='index__words'>
        {positionedWords.map(({ word, left, top, animDelay, animDuration }) => (
          <View
            key={word.id}
            className='index__word-wrapper'
            style={{
              left,
              top,
              animationDelay: animDelay,
              animationDuration: animDuration,
            }}
          >
            <FloatingWord
              word={word}
              isLearned={isLearned(word.id)}
              onClick={handleWordClick}
            />
          </View>
        ))}
      </View>
    </View>
  )
}
