# one-word Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a WeChat mini-program where users pick a floating word, view its details, mark it as learned, and review learning history.

**Architecture:** Three-page mini-program (select/recite/history) with React Context for global state and Taro Storage for persistence. Floating word bubbles use CSS keyframe animations.

**Tech Stack:** Taro 4.2, React 18, TypeScript, Sass, WeChat Mini Program

---

## File Structure

```
src/
├── app.config.ts                 # TabBar + pages list
├── app.tsx                       # Entry, wraps AppContextProvider
├── types/
│   └── word.ts                   # Word, LearnRecord interfaces
├── data/
│   └── vocabulary.json           # ~50 sample words (1/2/3 difficulty)
├── utils/
│   └── storage.ts                # Taro Storage wrapper (get/set/clear)
├── context/
│   └── AppContext.tsx            # Global state + actions
├── components/
│   ├── FloatingWord.tsx          # Animated word bubble
│   └── WordCard.tsx              # Word detail display card
└── pages/
    ├── index/
    │   ├── index.config.ts       # Navigation title
    │   ├── index.tsx             # Floating words + today count
    │   └── index.scss            # Floating animations + layout
    ├── detail/
    │   ├── detail.config.ts      # Navigation title
    │   ├── detail.tsx            # Recite page + mark learned
    │   └── detail.scss           # Card layout + button styles
    └── history/
        ├── history.config.ts     # Navigation title
        ├── history.tsx           # Learned words list + delete
        └── history.scss          # List layout + empty state
```

---

### Task 1: Type Definitions

**Files:**
- Create: `src/types/word.ts`

- [ ] **Step 1: Write type definitions**

```typescript
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit src/types/word.ts`
Expected: No errors (may need `--skipLibCheck`)

- [ ] **Step 3: Commit**

```bash
git add src/types/word.ts
git commit -m "feat: add Word and LearnRecord type definitions"
```

---

### Task 2: Vocabulary Data

**Files:**
- Create: `src/data/vocabulary.json`

- [ ] **Step 1: Write sample vocabulary (50 words across 3 difficulty levels)**

```json
[
  { "id": "w001", "spell": "apple", "phonetic": "/ˈæp.əl/", "meaning": "苹果", "example": { "en": "I eat an apple every day.", "cn": "我每天吃一个苹果。" }, "difficulty": 1 },
  { "id": "w002", "spell": "book", "phonetic": "/bʊk/", "meaning": "书；预订", "example": { "en": "I booked a table at the restaurant.", "cn": "我在餐厅预订了一张桌子。" }, "difficulty": 1 },
  { "id": "w003", "spell": "cat", "phonetic": "/kæt/", "meaning": "猫", "example": { "en": "The cat is sleeping on the sofa.", "cn": "猫正在沙发上睡觉。" }, "difficulty": 1 },
  { "id": "w004", "spell": "dog", "phonetic": "/dɒɡ/", "meaning": "狗", "example": { "en": "My dog loves to play fetch.", "cn": "我的狗喜欢玩接飞盘。" }, "difficulty": 1 },
  { "id": "w005", "spell": "eat", "phonetic": "/iːt/", "meaning": "吃", "example": { "en": "We eat dinner at 7 PM.", "cn": "我们晚上7点吃晚饭。" }, "difficulty": 1 },
  { "id": "w006", "spell": "fish", "phonetic": "/fɪʃ/", "meaning": "鱼；钓鱼", "example": { "en": "He caught a big fish yesterday.", "cn": "他昨天钓到了一条大鱼。" }, "difficulty": 1 },
  { "id": "w007", "spell": "good", "phonetic": "/ɡʊd/", "meaning": "好的", "example": { "en": "She did a good job on the project.", "cn": "她在这个项目上做得很好。" }, "difficulty": 1 },
  { "id": "w008", "spell": "happy", "phonetic": "/ˈhæp.i/", "meaning": "快乐的", "example": { "en": "I am happy to see you.", "cn": "见到你我很高兴。" }, "difficulty": 1 },
  { "id": "w009", "spell": "house", "phonetic": "/haʊs/", "meaning": "房子", "example": { "en": "They bought a new house last year.", "cn": "他们去年买了一栋新房子。" }, "difficulty": 1 },
  { "id": "w010", "spell": "ice", "phonetic": "/aɪs/", "meaning": "冰", "example": { "en": "Please put some ice in my drink.", "cn": "请在我的饮料里加点冰。" }, "difficulty": 1 },
  { "id": "w011", "spell": "job", "phonetic": "/dʒɒb/", "meaning": "工作", "example": { "en": "She got a new job in Shanghai.", "cn": "她在上海找到了一份新工作。" }, "difficulty": 1 },
  { "id": "w012", "spell": "kind", "phonetic": "/kaɪnd/", "meaning": "善良的；种类", "example": { "en": "He is very kind to strangers.", "cn": "他对陌生人很友善。" }, "difficulty": 1 },
  { "id": "w013", "spell": "love", "phonetic": "/lʌv/", "meaning": "爱", "example": { "en": "I love reading books.", "cn": "我喜欢读书。" }, "difficulty": 1 },
  { "id": "w014", "spell": "music", "phonetic": "/ˈmjuː.zɪk/", "meaning": "音乐", "example": { "en": "She listens to music while studying.", "cn": "她学习时听音乐。" }, "difficulty": 1 },
  { "id": "w015", "spell": "name", "phonetic": "/neɪm/", "meaning": "名字；命名", "example": { "en": "What is your name?", "cn": "你叫什么名字？" }, "difficulty": 1 },
  { "id": "w016", "spell": "office", "phonetic": "/ˈɒf.ɪs/", "meaning": "办公室", "example": { "en": "He works in a modern office building.", "cn": "他在一栋现代化的办公楼里工作。" }, "difficulty": 2 },
  { "id": "w017", "spell": "people", "phonetic": "/ˈpiː.pəl/", "meaning": "人们", "example": { "en": "Many people attended the concert.", "cn": "许多人参加了音乐会。" }, "difficulty": 2 },
  { "id": "w018", "spell": "question", "phonetic": "/ˈkwes.tʃən/", "meaning": "问题", "example": { "en": "Do you have any questions?", "cn": "你有什么问题吗？" }, "difficulty": 2 },
  { "id": "w019", "spell": "rain", "phonetic": "/reɪn/", "meaning": "雨；下雨", "example": { "en": "It will rain tomorrow afternoon.", "cn": "明天下午会下雨。" }, "difficulty": 2 },
  { "id": "w020", "spell": "school", "phonetic": "/skuːl/", "meaning": "学校", "example": { "en": "The children go to school by bus.", "cn": "孩子们乘公交车上学。" }, "difficulty": 2 },
  { "id": "w021", "spell": "time", "phonetic": "/taɪm/", "meaning": "时间", "example": { "en": "What time is it now?", "cn": "现在几点了？" }, "difficulty": 2 },
  { "id": "w022", "spell": "under", "phonetic": "/ˈʌn.dər/", "meaning": "在...下面", "example": { "en": "The cat is hiding under the bed.", "cn": "猫躲在床底下。" }, "difficulty": 2 },
  { "id": "w023", "spell": "very", "phonetic": "/ˈver.i/", "meaning": "非常", "example": { "en": "This book is very interesting.", "cn": "这本书非常有趣。" }, "difficulty": 2 },
  { "id": "w024", "spell": "water", "phonetic": "/ˈwɔː.tər/", "meaning": "水", "example": { "en": "Please drink more water.", "cn": "请多喝水。" }, "difficulty": 2 },
  { "id": "w025", "spell": "year", "phonetic": "/jɪər/", "meaning": "年", "example": { "en": "I will graduate next year.", "cn": "我明年毕业。" }, "difficulty": 2 },
  { "id": "w026", "spell": "ability", "phonetic": "/əˈbɪl.ə.ti/", "meaning": "能力", "example": { "en": "She has the ability to speak four languages.", "cn": "她有四门语言的能力。" }, "difficulty": 2 },
  { "id": "w027", "spell": "behavior", "phonetic": "/bɪˈheɪ.vjər/", "meaning": "行为", "example": { "en": "His behavior at work is professional.", "cn": "他在工作中的表现很专业。" }, "difficulty": 2 },
  { "id": "w028", "spell": "challenge", "phonetic": "/ˈtʃæl.ɪndʒ/", "meaning": "挑战", "example": { "en": "This project is a real challenge.", "cn": "这个项目是一个真正的挑战。" }, "difficulty": 2 },
  { "id": "w029", "spell": "decision", "phonetic": "/dɪˈsɪʒ.ən/", "meaning": "决定", "example": { "en": "Making this decision was difficult.", "cn": "做这个决定很困难。" }, "difficulty": 2 },
  { "id": "w030", "spell": "environment", "phonetic": "/ɪnˈvaɪ.rən.mənt/", "meaning": "环境", "example": { "en": "We need to protect the environment.", "cn": "我们需要保护环境。" }, "difficulty": 2 },
  { "id": "w031", "spell": "ambiguous", "phonetic": "/æmˈbɪɡ.ju.əs/", "meaning": "模棱两可的", "example": { "en": "His answer was ambiguous and confusing.", "cn": "他的回答模棱两可，令人困惑。" }, "difficulty": 3 },
  { "id": "w032", "spell": "benevolent", "phonetic": "/bəˈnev.əl.ənt/", "meaning": "仁慈的", "example": { "en": "The benevolent donor gave millions to charity.", "cn": "这位仁慈的捐赠者向慈善机构捐赠了数百万。" }, "difficulty": 3 },
  { "id": "w033", "spell": "cognitive", "phonetic": "/ˈkɒɡ.nɪ.tɪv/", "meaning": "认知的", "example": { "en": "Cognitive skills improve with practice.", "cn": "认知能力通过练习得到提高。" }, "difficulty": 3 },
  { "id": "w034", "spell": "diligent", "phonetic": "/ˈdɪl.ɪ.dʒənt/", "meaning": "勤奋的", "example": { "en": "She is a diligent student who always finishes homework.", "cn": "她是个勤奋的学生，总是完成作业。" }, "difficulty": 3 },
  { "id": "w035", "spell": "eloquent", "phonetic": "/ˈel.ə.kwənt/", "meaning": "雄辩的", "example": { "en": "He gave an eloquent speech at the ceremony.", "cn": "他在典礼上发表了雄辩的演讲。" }, "difficulty": 3 },
  { "id": "w036", "spell": "fastidious", "phonetic": "/fæsˈtɪd.i.əs/", "meaning": "挑剔的", "example": { "en": "She is fastidious about cleanliness.", "cn": "她对清洁非常挑剔。" }, "difficulty": 3 },
  { "id": "w037", "spell": "gregarious", "phonetic": "/ɡrɪˈɡeə.ri.əs/", "meaning": "爱交际的", "example": { "en": "He is a gregarious person who loves parties.", "cn": "他是个爱交际的人，喜欢聚会。" }, "difficulty": 3 },
  { "id": "w038", "spell": "hypothesis", "phonetic": "/haɪˈpɒθ.ə.sɪs/", "meaning": "假设", "example": { "en": "The scientist tested his hypothesis carefully.", "cn": "科学家仔细地验证了他的假设。" }, "difficulty": 3 },
  { "id": "w039", "spell": "inevitable", "phonetic": "/ɪˈnev.ɪ.tə.bəl/", "meaning": "不可避免的", "example": { "en": "Change is inevitable in any organization.", "cn": "在任何组织中变化都是不可避免的。" }, "difficulty": 3 },
  { "id": "w040", "spell": "juxtapose", "phonetic": "/ˌdʒʌk.stəˈpəʊz/", "meaning": "并列；并置", "example": { "en": "The artist juxtaposed modern and classical elements.", "cn": "艺术家将现代与古典元素并置在一起。" }, "difficulty": 3 },
  { "id": "w041", "spell": "kaleidoscope", "phonetic": "/kəˈlaɪ.də.skəʊp/", "meaning": "万花筒", "example": { "en": "Life is a kaleidoscope of changing colors.", "cn": "生活是一个不断变换色彩的万花筒。" }, "difficulty": 3 },
  { "id": "w042", "spell": "labyrinth", "phonetic": "/ˈlæb.ə.rɪnθ/", "meaning": "迷宫", "example": { "en": "The old city is a labyrinth of narrow streets.", "cn": "这座古城是狭窄街道构成的迷宫。" }, "difficulty": 3 },
  { "id": "w043", "spell": "meticulous", "phonetic": "/məˈtɪk.jə.ləs/", "meaning": "一丝不苟的", "example": { "en": "She is meticulous in her research work.", "cn": "她在研究工作中一丝不苟。" }, "difficulty": 3 },
  { "id": "w044", "spell": "narcissistic", "phonetic": "/ˌnɑː.sɪˈsɪs.tɪk/", "meaning": "自恋的", "example": { "en": "His narcissistic behavior annoyed everyone.", "cn": "他自恋的行为让所有人厌烦。" }, "difficulty": 3 },
  { "id": "w045", "spell": "oblivious", "phonetic": "/əˈblɪv.i.əs/", "meaning": " oblivious的", "example": { "en": "He was oblivious to the danger around him.", "cn": "他对周围的危险毫不知情。" }, "difficulty": 3 },
  { "id": "w046", "spell": "paradigm", "phonetic": "/ˈpær.ə.daɪm/", "meaning": "范式", "example": { "en": "This discovery changed the scientific paradigm.", "cn": "这一发现改变了科学范式。" }, "difficulty": 3 },
  { "id": "w047", "spell": "quintessential", "phonetic": "/ˌkwɪn.tɪˈsen.ʃəl/", "meaning": "典型的", "example": { "en": "She is the quintessential modern professional.", "cn": "她是典型的现代职业女性。" }, "difficulty": 3 },
  { "id": "w048", "spell": "resilient", "phonetic": "/rɪˈzɪl.i.ənt/", "meaning": "有弹性的；适应力强的", "example": { "en": "Children are often more resilient than adults.", "cn": "孩子通常比成年人更有适应力。" }, "difficulty": 3 },
  { "id": "w049", "spell": "serendipity", "phonetic": "/ˌser.ənˈdɪp.ə.ti/", "meaning": "意外发现珍奇事物的运气", "example": { "en": "Finding this cafe was pure serendipity.", "cn": "发现这家咖啡馆纯属意外之喜。" }, "difficulty": 3 },
  { "id": "w050", "spell": "ubiquitous", "phonetic": "/juːˈbɪk.wɪ.təs/", "meaning": "无处不在的", "example": { "en": "Smartphones have become ubiquitous in modern life.", "cn": "智能手机在现代生活中已无处不在。" }, "difficulty": 3 }
]
```

- [ ] **Step 2: Verify JSON is valid**

Run: `node -e "JSON.parse(require('fs').readFileSync('src/data/vocabulary.json'))" && echo 'Valid JSON'`
Expected: `Valid JSON`

- [ ] **Step 3: Commit**

```bash
git add src/data/vocabulary.json
git commit -m "feat: add vocabulary data with 50 words across 3 difficulty levels"
```

---

### Task 3: Storage Utility

**Files:**
- Create: `src/utils/storage.ts`

- [ ] **Step 1: Write storage wrapper**

```typescript
import Taro from '@tarojs/taro';
import type { LearnRecord } from '../types/word';

const HISTORY_KEY = 'learn_history';

export function getLearnHistory(): LearnRecord[] {
  try {
    const data = Taro.getStorageSync<LearnRecord[]>(HISTORY_KEY);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function setLearnHistory(records: LearnRecord[]): void {
  try {
    Taro.setStorageSync(HISTORY_KEY, records);
  } catch {
    // Silently fail — data lives in memory for this session
  }
}

export function clearLearnHistory(): void {
  try {
    Taro.removeStorageSync(HISTORY_KEY);
  } catch {
    // Silently fail
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --skipLibCheck src/utils/storage.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/utils/storage.ts
git commit -m "feat: add Taro Storage wrapper for learn history"
```

---

### Task 4: AppContext State Management

**Files:**
- Create: `src/context/AppContext.tsx`
- Depends on: `src/types/word.ts`, `src/utils/storage.ts`

- [ ] **Step 1: Write AppContext with all state and actions**

```typescript
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Word, LearnRecord } from '../types/word';
import { getLearnHistory, setLearnHistory } from '../utils/storage';
import vocabulary from '../data/vocabulary.json';

interface AppContextValue {
  vocabulary: Word[];
  currentWord: Word | null;
  learnHistory: LearnRecord[];
  setCurrentWord: (word: Word) => void;
  markAsLearned: (wordId: string) => void;
  removeRecord: (wordId: string) => void;
  isLearned: (wordId: string) => boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [currentWord, setCurrentWordState] = useState<Word | null>(null);
  const [learnHistory, setLearnHistoryState] = useState<LearnRecord[]>([]);

  useEffect(() => {
    setLearnHistoryState(getLearnHistory());
  }, []);

  const setCurrentWord = useCallback((word: Word) => {
    setCurrentWordState(word);
  }, []);

  const isLearned = useCallback((wordId: string) => {
    return learnHistory.some(r => r.wordId === wordId);
  }, [learnHistory]);

  const markAsLearned = useCallback((wordId: string) => {
    const word = vocabulary.find((w: Word) => w.id === wordId);
    if (!word) return;

    setLearnHistoryState(prev => {
      const filtered = prev.filter(r => r.wordId !== wordId);
      const updated = [...filtered, { wordId, wordSpell: word.spell, learnedAt: Date.now() }];
      setLearnHistory(updated);
      return updated;
    });
  }, []);

  const removeRecord = useCallback((wordId: string) => {
    setLearnHistoryState(prev => {
      const updated = prev.filter(r => r.wordId !== wordId);
      setLearnHistory(updated);
      return updated;
    });
  }, []);

  const value: AppContextValue = {
    vocabulary: vocabulary as Word[],
    currentWord,
    learnHistory,
    setCurrentWord,
    markAsLearned,
    removeRecord,
    isLearned,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used within AppContextProvider');
  }
  return ctx;
}
```

- [ ] **Step 2: Add vocabulary.json type declaration**

Create `src/data/vocabulary.d.ts`:

```typescript
import type { Word } from '../types/word';
declare const vocabulary: Word[];
export default vocabulary;
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit --skipLibCheck src/context/AppContext.tsx`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/context/AppContext.tsx src/data/vocabulary.d.ts
git commit -m "feat: add AppContext with vocabulary, history, and actions"
```

---

### Task 5: App Config + Entry Point

**Files:**
- Modify: `src/app.config.ts`
- Modify: `src/app.tsx`

- [ ] **Step 1: Update app.config.ts with TabBar and all pages**

```typescript
export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/detail/detail',
    'pages/history/history',
  ],
  tabBar: {
    list: [
      {
        pagePath: 'pages/index/index',
        text: '选词',
        iconPath: 'assets/tab_book.png',
        selectedIconPath: 'assets/tab_book_active.png',
      },
      {
        pagePath: 'pages/history/history',
        text: '历史',
        iconPath: 'assets/tab_clock.png',
        selectedIconPath: 'assets/tab_clock_active.png',
      },
    ],
    color: '#999999',
    selectedColor: '#07c160',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'one-word',
    navigationBarTextStyle: 'black',
  },
});
```

- [ ] **Step 2: Update app.tsx to wrap with AppContextProvider**

```typescript
import { PropsWithChildren } from 'react';
import { AppContextProvider } from './context/AppContext';
import './app.scss';

function App({ children }: PropsWithChildren<any>) {
  return (
    <AppContextProvider>
      {children}
    </AppContextProvider>
  );
}

export default App;
```

- [ ] **Step 3: Create placeholder tab icons**

Since tab icons are required but we don't have real assets, create a note or use empty strings. Actually, Taro allows tabBar without icons. Let's use text-only tabs for now by removing icon fields:

Revised `app.config.ts` tabBar:

```typescript
tabBar: {
  list: [
    { pagePath: 'pages/index/index', text: '选词' },
    { pagePath: 'pages/history/history', text: '历史' },
  ],
  color: '#999999',
  selectedColor: '#07c160',
  backgroundColor: '#ffffff',
  borderStyle: 'black',
},
```

- [ ] **Step 4: Verify build succeeds**

Run: `npm run build:weapp`
Expected: Build completes without errors (may have warnings, but no fatal errors)

- [ ] **Step 5: Commit**

```bash
git add src/app.config.ts src/app.tsx
git commit -m "feat: configure TabBar and wrap app with AppContextProvider"
```

---

### Task 6: FloatingWord Component

**Files:**
- Create: `src/components/FloatingWord.tsx`

- [ ] **Step 1: Write FloatingWord component**

```typescript
import { View, Text } from '@tarojs/components';
import type { Word } from '../types/word';

interface FloatingWordProps {
  word: Word;
  isLearned: boolean;
  onClick: (word: Word) => void;
  style?: React.CSSProperties;
}

export default function FloatingWord({ word, isLearned, onClick, style }: FloatingWordProps) {
  return (
    <View
      className={`floating-word ${isLearned ? 'floating-word--learned' : ''}`}
      style={style}
      onClick={() => onClick(word)}
    >
      <Text className="floating-word__text">{word.spell}</Text>
    </View>
  );
}
```

- [ ] **Step 2: Write component styles (inline in SCSS, used by index page)**

The styles will be in `src/pages/index/index.scss` since this component is specific to the index page. But for reusability, we can keep them in the component's scope. In Taro, component styles are typically co-located. Let's add a companion SCSS file:

Create `src/components/FloatingWord.scss`:

```scss
.floating-word {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 16px 24px;
  border-radius: 50px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  transition: transform 0.2s ease;

  &__text {
    color: #ffffff;
    font-size: 16px;
    font-weight: 600;
  }

  &--learned {
    background: linear-gradient(135deg, #c0c0c0 0%, #a0a0a0 100%);
    box-shadow: 0 4px 15px rgba(160, 160, 160, 0.3);
    opacity: 0.6;
  }

  :active {
    transform: scale(0.95);
  }
}
```

- [ ] **Step 3: Import styles in component**

Update `src/components/FloatingWord.tsx` to add:

```typescript
import './FloatingWord.scss';
```

at the top of imports.

- [ ] **Step 4: Verify build**

Run: `npm run build:weapp 2>&1 | tail -20`
Expected: No compilation errors

- [ ] **Step 5: Commit**

```bash
git add src/components/FloatingWord.tsx src/components/FloatingWord.scss
git commit -m "feat: add FloatingWord component with learned state styling"
```

---

### Task 7: WordCard Component

**Files:**
- Create: `src/components/WordCard.tsx`
- Create: `src/components/WordCard.scss`

- [ ] **Step 1: Write WordCard component**

```typescript
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
```

- [ ] **Step 2: Write WordCard styles**

```scss
.word-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 32px 24px;
  margin: 0 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

  &__header {
    text-align: center;
    margin-bottom: 24px;
    padding-bottom: 24px;
    border-bottom: 1px solid #f0f0f0;
  }

  &__spell {
    display: block;
    font-size: 36px;
    font-weight: 700;
    color: #333333;
    margin-bottom: 8px;
  }

  &__phonetic {
    display: block;
    font-size: 16px;
    color: #888888;
  }

  &__meaning,
  &__example {
    margin-bottom: 20px;
  }

  &__label {
    display: block;
    font-size: 12px;
    color: #07c160;
    font-weight: 600;
    margin-bottom: 8px;
    text-transform: uppercase;
  }

  &__text {
    display: block;
    font-size: 16px;
    color: #333333;
    line-height: 1.6;

    &--en {
      color: #555555;
    }

    &--cn {
      color: #888888;
      font-size: 14px;
      margin-top: 4px;
    }
  }
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build:weapp 2>&1 | tail -20`
Expected: No compilation errors

- [ ] **Step 4: Commit**

```bash
git add src/components/WordCard.tsx src/components/WordCard.scss
git commit -m "feat: add WordCard component for detail page"
```

---

### Task 8: Index Page (Floating Words)

**Files:**
- Modify: `src/pages/index/index.tsx`
- Modify: `src/pages/index/index.scss`
- Modify: `src/pages/index/index.config.ts`

- [ ] **Step 1: Update index.config.ts**

```typescript
export default definePageConfig({
  navigationBarTitleText: '选词',
});
```

- [ ] **Step 2: Rewrite index.tsx with floating words**

```typescript
import { View, Text } from '@tarojs/components';
import { useCallback, useMemo } from 'react';
import Taro from '@tarojs/taro';
import { useAppContext } from '../../context/AppContext';
import FloatingWord from '../../components/FloatingWord';
import type { Word } from '../../types/word';
import './index.scss';

interface PositionedWord {
  word: Word;
  left: string;
  top: string;
  animDelay: string;
  animDuration: string;
}

export default function Index() {
  const { vocabulary, learnHistory, isLearned, setCurrentWord } = useAppContext();

  const todayCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return learnHistory.filter(r => r.learnedAt >= today.getTime()).length;
  }, [learnHistory]);

  const positionedWords = useMemo(() => {
    const result: PositionedWord[] = [];
    vocabulary.forEach((word, index) => {
      // Divide screen into zones by difficulty
      // difficulty 1: left 5%-30%, 2: middle 35%-60%, 3: right 65%-90%
      let minLeft: number, maxLeft: number;
      if (word.difficulty === 1) { minLeft = 5; maxLeft = 30; }
      else if (word.difficulty === 2) { minLeft = 35; maxLeft = 60; }
      else { minLeft = 65; maxLeft = 90; }

      // Use index + word.id hash for deterministic positioning
      const hash = word.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const left = minLeft + (hash % (maxLeft - minLeft));
      const top = 10 + (hash % 70); // 10%-80% vertical range

      result.push({
        word,
        left: `${left}%`,
        top: `${top}%`,
        animDelay: `${(hash % 5)}s`,
        animDuration: `${4 + (hash % 4)}s`,
      });
    });
    return result;
  }, [vocabulary]);

  const handleWordClick = useCallback((word: Word) => {
    setCurrentWord(word);
    Taro.navigateTo({ url: '/pages/detail/detail' });
  }, [setCurrentWord]);

  return (
    <View className="index">
      <View className="index__header">
        <Text className="index__title">选一个单词开始背诵</Text>
        <Text className="index__subtitle">今日已背 {todayCount} 个</Text>
      </View>

      <View className="index__words">
        {positionedWords.map(({ word, left, top, animDelay, animDuration }) => (
          <View
            key={word.id}
            className="index__word-wrapper"
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
  );
}
```

- [ ] **Step 3: Write index.scss with floating animations**

```scss
.index {
  min-height: 100vh;
  background: linear-gradient(180deg, #f5f7fa 0%, #e4e8f0 100%);
  position: relative;
  overflow: hidden;

  &__header {
    padding: 20px;
    text-align: center;
    z-index: 10;
    position: relative;
  }

  &__title {
    display: block;
    font-size: 20px;
    font-weight: 600;
    color: #333333;
    margin-bottom: 8px;
  }

  &__subtitle {
    display: block;
    font-size: 14px;
    color: #07c160;
    font-weight: 500;
  }

  &__words {
    position: relative;
    height: calc(100vh - 120px);
    width: 100%;
  }

  &__word-wrapper {
    position: absolute;
    animation: float-y ease-in-out infinite;
  }
}

@keyframes float-y {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build:weapp 2>&1 | tail -20`
Expected: No compilation errors

- [ ] **Step 5: Commit**

```bash
git add src/pages/index/index.tsx src/pages/index/index.scss src/pages/index/index.config.ts
git commit -m "feat: implement index page with floating word bubbles"
```

---

### Task 9: Detail Page (Recite)

**Files:**
- Create: `src/pages/detail/detail.config.ts`
- Create: `src/pages/detail/detail.tsx`
- Create: `src/pages/detail/detail.scss`

- [ ] **Step 1: Write detail.config.ts**

```typescript
export default definePageConfig({
  navigationBarTitleText: '背诵',
});
```

- [ ] **Step 2: Write detail.tsx**

```typescript
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import WordCard from '../../components/WordCard';
import './detail.scss';

export default function Detail() {
  const { currentWord, markAsLearned, learnHistory } = useAppContext();

  const todayCount = learnHistory.filter(r => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return r.learnedAt >= today.getTime();
  }).length;

  const handleMarkLearned = useCallback(() => {
    if (currentWord) {
      markAsLearned(currentWord.id);
      Taro.showToast({ title: '已掌握！', icon: 'success', duration: 1500 });
      setTimeout(() => {
        Taro.navigateBack();
      }, 1500);
    }
  }, [currentWord, markAsLearned]);

  if (!currentWord) {
    return (
      <View className="detail detail--empty">
        <Text>未选择单词</Text>
      </View>
    );
  }

  return (
    <View className="detail">
      <WordCard word={currentWord} />

      <View className="detail__actions">
        <Button
          className="detail__button"
          type="primary"
          onClick={handleMarkLearned}
        >
          已掌握
        </Button>
        <Text className="detail__hint">今日已背 {todayCount} 个</Text>
      </View>
    </View>
  );
}
```

- [ ] **Step 3: Write detail.scss**

```scss
.detail {
  min-height: 100vh;
  background: linear-gradient(180deg, #f5f7fa 0%, #e4e8f0 100%);
  padding: 40px 0;
  display: flex;
  flex-direction: column;
  align-items: center;

  &--empty {
    justify-content: center;
    font-size: 16px;
    color: #888888;
  }

  &__actions {
    margin-top: 40px;
    width: 100%;
    padding: 0 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  &__button {
    width: 100% !important;
    height: 48px;
    line-height: 48px;
    font-size: 16px;
    font-weight: 600;
    background: #07c160 !important;
    border-radius: 24px !important;
    margin-bottom: 16px;
  }

  &__hint {
    font-size: 14px;
    color: #888888;
  }
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build:weapp 2>&1 | tail -20`
Expected: No compilation errors

- [ ] **Step 5: Commit**

```bash
git add src/pages/detail/
git commit -m "feat: implement detail page with recite and mark learned"
```

---

### Task 10: History Page

**Files:**
- Create: `src/pages/history/history.config.ts`
- Create: `src/pages/history/history.tsx`
- Create: `src/pages/history/history.scss`

- [ ] **Step 1: Write history.config.ts**

```typescript
export default definePageConfig({
  navigationBarTitleText: '历史记录',
});
```

- [ ] **Step 2: Write history.tsx**

```typescript
import { View, Text } from '@tarojs/components';
import { useCallback, useMemo } from 'react';
import Taro from '@tarojs/taro';
import { useAppContext } from '../../context/AppContext';
import './history.scss';

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}月${day}日 ${hours}:${minutes}`;
}

export default function History() {
  const { learnHistory, removeRecord } = useAppContext();

  const sortedHistory = useMemo(() => {
    return [...learnHistory].sort((a, b) => b.learnedAt - a.learnedAt);
  }, [learnHistory]);

  const handleDelete = useCallback((wordId: string) => {
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这条学习记录吗？',
      success: (res) => {
        if (res.confirm) {
          removeRecord(wordId);
        }
      },
    });
  }, [removeRecord]);

  return (
    <View className="history">
      <View className="history__summary">
        <Text className="history__count">累计掌握 {learnHistory.length} 个单词</Text>
      </View>

      {sortedHistory.length === 0 ? (
        <View className="history__empty">
          <Text className="history__empty-text">还没有背过单词</Text>
          <Text className="history__empty-sub">去选词页开始吧</Text>
        </View>
      ) : (
        <View className="history__list">
          {sortedHistory.map((record) => (
            <View key={record.wordId} className="history__item">
              <View className="history__item-main">
                <Text className="history__word">{record.wordSpell}</Text>
                <Text className="history__date">{formatDate(record.learnedAt)}</Text>
              </View>
              <View
                className="history__delete"
                onClick={() => handleDelete(record.wordId)}
              >
                <Text className="history__delete-text">删除</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
```

- [ ] **Step 3: Write history.scss**

```scss
.history {
  min-height: 100vh;
  background: #f5f7fa;

  &__summary {
    padding: 20px;
    background: #ffffff;
    margin-bottom: 12px;
    text-align: center;
  }

  &__count {
    font-size: 16px;
    color: #333333;
    font-weight: 600;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
  }

  &__empty-text {
    font-size: 18px;
    color: #888888;
    margin-bottom: 8px;
  }

  &__empty-sub {
    font-size: 14px;
    color: #aaaaaa;
  }

  &__list {
    padding: 0 16px;
  }

  &__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #ffffff;
    border-radius: 12px;
    padding: 16px 20px;
    margin-bottom: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  &__item-main {
    flex: 1;
  }

  &__word {
    display: block;
    font-size: 18px;
    font-weight: 600;
    color: #333333;
    margin-bottom: 4px;
  }

  &__date {
    display: block;
    font-size: 13px;
    color: #888888;
  }

  &__delete {
    padding: 8px 16px;
    border-radius: 8px;
    background: #ff4d4f;
  }

  &__delete-text {
    font-size: 14px;
    color: #ffffff;
    font-weight: 500;
  }
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build:weapp 2>&1 | tail -20`
Expected: No compilation errors

- [ ] **Step 5: Commit**

```bash
git add src/pages/history/
git commit -m "feat: implement history page with list and delete"
```

---

## Self-Review Checklist

### Spec Coverage

| Spec Requirement | Task |
|------------------|------|
| Word type with spell/phonetic/meaning/example/difficulty | Task 1 |
| LearnRecord type | Task 1 |
| ~50 sample words, 3 difficulty levels | Task 2 |
| Storage wrapper for learn_history | Task 3 |
| AppContext with vocabulary/learnHistory/actions | Task 4 |
| TabBar with 选词/历史 | Task 5 |
| Floating word bubbles by difficulty zone | Task 6, 8 |
| CSS keyframes floating animation | Task 8 |
| Learned words shown as gray/transparent | Task 6 |
| Today count display | Task 8 |
| Click word → navigate to detail | Task 8 |
| Detail page: spell/phonetic/meaning/example | Task 7, 9 |
| 已掌握 button → mark learned → navigate back | Task 9 |
| Toast feedback on mark learned | Task 9 |
| History page: time-descending list | Task 10 |
| Delete record with confirm modal | Task 10 |
| Empty state for history | Task 10 |
| Cumulative count on history page | Task 10 |

### Placeholder Scan

- No TBD, TODO, or incomplete sections
- No vague requirements
- All code blocks contain complete code
- All commands have expected output

### Type Consistency

- `Word` interface: `id`, `spell`, `phonetic`, `meaning`, `example` (en/cn), `difficulty: 1|2|3`
- `LearnRecord` interface: `wordId`, `wordSpell`, `learnedAt`
- `AppContextValue`: matches design doc exactly
- All function names consistent across tasks
