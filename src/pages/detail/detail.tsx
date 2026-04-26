import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useCallback } from 'react'
import { useAppContext } from '../../context/AppContext'
import WordCard from '../../components/WordCard'
import './detail.scss'

export default function Detail() {
  const { currentWord, markAsLearned, learnHistory } = useAppContext()

  const todayCount = learnHistory.filter(r => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return r.learnedAt >= today.getTime()
  }).length

  const handleMarkLearned = useCallback(() => {
    if (currentWord) {
      markAsLearned(currentWord.id)
      Taro.showToast({ title: '已掌握！', icon: 'success', duration: 1500 })
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    }
  }, [currentWord, markAsLearned])

  if (!currentWord) {
    return (
      <View className='detail detail--empty'>
        <Text>未选择单词</Text>
      </View>
    )
  }

  return (
    <View className='detail'>
      <WordCard word={currentWord} />

      <View className='detail__actions'>
        <Button
          className='detail__button'
          type='primary'
          onClick={handleMarkLearned}
        >
          已掌握
        </Button>
        <Text className='detail__hint'>今日已背 {todayCount} 个</Text>
      </View>
    </View>
  )
}
