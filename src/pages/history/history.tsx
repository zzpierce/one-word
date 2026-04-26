import { View, Text } from '@tarojs/components'
import { useCallback, useMemo } from 'react'
import Taro from '@tarojs/taro'
import { useAppContext } from '../../context/AppContext'
import './history-page.scss'

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${month}月${day}日 ${hours}:${minutes}`
}

export default function History() {
  const { learnHistory, removeRecord } = useAppContext()

  const sortedHistory = useMemo(() => {
    return [...learnHistory].sort((a, b) => b.learnedAt - a.learnedAt)
  }, [learnHistory])

  const handleDelete = useCallback((wordId: string) => {
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这条学习记录吗？',
      success: (res) => {
        if (res.confirm) {
          removeRecord(wordId)
        }
      },
    })
  }, [removeRecord])

  return (
    <View className='history'>
      <View className='history__summary'>
        <Text className='history__count'>{`累计掌握 ${learnHistory.length} 个单词`}</Text>
      </View>

      {sortedHistory.length === 0 ? (
        <View className='history__empty'>
          <Text className='history__empty-text'>还没有背过单词</Text>
          <Text className='history__empty-sub'>去选词页开始吧</Text>
        </View>
      ) : (
        <View className='history__list'>
          {sortedHistory.map((record) => (
            <View key={record.wordId} className='history__item'>
              <View className='history__item-main'>
                <Text className='history__word'>{record.wordSpell}</Text>
                <Text className='history__date'>{formatDate(record.learnedAt)}</Text>
              </View>
              <View
                className='history__delete'
                onClick={() => handleDelete(record.wordId)}
              >
                <Text className='history__delete-text'>删除</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}
